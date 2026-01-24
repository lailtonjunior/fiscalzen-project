import { eq, and, sql, desc, asc, gte, lte } from "drizzle-orm";
import { db } from "../../config/database";
import { documents, companies } from "@fiscalzen/database/schema";
import { NotFoundError, ValidationError, ConflictError } from "../../utils/errors";
import { storage, type StorageKey } from "../../services/storage";
import { search, type DocumentSearchRecord } from "../../services/search";
import { parseNFe, parseCTe, detectDocumentType } from "@fiscalzen/xml-parser";
import type { ListDocumentsQuery, SearchDocumentsQuery } from "./schemas";
import { sha256Hex } from "../../utils/encryption";

/**
 * Compatibility mapping:
 * The repo shows drift between API code and Drizzle schema. To be resilient,
 * we map both "old" and "new" column names via `as any`.
 */
const d: any = documents;

const COL = {
  emitRazao: d.emitRazao ?? d.emitRazaoSocial,
  destRazao: d.destRazao ?? d.destRazaoSocial,
  destCnpjCpf: d.destCnpjCpf ?? d.destCnpj,
  xmlStorageKey: d.xmlStorageKey ?? d.storageKey,
  // optional fields that may exist in some branches
  pdfStorageKey: d.pdfStorageKey ?? d.pdfKey,
};

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

export const documentsService = {
  async list(tenantId: string, query: ListDocumentsQuery) {
    const { page, limit, sortBy, sortOrder, ...filters } = query;
    const offset = (page - 1) * limit;

    const conditions: any[] = [eq(documents.tenantId, tenantId)];

    if (filters.companyId) conditions.push(eq(documents.companyId, filters.companyId));
    if (filters.docType) conditions.push(eq(documents.docType, filters.docType));
    if (filters.situacao) conditions.push(eq(documents.situacao, filters.situacao));
    if (filters.emitCnpj) conditions.push(eq(documents.emitCnpj, filters.emitCnpj));
    if (filters.destCnpj) conditions.push(eq(COL.destCnpjCpf, filters.destCnpj));
    if (filters.numero) conditions.push(eq(documents.numero, filters.numero));
    if (filters.serie) conditions.push(eq(documents.serie, filters.serie));
    if (filters.chave) conditions.push(eq(documents.chave, filters.chave));

    if (filters.dataInicio) conditions.push(gte(documents.dataEmissao, new Date(filters.dataInicio)));
    if (filters.dataFim) conditions.push(lte(documents.dataEmissao, new Date(filters.dataFim)));

    const orderColumn =
      {
        dataEmissao: documents.dataEmissao,
        valorTotal: documents.valorTotal,
        numero: documents.numero,
        createdAt: documents.createdAt,
      }[sortBy] ?? documents.createdAt;

    const orderFn = sortOrder === "asc" ? asc : desc;

    const [items, countResult] = await Promise.all([
      db
        .select({
          id: documents.id,
          chave: documents.chave,
          numero: documents.numero,
          serie: documents.serie,
          docType: documents.docType,
          situacao: documents.situacao,
          dataEmissao: documents.dataEmissao,
          valorTotal: documents.valorTotal,
          emitRazao: COL.emitRazao,
          emitCnpj: documents.emitCnpj,
          destRazao: COL.destRazao,
          destCnpjCpf: COL.destCnpjCpf,
          createdAt: documents.createdAt,
        })
        .from(documents)
        .where(and(...conditions))
        .orderBy(orderFn(orderColumn))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(documents).where(and(...conditions)),
    ]);

    return { items, total: Number(countResult[0]?.count ?? 0) };
  },

  async getById(tenantId: string, documentId: string) {
    const document = await db.query.documents.findFirst({
      where: and(eq(documents.id, documentId), eq(documents.tenantId, tenantId)),
    });
    if (!document) throw new NotFoundError("Documento", documentId);
    return document;
  },

  async getByChave(tenantId: string, chave: string) {
    // FIX: ensure tenantId filter to avoid cross-tenant leakage.
    const document = await db.query.documents.findFirst({
      where: and(eq(documents.chave, chave), eq(documents.tenantId, tenantId)),
    });
    if (!document) throw new NotFoundError("Documento");
    return document;
  },

  async getXml(tenantId: string, documentId: string): Promise<string> {
    const document: any = await this.getById(tenantId, documentId);

    const key: string | null | undefined = document.xmlStorageKey ?? document.storageKey ?? document.xml_storage_key;
    if (!key) throw new NotFoundError("XML do documento");

    return storage.downloadXml(key);
  },

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
  },

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
  },

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
    const existing = await db.query.documents.findFirst({
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
      xmlStorageKey = await storage.uploadXml(storageParams, xmlContent);

      // 4. Persistence (DB)
      const [document] = await db
        .insert(documents)
        .values({
          tenantId,
          companyId,
          chave: docData.chave,
          numero: toIntOrThrow("Numero", docData.numero),
          serie: toIntOrThrow("Serie", docData.serie),
          docType: docType as any,
          situacao: docData.situacao as any,
          dataEmissao: docData.dataEmissao,
          valorTotal: docData.valorTotal.toString(),
          emitCnpj: docData.emitCnpj,
          emitRazao: docData.emitRazao, // Map to correct column based on schema drift
          destCnpjCpf: docData.destCnpjCpf,
          destRazao: docData.destRazao,
          xmlStorageKey,
          nsu, // If provided by job
          xmlHashSha256: sha256Hex(Buffer.from(xmlContent)),
          xmlSizeBytes: Buffer.byteLength(xmlContent),
          metadata: { natOp: docData.natOp, uf: docData.uf },
        } as any) // Type casting due to schema drift known issue
        .returning();

      // 5. Search Indexing
      await search.indexDocument({
        id: document.id,
        tenantId,
        companyId,
        chave: document.chave,
        docType: document.docType,
        situacao: document.situacao,
        dataEmissao: document.dataEmissao.toISOString(),
        valorTotal: Number(document.valorTotal),
        emitRazaoSocial: docData.emitRazao,
        emitCnpj: docData.emitCnpj,
      } as any);

      return { success: true, action: "create", documentId: document.id };

    } catch (err) {
      if (xmlStorageKey) await (storage as any).delete?.(xmlStorageKey);
      throw err;
    }
  },

  async ingestResumo(params: {
    tenantId: string;
    companyId: string;
    resumoData: any; // Result from parseResNFe
    xmlContent: string;
    nsu: string;
  }) {
    const { tenantId, companyId, resumoData, xmlContent, nsu } = params;

    // Check existing
    const existing = await db.query.documents.findFirst({
      where: eq(documents.chave, resumoData.chNFe),
    });

    if (existing) {
      return { success: true, action: "skip", documentId: existing.id };
    }

    // Insert placeholder
    const [document] = await db
      .insert(documents)
      .values({
        tenantId,
        companyId,
        chave: resumoData.chNFe,
        numero: toIntOrThrow("Numero", resumoData.nNF || "0"),
        serie: toIntOrThrow("Serie", resumoData.serie || "0"),
        docType: "NFE", // Resumo usually only NFe/CTe
        situacao: resumoData.cSitNFe === "1" ? "autorizada" : "pendente",
        dataEmissao: new Date(resumoData.dhEmi),
        valorTotal: resumoData.vNF.toString(),
        emitCnpj: resumoData.CNPJ,
        emitRazao: resumoData.xNome,
        nsu,
        // xmlStorageKey: null, // No full XML yet
        searchContent: "resumo", // Marker
      } as any)
      .returning();

    return { success: true, action: "create_resumo", documentId: document.id };
  },
};
