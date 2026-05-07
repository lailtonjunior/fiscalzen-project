import { eq, and, sql, desc, asc, gte, lte, or, ilike } from "drizzle-orm";
import { documents } from "@fiscalzen/database/schema";
import { NotFoundError, ValidationError, ConflictError } from "../../utils/errors";
import { StorageService, type StorageKey } from "../../services/storage";
import { search } from "../../services/search";
import { parseNFe, parseCTe, detectDocumentType } from "@fiscalzen/xml-parser";
import { PdfService } from "../pdf/service";
import { RelationsService } from "../relations/service";
import type { ListDocumentsQuery, SearchDocumentsQuery } from "./schemas";
import {
  buildPdfFilename,
  buildXmlFilename,
  getPdfRepresentation,
  isPdfSupportedDocumentType,
} from "./pdf-helpers";
import { sha256Hex } from "../../utils/encryption";
import { injectable, inject, container } from "tsyringe";
import { DATABASE_TOKEN } from "../../providers/database";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "@fiscalzen/database/schema";
import type { Situacao, DocType } from "@fiscalzen/database/schema";
import { historyService } from "../history/service";
import { logger } from "../../config/logger";

type Database = NodePgDatabase<typeof schema>;

/**
 * Type-safe column references for documents table.
 * Schema is aligned - no drift handling needed.
 */

function assertSafeXml(xml: string) {
  const trimmed = xml.trim();

  if (!trimmed.startsWith("<")) {
    throw new ValidationError("Conteudo XML invalido.");
  }

  // Hard block DTD / ENTITY to reduce XXE risk if any downstream parser expands entities.
  const upper = trimmed.toUpperCase();
  if (upper.includes("<!DOCTYPE") || upper.includes("<!ENTITY")) {
    throw new ValidationError("XML contem declaracoes nao permitidas (DOCTYPE/ENTITY).");
  }

  const sizeBytes = Buffer.byteLength(xml, "utf-8");
  const MAX_BYTES = 10 * 1024 * 1024; // align with multipart limit
  if (sizeBytes > MAX_BYTES) {
    throw new ValidationError("XML excede o tamanho maximo permitido (10MB).");
  }
}

function toIntOrThrow(label: string, v: string): number {
  const n = Number.parseInt(v, 10);
  if (!Number.isFinite(n)) throw new ValidationError(`${label} invalido.`);
  return n;
}

export interface DocumentAttachmentItem {
  type: "xml" | "pdf";
  label: string;
  available: boolean;
  filename: string;
  downloadPath: string;
  representation?: "DANFE" | "DACTE" | "DACTE_OS";
  statusMessage?: string;
}

@injectable()
export class DocumentsService {
  constructor(
    @inject(DATABASE_TOKEN) private db: Database,
    @inject(StorageService) private storage: StorageService,
    @inject(PdfService) private pdfService: PdfService,
    @inject(RelationsService) private relationsService: RelationsService
  ) { }

