import type { Job } from 'bullmq';
import { eq, and } from 'drizzle-orm';
import { db } from '../config/database';
import { documents, documentEvents } from '@fiscalzen/database/schema';
import {
  parseNFe,
  parseCTe,
  parseMDFe,
  parseResNFe,
  parseResEvento,
  parseProcEventoNFe,
  detectXmlType,
} from '@fiscalzen/xml-parser';
import { storage, type StorageKey } from '../services/storage';
import { addSearchSyncJob, type XmlProcessorJobData } from './queues';
import { logger } from './events';

// ============================================
// Main Job Processor
// ============================================

export async function processXmlProcessor(job: Job<XmlProcessorJobData>) {
  const { companyId, tenantId, nsu, schema, xmlContent, docType, isResumo, isEvento } = job.data;

  logger.info(`Processing XML`, {
    jobId: job.id,
    companyId,
    nsu,
    schema,
    isResumo,
    isEvento,
  });

  try {
    // Detect XML type for more accurate parsing
    const detection = detectXmlType(xmlContent);

    // Handle different document types
    if (isEvento || detection.type?.includes('evento')) {
      return await processEvento(job.data, xmlContent, detection);
    }

    if (isResumo || schema.includes('res')) {
      return await processResumo(job.data, xmlContent, detection);
    }

    // Full document (procNFe, procCTe, procMDFe)
    return await processFullDocument(job.data, xmlContent, detection);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    logger.error(`XML processing failed`, {
      jobId: job.id,
      companyId,
      nsu,
      error: message,
    });

    throw error;
  }
}

// ============================================
// Process Full Document
// ============================================

async function processFullDocument(
  data: XmlProcessorJobData,
  xmlContent: string,
  detection: ReturnType<typeof detectXmlType>
) {
  const { companyId, tenantId, nsu, docType } = data;

  // Parse based on document type
  let parsedData: DocumentData;

  switch (docType) {
    case 'NFE':
      parsedData = parseNFeDocument(xmlContent);
      break;
    case 'CTE':
      parsedData = parseCTeDocument(xmlContent);
      break;
    case 'MDFE':
      parsedData = parseMDFeDocument(xmlContent);
      break;
    default:
      throw new Error(`Unsupported document type: ${docType}`);
  }

  // Check if document already exists
  const existing = await db.query.documents.findFirst({
    where: eq(documents.chave, parsedData.chave),
  });

  if (existing) {
    logger.info(`Document already exists, skipping`, {
      chave: parsedData.chave,
      existingId: existing.id,
    });

    // Check if we need to update (e.g., different situacao)
    if (existing.situacao !== parsedData.situacao) {
      await updateExistingDocument(existing.id, parsedData);
    }

    return { success: true, action: 'skip', documentId: existing.id };
  }

  // Store XML in S3
  const dataEmissao = new Date(parsedData.dataEmissao);
  const storageParams: StorageKey = {
    tenantId,
    companyId,
    docType,
    year: dataEmissao.getFullYear(),
    month: dataEmissao.getMonth() + 1,
    documentId: parsedData.chave,
  };

  const storageKey = await storage.uploadXml(storageParams, xmlContent);

  // Insert document
  const [document] = await db
    .insert(documents)
    .values({
      tenantId,
      companyId,
      chave: parsedData.chave,
      numero: parsedData.numero,
      serie: parsedData.serie,
      docType,
      situacao: parsedData.situacao,
      dataEmissao: new Date(parsedData.dataEmissao),
      valorTotal: parsedData.valorTotal.toString(),
      emitCnpj: parsedData.emitCnpj,
      emitRazaoSocial: parsedData.emitRazaoSocial,
      destCnpj: parsedData.destCnpj,
      destRazaoSocial: parsedData.destRazaoSocial,
      natOp: parsedData.natOp,
      uf: parsedData.uf,
      nsu,
      storageKey,
      xmlOriginal: xmlContent,
    })
    .returning();

  logger.info(`Document created`, {
    documentId: document.id,
    chave: document.chave,
    docType,
  });

  // Queue for search indexing
  await addSearchSyncJob({
    documentId: document.id,
    tenantId,
    action: 'index',
  });

  return { success: true, action: 'create', documentId: document.id };
}

