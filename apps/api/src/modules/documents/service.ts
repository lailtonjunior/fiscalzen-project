import { eq, and, sql, desc, asc, gte, lte } from "drizzle-orm";
import { documents } from "@fiscalzen/database/schema";
import { NotFoundError, ValidationError, ConflictError } from "../../utils/errors";
import { StorageService, type StorageKey } from "../../services/storage";
import { search } from "../../services/search";
import { parseNFe, parseCTe, detectDocumentType } from "@fiscalzen/xml-parser";
// import { PdfService } from "../pdf/service"; // TODO: Fix pdfmake ESM compatibility
import { RelationsService } from "../relations/service";
import type { ListDocumentsQuery, SearchDocumentsQuery } from "./schemas";
import { sha256Hex } from "../../utils/encryption";
import { injectable, inject, container } from "tsyringe";
import { DATABASE_TOKEN } from "../../providers/database";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "@fiscalzen/database/schema";
import type { Situacao, DocType } from "@fiscalzen/database/schema";

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

@injectable()
export class DocumentsService {
  constructor(
    @inject(DATABASE_TOKEN) private db: Database,
    @inject(StorageService) private storage: StorageService,
    // @inject(PdfService) private pdfService: PdfService, // TODO: Fix pdfmake ESM compatibility
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

  async getPdf(tenantId: string, documentId: string): Promise<Buffer> {
    const document = await this.getById(tenantId, documentId);

    // Try to download PDF from storage
    if (document.pdfStorageKey) {
      try {
        const pdf = await this.storage.downloadPdf(document.pdfStorageKey);
        return pdf;
      } catch (err) {
        // Fallback to generation
      }
    }

    // Generate from XML
    // Use getXml directly which handles the key lookup
    const xml = await this.getXml(tenantId, documentId);

    // TODO: Re-enable once pdfmake ESM compatibility is fixed
    // if (document.docType === 'NFE') {
    //   const data = parseNFe(xml);
    //   return this.pdfService.generateDanfe(data);
    // } else if (document.docType === 'CTE') {
    //   const data = parseCTe(xml);
    //   return this.pdfService.generateDacte(data);
    // }
    void xml; // Suppress unused variable warning

    throw new ValidationError('Geracao de PDF temporariamente indisponivel');
  }

  /**
   * Returns a presigned URL for downloading the PDF.
   * Generates PDF if not yet cached.
   */
  async getPdfUrl(tenantId: string, documentId: string): Promise<{ url: string; cached: boolean }> {
    // TODO: Re-enable once pdfmake ESM compatibility is fixed
    // const result = await this.pdfService.generatePdf(documentId, tenantId);
    void tenantId;
    void documentId;
    throw new ValidationError('Geracao de PDF temporariamente indisponivel');
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
      where: eq(documents.chave, docData.chave),
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
        console.error(`Falha ao processar relacionamentos para ${document.chave}:`, err);
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
      where: eq(documents.chave, resumoData.chNFe),
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

    return { success: true, action: "create_resumo", documentId: document.id };
  }
}

export const documentsService = container.resolve(DocumentsService);