  async list(tenantId: string, query: ListDocumentsQuery) {
    const { page, limit, sortBy, sortOrder, ...filters } = query;
    const offset = (page - 1) * limit;

    const conditions: ReturnType<typeof eq>[] = [eq(documents.tenantId, tenantId)];

    if (filters.companyId) conditions.push(eq(documents.companyId, filters.companyId));
    if (filters.docType) conditions.push(eq(documents.docType, filters.docType));
    if (filters.situacao) conditions.push(eq(documents.situacao, filters.situacao as Situacao));
    if (filters.emitCnpj) conditions.push(eq(documents.emitCnpj, filters.emitCnpj));
    if (filters.destCnpj) conditions.push(eq(documents.destCnpjCpf, filters.destCnpj));
    if (filters.numero) conditions.push(eq(documents.numero, Number(filters.numero)));
    if (filters.serie) conditions.push(eq(documents.serie, Number(filters.serie)));
    if (filters.chave) conditions.push(eq(documents.chave, filters.chave));
    if (filters.search) {
      const term = `%${filters.search}%`;
      conditions.push(
        or(
          ilike(documents.chave, term),
          ilike(documents.emitRazao, term),
          ilike(documents.destRazao, term),
          sql`CAST(${documents.numero} AS TEXT) ILIKE ${term}`
        )!
      );
    }

    if (filters.dataInicio) conditions.push(gte(documents.dataEmissao, filters.dataInicio));
    if (filters.dataFim) conditions.push(lte(documents.dataEmissao, filters.dataFim));

    const orderColumn =
      {
        dataEmissao: documents.dataEmissao,
        valorTotal: documents.valorTotal,
        numero: documents.numero,
        createdAt: documents.createdAt,
      }[sortBy] ?? documents.createdAt;

    const orderFn = sortOrder === "asc" ? asc : desc;

    const [items, countResult] = await Promise.all([
      this.db
        .select({
          id: documents.id,
          chave: documents.chave,
          numero: documents.numero,
          serie: documents.serie,
          docType: documents.docType,
          situacao: documents.situacao,
          dataEmissao: documents.dataEmissao,
          valorTotal: documents.valorTotal,
          emitRazao: documents.emitRazao,
          emitCnpj: documents.emitCnpj,
          destRazao: documents.destRazao,
          destCnpjCpf: documents.destCnpjCpf,
          createdAt: documents.createdAt,
        })
        .from(documents)
        .where(and(...conditions))
        .orderBy(orderFn(orderColumn))
        .limit(limit)
        .offset(offset),
      this.db.select({ count: sql<number>`count(*)` }).from(documents).where(and(...conditions)),
    ]);

    return { items, total: Number(countResult[0]?.count ?? 0) };
  }

  async getById(tenantId: string, documentId: string) {
    const document = await this.db.query.documents.findFirst({
      where: and(eq(documents.id, documentId), eq(documents.tenantId, tenantId)),
    });
    if (!document) throw new NotFoundError("Documento", documentId);
    return document;
  }

  async getByChave(tenantId: string, chave: string) {
    // FIX: ensure tenantId filter to avoid cross-tenant leakage.
    const document = await this.db.query.documents.findFirst({
      where: and(eq(documents.chave, chave), eq(documents.tenantId, tenantId)),
    });
    if (!document) throw new NotFoundError("Documento");
    return document;
  }

  async getXml(tenantId: string, documentId: string): Promise<string> {
    const document = await this.getById(tenantId, documentId);

    const key = document.xmlStorageKey;
    if (!key) throw new NotFoundError("XML do documento");

    return this.storage.downloadXml(key);
  }

  async getPdfInfo(tenantId: string, documentId: string) {
    const document = await this.getById(tenantId, documentId);
    const filename = buildPdfFilename(document);

    if (!isPdfSupportedDocumentType(document.docType)) {
      throw new ValidationError(`Tipo de documento nao suportado para PDF: ${document.docType}`);
    }

    if (!document.xmlStorageKey) {
      throw new ValidationError("Documento sem XML armazenado para geracao de PDF");
    }

    return {
      available: true,
      cached: Boolean(document.pdfStorageKey),
      filename,
      representation: getPdfRepresentation(document.docType),
      downloadPath: `/api/v1/documents/${documentId}/pdf/download`,
    };
  }

