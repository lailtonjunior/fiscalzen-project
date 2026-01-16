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
    assertSafeXml(xmlContent);

    // Verify company belongs to tenant
    const company = await db.query.companies.findFirst({
      where: and(eq(companies.id, companyId), eq(companies.tenantId, tenantId)),
    });
    if (!company) throw new NotFoundError("Empresa", companyId);

    const docType = detectDocumentType(xmlContent);
    if (!docType) throw new ValidationError("Tipo de documento XML nao reconhecido");

    // Parse XML based on type
    let parsedData: {
      chave: string;
      numero: string;
      serie: string;
      dataEmissao: Date;
      valorTotal: number;
      emitCnpj: string;
      emitRazao: string;
      destCnpjCpf?: string;
      destRazao?: string;
      natOp?: string;
      situacao: string;
      uf: string;
    };

    switch (docType) {
      case "NFE": {
        const nfe = parseNFe(xmlContent);
        parsedData = {
          chave: nfe.chave,
          numero: nfe.numero,
          serie: nfe.serie,
          dataEmissao: new Date(nfe.dataEmissao),
          valorTotal: nfe.valorTotal,
          emitCnpj: nfe.emitente.cnpj,
          emitRazao: nfe.emitente.razaoSocial,
          destCnpjCpf: nfe.destinatario?.cnpj,
          destRazao: nfe.destinatario?.razaoSocial,
          natOp: nfe.natOp,
          situacao: "autorizada",
          uf: nfe.uf,
        };
        break;
      }
      case "CTE": {
        const cte = parseCTe(xmlContent);
        parsedData = {
          chave: cte.chave,
          numero: cte.numero,
          serie: cte.serie,
          dataEmissao: new Date(cte.dataEmissao),
          valorTotal: cte.valorTotal,
          emitCnpj: cte.emitente.cnpj,
          emitRazao: cte.emitente.razaoSocial,
          destCnpjCpf: cte.destinatario?.cnpj,
          destRazao: cte.destinatario?.razaoSocial,
          natOp: cte.natOp,
          situacao: "autorizada",
          uf: cte.uf,
        };
        break;
      }
      default:
        throw new ValidationError(`Tipo de documento ${docType} nao suportado para upload`);
    }

    // Check if document already exists (tenant-scoped)
    const existing = await db.query.documents.findFirst({
      where: and(eq(documents.tenantId, tenantId), eq(documents.chave, parsedData.chave)),
    });
    if (existing) throw new ConflictError(`Documento com chave ${parsedData.chave} ja existe`);

    // Storage params
    const dataEmissao = parsedData.dataEmissao;
    const storageParams: StorageKey = {
      tenantId,
      companyId,
      docType: docType,
      year: dataEmissao.getFullYear(),
      month: dataEmissao.getMonth() + 1,
      documentId: parsedData.chave,
    };

    const xmlBytes = Buffer.from(xmlContent, "utf-8");
    const xmlHash = sha256Hex(xmlBytes);
    const xmlSizeBytes = xmlBytes.length;

    // Best-effort transactional behavior with compensation
    let xmlStorageKey: string | null = null;

    try {
      xmlStorageKey = await storage.uploadXml(storageParams, xmlContent);

      const [document] = await db
        .insert(documents)
        .values({
          tenantId,
          companyId,
          chave: parsedData.chave,
          numero: toIntOrThrow("Numero", parsedData.numero),
          serie: toIntOrThrow("Serie", parsedData.serie),
          docType: docType,
          situacao: parsedData.situacao,
          dataEmissao: parsedData.dataEmissao,
          valorTotal: parsedData.valorTotal.toString(),
          emitCnpj: parsedData.emitCnpj,
          // schema drift handled by drizzle column mapping at runtime
          ...(COL.emitRazao ? { emitRazao: parsedData.emitRazao } : { emitRazaoSocial: parsedData.emitRazao }),
          ...(COL.destCnpjCpf ? { destCnpjCpf: parsedData.destCnpjCpf } : { destCnpj: parsedData.destCnpjCpf }),
          ...(COL.destRazao ? { destRazao: parsedData.destRazao } : { destRazaoSocial: parsedData.destRazao }),
          ...(COL.xmlStorageKey ? { xmlStorageKey } : { storageKey: xmlStorageKey }),
          xmlHashSha256: xmlHash,
          xmlSizeBytes,
          metadata: { natOp: parsedData.natOp, uf: parsedData.uf },
        } as any)
        .returning();

      // Index in Meilisearch
      const searchRecord: DocumentSearchRecord = {
        id: document.id,
        tenantId,
        companyId,
        chave: document.chave,
        numero: document.numero,
        serie: document.serie,
        docType: document.docType,
        situacao: document.situacao,
        dataEmissao: new Date(document.dataEmissao as any).toISOString(),
        valorTotal: Number(document.valorTotal),
        emitRazaoSocial: (document as any).emitRazao ?? (document as any).emitRazaoSocial,
        emitCnpj: document.emitCnpj,
        destRazaoSocial: ((document as any).destRazao ?? (document as any).destRazaoSocial) ?? undefined,
        destCnpj: ((document as any).destCnpjCpf ?? (document as any).destCnpj) ?? undefined,
        natOp: (document as any).natOp ?? (document as any).metadata?.natOp ?? undefined,
        uf: (document as any).uf ?? (document as any).metadata?.uf ?? "",
        createdAt: new Date(document.createdAt as any).toISOString(),
      };

      await search.indexDocument(searchRecord);

      return document;
    } catch (err) {
      // Compensation: if storage succeeded but DB/search failed, delete the uploaded xml.
      try {
        if (xmlStorageKey) await (storage as any).delete?.(xmlStorageKey);
      } catch {
        // swallow compensation errors; log at handler level if needed
      }
      throw err;
    }
  },
};