// ============================================
// Process Resumo (resNFe, resCTe)
// ============================================

async function processResumo(
  data: XmlProcessorJobData,
  xmlContent: string,
  detection: ReturnType<typeof detectXmlType>
) {
  const { companyId, tenantId, nsu, docType } = data;

  // Parse resumo
  const resumo = parseResNFe(xmlContent);

  // Check if document already exists
  const existing = await db.query.documents.findFirst({
    where: eq(documents.chave, resumo.chNFe),
  });

  if (existing) {
    logger.info(`Resumo for existing document, skipping`, {
      chave: resumo.chNFe,
      existingId: existing.id,
    });
    return { success: true, action: 'skip', documentId: existing.id };
  }

  // Create placeholder document marked as pending manifestation
  const [document] = await db
    .insert(documents)
    .values({
      tenantId,
      companyId,
      chave: resumo.chNFe,
      numero: resumo.nNF ?? '',
      serie: resumo.serie ?? '',
      docType,
      situacao: resumo.cSitNFe === '1' ? 'autorizada' : 'pendente',
      dataEmissao: new Date(resumo.dhEmi),
      valorTotal: resumo.vNF.toString(),
      emitCnpj: resumo.CNPJ,
      emitRazaoSocial: resumo.xNome,
      emitIe: resumo.IE,
      uf: '', // Will be extracted from chave
      nsu,
      // Mark as pending manifestation - needs ciencia to get full XML
      manifestacao: null,
      xmlOriginal: xmlContent,
    })
    .returning();

  logger.info(`Resumo document created (pending manifestation)`, {
    documentId: document.id,
    chave: document.chave,
  });

  // Queue for search indexing
  await addSearchSyncJob({
    documentId: document.id,
    tenantId,
    action: 'index',
  });

  return { success: true, action: 'create_resumo', documentId: document.id };
}

// ============================================
// Process Evento
// ============================================

async function processEvento(
  data: XmlProcessorJobData,
  xmlContent: string,
  detection: ReturnType<typeof detectXmlType>
) {
  const { companyId, tenantId, nsu } = data;

  // Try to parse as resEvento first
  let eventoData: EventoData;

  try {
    const resEvento = parseResEvento(xmlContent);
    eventoData = {
      chave: resEvento.chNFe,
      tpEvento: resEvento.tpEvento,
      descEvento: resEvento.xEvento,
      dhEvento: resEvento.dhEvento,
      nSeqEvento: resEvento.nSeqEvento,
      nProt: resEvento.nProt,
      cStat: '135', // Assumed authorized if returned
      xMotivo: '',
    };
  } catch {
    // Try procEventoNFe
    const procEvento = parseProcEventoNFe(xmlContent);
    eventoData = {
      chave: procEvento.chNFe,
      tpEvento: procEvento.tpEvento,
      descEvento: procEvento.descEvento,
      dhEvento: procEvento.dhEvento,
      nSeqEvento: procEvento.nSeqEvento ?? 1,
      nProt: procEvento.nProt,
      cStat: procEvento.cStat ?? '135',
      xMotivo: procEvento.xMotivo ?? '',
    };
  }

  // Find related document
  const document = await db.query.documents.findFirst({
    where: eq(documents.chave, eventoData.chave),
  });

  if (!document) {
    logger.warn(`Document not found for event`, {
      chave: eventoData.chave,
      tpEvento: eventoData.tpEvento,
    });
    return { success: true, action: 'skip_no_document' };
  }

  // Check if event already exists
  const existingEvent = await db.query.documentEvents.findFirst({
    where: and(
      eq(documentEvents.documentId, document.id),
      eq(documentEvents.tpEvento, eventoData.tpEvento),
      eq(documentEvents.nSeqEvento, eventoData.nSeqEvento)
    ),
  });

  if (existingEvent) {
    logger.info(`Event already exists, skipping`, {
      documentId: document.id,
      tpEvento: eventoData.tpEvento,
    });
    return { success: true, action: 'skip', eventId: existingEvent.id };
  }

  // Insert event
  const [event] = await db
    .insert(documentEvents)
    .values({
      documentId: document.id,
      tpEvento: eventoData.tpEvento,
      descEvento: eventoData.descEvento,
      nSeqEvento: eventoData.nSeqEvento,
      dhEvento: new Date(eventoData.dhEvento),
      dhRegEvento: new Date(),
      nProt: eventoData.nProt,
      cStat: eventoData.cStat,
      xMotivo: eventoData.xMotivo,
      xmlEvento: xmlContent,
    })
    .returning();

  // Update document based on event type
  await updateDocumentFromEvento(document.id, eventoData);

  logger.info(`Event created`, {
    eventId: event.id,
    documentId: document.id,
    tpEvento: eventoData.tpEvento,
  });

  return { success: true, action: 'create_event', eventId: event.id };
}

