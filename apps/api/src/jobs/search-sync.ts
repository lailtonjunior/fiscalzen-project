import type { Job } from 'bullmq';
import { eq } from 'drizzle-orm';
import { db } from '../config/database.js';
import { documents } from '@fiscalzen/database/schema';
import { search, type DocumentSearchRecord } from '../services/search.js';
import { type SearchSyncJobData } from './queues.js';
import { logger } from './events.js';

// ============================================
// Main Job Processor
// ============================================

export async function processSearchSync(job: Job<SearchSyncJobData>) {
  const { documentId, tenantId, action } = job.data;

  logger.info(`Processing search sync`, {
    jobId: job.id,
    documentId,
    action,
  });

  try {
    switch (action) {
      case 'index':
      case 'update':
        return await indexDocument(documentId, tenantId);
      case 'delete':
        return await deleteDocument(documentId);
      default:
        logger.warn(`Unknown search sync action`, { action });
        return { success: false, error: 'Unknown action' };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    logger.error(`Search sync failed`, {
      jobId: job.id,
      documentId,
      action,
      error: message,
    });

    throw error;
  }
}

// ============================================
// Index Document
// ============================================

async function indexDocument(documentId: string, tenantId: string) {
  // Fetch document from database
  const document = await db.query.documents.findFirst({
    where: eq(documents.id, documentId),
  });

  if (!document) {
    logger.warn(`Document not found for indexing`, { documentId });
    return { success: false, error: 'Document not found' };
  }

  // Prepare search record
  const searchRecord: DocumentSearchRecord = {
    id: document.id,
    tenantId: document.tenantId,
    companyId: document.companyId,
    chave: document.chave,
    numero: document.numero,
    serie: document.serie,
    docType: document.docType,
    situacao: document.situacao,
    dataEmissao: document.dataEmissao.toISOString(),
    valorTotal: Number(document.valorTotal),
    emitRazaoSocial: document.emitRazaoSocial,
    emitCnpj: document.emitCnpj,
    destRazaoSocial: document.destRazaoSocial ?? undefined,
    destCnpj: document.destCnpj ?? undefined,
    natOp: document.natOp ?? undefined,
    infAdic: document.infAdic ?? undefined,
    uf: document.uf,
    createdAt: document.createdAt.toISOString(),
  };

  // Index in Meilisearch
  await search.indexDocument(searchRecord);

  logger.info(`Document indexed successfully`, {
    documentId,
    chave: document.chave,
  });

  return { success: true, action: 'indexed', documentId };
}

// ============================================
// Delete Document
// ============================================

async function deleteDocument(documentId: string) {
  await search.deleteDocument(documentId);

  logger.info(`Document removed from search index`, { documentId });

  return { success: true, action: 'deleted', documentId };
}

// ============================================
// Batch Index
// ============================================

export async function batchIndexDocuments(
  documentIds: string[],
  tenantId: string
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  // Fetch all documents
  const docs = await db.query.documents.findMany({
    where: (doc, { inArray }) => inArray(doc.id, documentIds),
  });

  // Prepare search records
  const searchRecords: DocumentSearchRecord[] = docs.map((doc) => ({
    id: doc.id,
    tenantId: doc.tenantId,
    companyId: doc.companyId,
    chave: doc.chave,
    numero: doc.numero,
    serie: doc.serie,
    docType: doc.docType,
    situacao: doc.situacao,
    dataEmissao: doc.dataEmissao.toISOString(),
    valorTotal: Number(doc.valorTotal),
    emitRazaoSocial: doc.emitRazaoSocial,
    emitCnpj: doc.emitCnpj,
    destRazaoSocial: doc.destRazaoSocial ?? undefined,
    destCnpj: doc.destCnpj ?? undefined,
    natOp: doc.natOp ?? undefined,
    uf: doc.uf,
    createdAt: doc.createdAt.toISOString(),
  }));

  try {
    await search.indexDocuments(searchRecords);
    success = searchRecords.length;
  } catch (error) {
    failed = searchRecords.length;
    logger.error(`Batch index failed`, {
      count: documentIds.length,
      error: error instanceof Error ? error.message : 'Unknown',
    });
  }

  return { success, failed };
}

// ============================================
// Reindex All Documents
// ============================================

export async function reindexAllDocuments(tenantId: string): Promise<{ total: number }> {
  logger.info(`Starting full reindex for tenant`, { tenantId });

  const batchSize = 100;
  let offset = 0;
  let total = 0;

  while (true) {
    const batch = await db.query.documents.findMany({
      where: eq(documents.tenantId, tenantId),
      limit: batchSize,
      offset,
    });

    if (batch.length === 0) {
      break;
    }

    const searchRecords: DocumentSearchRecord[] = batch.map((doc) => ({
      id: doc.id,
      tenantId: doc.tenantId,
      companyId: doc.companyId,
      chave: doc.chave,
      numero: doc.numero,
      serie: doc.serie,
      docType: doc.docType,
      situacao: doc.situacao,
      dataEmissao: doc.dataEmissao.toISOString(),
      valorTotal: Number(doc.valorTotal),
      emitRazaoSocial: doc.emitRazaoSocial,
      emitCnpj: doc.emitCnpj,
      destRazaoSocial: doc.destRazaoSocial ?? undefined,
      destCnpj: doc.destCnpj ?? undefined,
      natOp: doc.natOp ?? undefined,
      uf: doc.uf,
      createdAt: doc.createdAt.toISOString(),
    }));

    await search.indexDocuments(searchRecords);

    total += batch.length;
    offset += batchSize;

    logger.info(`Reindex progress`, { processed: total });
  }

  logger.info(`Full reindex completed`, { tenantId, total });

  return { total };
}