  async getPdf(
    tenantId: string,
    documentId: string,
    userId?: string
  ): Promise<{ buffer: Buffer; filename: string; cached: boolean }> {
    const document = await this.getById(tenantId, documentId);
    const filename = buildPdfFilename(document);

    if (!isPdfSupportedDocumentType(document.docType)) {
      throw new ValidationError(`Tipo de documento nao suportado para PDF: ${document.docType}`);
    }

    if (!document.xmlStorageKey) {
      throw new ValidationError("Documento sem XML armazenado para geracao de PDF");
    }

    const baseDetails = {
      docType: document.docType,
      chave: document.chave,
      sourceId: document.id,
      correlationId: document.id,
    };

    await historyService.registerEvent({
      tenantId,
      documentId: document.id,
      companyId: document.companyId,
      userId,
      eventType: "pdf.requested",
      source: "pdf",
      title: "Geracao de PDF solicitada",
      summary: `${getPdfRepresentation(document.docType)} solicitado para o documento ${document.chave ?? document.id}`,
      details: baseDetails,
    });

    try {
      if (document.pdfStorageKey) {
        try {
          const pdf = await this.storage.downloadPdf(document.pdfStorageKey);

          await historyService.registerEvent({
            tenantId,
            documentId: document.id,
            companyId: document.companyId,
            userId,
            eventType: "pdf.generated",
            source: "pdf",
            title: "PDF fiscal disponibilizado",
            summary: `${getPdfRepresentation(document.docType)} recuperado do cache para download`,
            details: {
              ...baseDetails,
              cached: true,
            },
          });

          return { buffer: pdf, filename, cached: true };
        } catch {
          // Fall through to regeneration if cached artifact became unavailable.
        }
      }

      const result = await this.pdfService.getPdfBuffer(documentId, tenantId);

      await historyService.registerEvent({
        tenantId,
        documentId: document.id,
        companyId: document.companyId,
        userId,
        eventType: "pdf.generated",
        source: "pdf",
        title: "PDF fiscal gerado",
        summary: `${result.metadata.tipo} gerado para o documento ${document.chave ?? document.id}`,
        details: {
          ...baseDetails,
          cached: result.cached,
          pdfType: result.metadata.tipo,
          generatedAt: result.metadata.geradoEm.toISOString(),
          pages: result.metadata.paginas,
        },
      });

      return {
        buffer: result.buffer,
        filename,
        cached: result.cached,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao gerar PDF";

      await historyService.registerEvent({
        tenantId,
        documentId: document.id,
        companyId: document.companyId,
        userId,
        eventType: "pdf.failed",
        source: "pdf",
        title: "Falha ao gerar PDF",
        summary: `Nao foi possivel disponibilizar PDF para o documento ${document.chave ?? document.id}`,
        details: {
          ...baseDetails,
          error: message,
        },
      });

      throw error;
    }
  }

  async listAttachments(tenantId: string, documentId: string): Promise<DocumentAttachmentItem[]> {
    const document = await this.getById(tenantId, documentId);

    const attachments: DocumentAttachmentItem[] = [
      {
        type: "xml",
        label: "XML original",
        available: Boolean(document.xmlStorageKey),
        filename: buildXmlFilename(document),
        downloadPath: `/api/v1/documents/${documentId}/xml`,
        statusMessage: document.xmlStorageKey
          ? "Arquivo XML armazenado e disponivel para download."
          : "Documento ainda nao possui XML armazenado.",
      },
    ];

    if (isPdfSupportedDocumentType(document.docType)) {
      attachments.push({
        type: "pdf",
        label: `${getPdfRepresentation(document.docType)} operacional`,
        available: Boolean(document.xmlStorageKey),
        filename: buildPdfFilename(document),
        downloadPath: `/api/v1/documents/${documentId}/pdf/download`,
        representation: getPdfRepresentation(document.docType),
        statusMessage: document.xmlStorageKey
          ? "PDF fiscal pode ser gerado a partir do XML armazenado."
          : "PDF indisponivel enquanto o XML do documento nao estiver armazenado.",
      });
    }

    return attachments;
  }

  async search(tenantId: string, query: SearchDocumentsQuery) {
    const { q, page, limit, ...filters } = query;

    return search.searchDocuments(
      q,
      {
        tenantId,
        companyId: filters.companyId,
        docType: filters.docType,
        situacao: filters.situacao,
        dataInicio: filters.dataInicio,
        dataFim: filters.dataFim,
      },
      page,
      limit
    );
  }

  async uploadXml(tenantId: string, companyId: string, xmlContent: string) {
    // Reusing ingestion logic for manual uploads
    // Manual uploads might not have NSU, so passing undefined/null
    const result = await this.ingestDocument({
      tenantId,
      companyId,
      xmlContent,
      nsu: undefined,
      source: "upload",
    });

    if (result.action === "skip") {
      throw new ConflictError(`Documento ja existe (ID: ${result.documentId})`);
    }

    return this.getById(tenantId, result.documentId!);
  }

  /**
   * Ingests a full document XML (NFe, CTe, MDFe).
   * Handles parsing, storage, idempotency, persistence, and indexing.
   */
  async ingestDocument(params: {
    tenantId: string;
    companyId: string;
    xmlContent: string;
    nsu?: string;
    source?: "upload" | "job";
  }) {
    const { tenantId, companyId, xmlContent, nsu } = params;

    // 1. Validation & Parsing
    assertSafeXml(xmlContent);
    const docType = detectDocumentType(xmlContent);
    if (!docType) throw new ValidationError("Tipo de documento XML nao reconhecido");

    let parsedData: any;
    switch (docType) {
      case "NFE":
        parsedData = parseNFe(xmlContent);
        break;
      case "CTE":
        parsedData = parseCTe(xmlContent);
        break;
      // Add MDFE parser import if needed, assuming shared/xml-parser has it
      default:
        // For now, only NFe/CTe fully supported in this snippet, extending as needed
        if (xmlContent.includes("<mdfeProc")) {
          // Fallback or import parseMDFe if available.
          // Assuming parseMDFe is available in context or we skip for now.
          throw new ValidationError("MDFe parsing not fully linked in service yet.");
        }
        throw new ValidationError(`Tipo de documento ${docType} nao suportado`);
    }

    // Normalized data
    const docData = {
      chave: parsedData.chave,
      numero: parsedData.numero,
      serie: parsedData.serie,
      dataEmissao: new Date(parsedData.dataEmissao),
      valorTotal: parsedData.valorTotal,
      emitCnpj: parsedData.emitente.cnpj,
      emitRazao: parsedData.emitente.razaoSocial,
      destCnpjCpf: parsedData.destinatario?.cnpj,
      destRazao: parsedData.destinatario?.razaoSocial,
      natOp: parsedData.natOp,
      uf: parsedData.uf,
      situacao: "autorizada", // Default for valid proc XMLs
    };

    // 2. Idempotency Check
    const existing = await this.db.query.documents.findFirst({
      where: and(eq(documents.chave, docData.chave), eq(documents.tenantId, tenantId)),
    });

    if (existing) {
      // If found, we check if we need to update anything (e.g. status)
      // but for "full document" (procNFe), it's usually final.
      return { success: true, action: "skip", documentId: existing.id };
    }

    // 3. Storage (S3)
    const storageParams: StorageKey = {
      tenantId,
      companyId,
      docType,
      year: docData.dataEmissao.getFullYear(),
      month: docData.dataEmissao.getMonth() + 1,
      documentId: docData.chave,
    };

    let xmlStorageKey: string | null = null;
    try {
      xmlStorageKey = await this.storage.uploadXml(storageParams, xmlContent);

      // 4. Persistence (DB)
      const [document] = await this.db
        .insert(documents)
        .values({
          tenantId,
          companyId,
          chave: docData.chave,
          numero: toIntOrThrow("Numero", docData.numero),
          serie: toIntOrThrow("Serie", docData.serie),
          docType: docType as DocType,
          situacao: docData.situacao as Situacao,
          dataEmissao: docData.dataEmissao.toISOString().split('T')[0], // Drizzle date expects string
          valorTotal: docData.valorTotal.toString(),
          emitCnpj: docData.emitCnpj,
          emitRazao: docData.emitRazao,
          destCnpjCpf: docData.destCnpjCpf,
          destRazao: docData.destRazao,
          xmlStorageKey,
          nsu,
          xmlHashSha256: sha256Hex(Buffer.from(xmlContent)),
          xmlSizeBytes: Buffer.byteLength(xmlContent),
          metadata: { natOp: docData.natOp, uf: docData.uf },
        })
        .returning();

      // 5. Search Indexing
      await search.indexDocument({
        id: document.id,
        tenantId,
        companyId,
        chave: document.chave ?? '',
        numero: String(document.numero ?? 0),
        serie: String(document.serie ?? 0),
        docType: document.docType,
        situacao: document.situacao ?? 'autorizada',
        dataEmissao: typeof document.dataEmissao === 'string' ? document.dataEmissao : String(document.dataEmissao),
        valorTotal: Number(document.valorTotal),
        emitRazaoSocial: docData.emitRazao ?? '',
        emitCnpj: docData.emitCnpj ?? '',
        uf: docData.uf ?? '',
        createdAt: new Date().toISOString(),
      });

      // 6. Process Relations (Async)
      // We pass the full parsedData objects. 
      // Note: parsedData for CTe must contain infCte/infDoc for this to work.
      // If parsedData is simplified, we might need to pass xmlContent or re-parse in service?
      // RelationsService.processDocumentRelations expects (document, parsedXml).
      // We pass the DB document and the parsedData object from Step 1.
      this.relationsService.processDocumentRelations(document, parsedData).catch(err => {
        // Log error but don't fail ingestion
        logger.error(
          {
            err,
            documentId: document.id,
            tenantId,
            chave: document.chave,
          },
          'Falha ao processar relacionamentos do documento'
        );
      });

      await historyService.registerEvent({
        tenantId,
        documentId: document.id,
        companyId,
        eventType: params.source === "upload" ? "document.uploaded" : "document.synced",
        source: params.source === "upload" ? "documents.upload" : "jobs.xml-processor",
        title: params.source === "upload" ? "Documento importado manualmente" : "Documento sincronizado",
        summary: `${document.docType} ${document.chave ?? document.id} persistido no tenant`,
        details: {
          nsu: nsu ?? null,
          docType: document.docType,
          situacao: document.situacao,
          source: params.source ?? "job",
          sourceId: document.id,
          correlationId: nsu ?? document.id,
        },
      });

      return { success: true, action: "create", documentId: document.id };

    } catch (err) {
      // Best-effort cleanup - ignore errors during cleanup
      try {
        if (xmlStorageKey) await this.storage.deleteXml?.(xmlStorageKey);
      } catch { /* ignore cleanup errors */ }
      throw err;
    }
  }

  async ingestResumo(params: {
    tenantId: string;
    companyId: string;
    resumoData: {
      chNFe: string;
      nNF?: string;
      serie?: string;
      cSitNFe?: string;
      dhEmi: string;
      vNF: number | string;
      CNPJ: string;
      xNome: string;
    };
    xmlContent?: string;
    nsu: string;
  }) {
    const { tenantId, companyId, resumoData, nsu } = params;

    // Check existing
    const existing = await this.db.query.documents.findFirst({
      where: and(eq(documents.chave, resumoData.chNFe), eq(documents.tenantId, tenantId)),
    });

    if (existing) {
      return { success: true, action: "skip", documentId: existing.id };
    }

    // Insert placeholder
    const [document] = await this.db
      .insert(documents)
      .values({
        tenantId,
        companyId,
        chave: resumoData.chNFe,
        numero: toIntOrThrow("Numero", resumoData.nNF || "0"),
        serie: toIntOrThrow("Serie", resumoData.serie || "0"),
        docType: "NFE" as DocType,
        situacao: (resumoData.cSitNFe === "1" ? "autorizada" : "pendente") as Situacao,
        dataEmissao: new Date(resumoData.dhEmi).toISOString().split('T')[0],
        valorTotal: resumoData.vNF.toString(),
        emitCnpj: resumoData.CNPJ,
        emitRazao: resumoData.xNome,
        nsu,
        searchContent: "resumo",
      })
      .returning();

    await historyService.registerEvent({
      tenantId,
      documentId: document.id,
      companyId,
      eventType: 'document.summary.synced',
      source: 'jobs.xml-processor',
      title: 'Resumo de documento sincronizado',
      summary: `Resumo NSU ${nsu} recebido para a chave ${resumoData.chNFe}`,
      details: {
        nsu,
        docType: 'NFE',
        chave: resumoData.chNFe,
        sourceId: document.id,
        correlationId: nsu,
      },
    });

    return { success: true, action: "create_resumo", documentId: document.id };
  }
}

export const documentsService = container.resolve(DocumentsService);