// ============================================
// Helper Functions
// ============================================

interface DocumentData {
  chave: string;
  numero: string;
  serie: string;
  dataEmissao: string;
  valorTotal: number;
  emitCnpj: string;
  emitRazaoSocial: string;
  destCnpj?: string;
  destRazaoSocial?: string;
  natOp?: string;
  situacao: string;
  uf: string;
}

interface EventoData {
  chave: string;
  tpEvento: string;
  descEvento: string;
  dhEvento: string;
  nSeqEvento: number;
  nProt?: string;
  cStat: string;
  xMotivo: string;
}

function parseNFeDocument(xml: string): DocumentData {
  const nfe = parseNFe(xml);
  return {
    chave: nfe.chave,
    numero: nfe.numero,
    serie: nfe.serie,
    dataEmissao: nfe.dataEmissao,
    valorTotal: nfe.valorTotal,
    emitCnpj: nfe.emitente.cnpj,
    emitRazaoSocial: nfe.emitente.razaoSocial,
    destCnpj: nfe.destinatario?.cnpj,
    destRazaoSocial: nfe.destinatario?.razaoSocial,
    natOp: nfe.natOp,
    situacao: 'autorizada',
    uf: nfe.uf,
  };
}

function parseCTeDocument(xml: string): DocumentData {
  const cte = parseCTe(xml);
  return {
    chave: cte.chave,
    numero: cte.numero,
    serie: cte.serie,
    dataEmissao: cte.dataEmissao,
    valorTotal: cte.valorTotal,
    emitCnpj: cte.emitente.cnpj,
    emitRazaoSocial: cte.emitente.razaoSocial,
    destCnpj: cte.destinatario?.cnpj,
    destRazaoSocial: cte.destinatario?.razaoSocial,
    natOp: cte.natOp,
    situacao: 'autorizada',
    uf: cte.uf,
  };
}

function parseMDFeDocument(xml: string): DocumentData {
  const mdfe = parseMDFe(xml);
  return {
    chave: mdfe.chave,
    numero: mdfe.numero,
    serie: mdfe.serie,
    dataEmissao: mdfe.dataEmissao,
    valorTotal: mdfe.valorTotal ?? 0,
    emitCnpj: mdfe.emitente.cnpj,
    emitRazaoSocial: mdfe.emitente.razaoSocial,
    situacao: 'autorizada',
    uf: mdfe.uf,
  };
}

async function updateExistingDocument(documentId: string, data: Partial<DocumentData>) {
  await db
    .update(documents)
    .set({
      situacao: data.situacao,
      updatedAt: new Date(),
    })
    .where(eq(documents.id, documentId));
}

async function updateDocumentFromEvento(documentId: string, evento: EventoData) {
  const updates: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  // Update situacao based on event type
  switch (evento.tpEvento) {
    case '110111': // Cancelamento
      updates.situacao = 'cancelada';
      break;
    case '210200': // Confirmacao da Operacao
    case '210210': // Ciencia da Emissao
    case '210220': // Desconhecimento da Operacao
    case '210240': // Operacao nao Realizada
      updates.manifestacao = evento.tpEvento;
      updates.manifestacaoData = new Date(evento.dhEvento);
      break;
  }

  await db.update(documents).set(updates).where(eq(documents.id, documentId));
}
