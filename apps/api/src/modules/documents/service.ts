import { eq, and, sql, desc, asc, gte, lte } from 'drizzle-orm';
import { db } from '../../config/database';
import { documents, companies } from '@fiscalzen/database/schema';
import { NotFoundError, ValidationError, ConflictError } from '../../utils/errors';
import { storage, type StorageKey } from '../../services/storage';
import { search, type DocumentSearchRecord } from '../../services/search';
import { parseNFe, parseCTe, parseMDFe, detectDocumentType } from '@fiscalzen/xml-parser';
import type { ListDocumentsQuery, SearchDocumentsQuery } from './schemas';

export const documentsService = {
  async list(tenantId: string, query: ListDocumentsQuery) {
    const { page, limit, sortBy, sortOrder, ...filters } = query;
    const offset = (page - 1) * limit;

    const conditions = [eq(documents.tenantId, tenantId)];

    if (filters.companyId) {
      conditions.push(eq(documents.companyId, filters.companyId));
    }

    if (filters.docType) {
      conditions.push(eq(documents.docType, filters.docType));
    }

    if (filters.situacao) {
      conditions.push(eq(documents.situacao, filters.situacao));
    }

    if (filters.emitCnpj) {
      conditions.push(eq(documents.emitCnpj, filters.emitCnpj));
    }

    if (filters.destCnpj) {
      conditions.push(eq(documents.destCnpj, filters.destCnpj));
    }

    if (filters.numero) {
      conditions.push(eq(documents.numero, filters.numero));
    }

    if (filters.serie) {
      conditions.push(eq(documents.serie, filters.serie));
    }

    if (filters.chave) {
      conditions.push(eq(documents.chave, filters.chave));
    }

    if (filters.dataInicio) {
      conditions.push(gte(documents.dataEmissao, new Date(filters.dataInicio)));
    }

    if (filters.dataFim) {
      conditions.push(lte(documents.dataEmissao, new Date(filters.dataFim)));
    }

    const orderColumn = {
      dataEmissao: documents.dataEmissao,
      valorTotal: documents.valorTotal,
      numero: documents.numero,
      createdAt: documents.createdAt,
    }[sortBy];

    const orderFn = sortOrder === 'asc' ? asc : desc;

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
          emitRazaoSocial: documents.emitRazaoSocial,
          emitCnpj: documents.emitCnpj,
          destRazaoSocial: documents.destRazaoSocial,
          destCnpj: documents.destCnpj,
          natOp: documents.natOp,
          createdAt: documents.createdAt,
        })
        .from(documents)
        .where(and(...conditions))
        .orderBy(orderFn(orderColumn))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(documents)
        .where(and(...conditions)),
    ]);

    return {
      items,
      total: Number(countResult[0]?.count ?? 0),
    };
  },

  async getById(tenantId: string, documentId: string) {
    const document = await db.query.documents.findFirst({
      where: and(eq(documents.id, documentId), eq(documents.tenantId, tenantId)),
    });

    if (!document) {
      throw new NotFoundError('Documento', documentId);
    }

    return document;
  },

  async getByChave(tenantId: string, chave: string) {
    const document = await db.query.documents.findFirst({
      where: and(eq(documents.chave, chave), eq(documents.tenantId, tenantId)),
    });

    if (!document) {
      throw new NotFoundError('Documento');
    }

    return document;
  },

  async getXml(tenantId: string, documentId: string): Promise<string> {
    const document = await this.getById(tenantId, documentId);

    if (!document.storageKey) {
      throw new NotFoundError('XML do documento');
    }

    return storage.downloadXml(document.storageKey);
  },

  async getPdfUrl(tenantId: string, documentId: string): Promise<string> {
    const document = await this.getById(tenantId, documentId);

    if (!document.pdfKey) {
      throw new NotFoundError('PDF do documento');
    }

    return storage.generatePresignedUrl(document.pdfKey);
  },

  async search(tenantId: string, query: SearchDocumentsQuery) {
    const { q, page, limit, ...filters } = query;

    const result = await search.searchDocuments(
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

    return result;
  },

  async uploadXml(tenantId: string, companyId: string, xmlContent: string) {
    // Verify company belongs to tenant
    const company = await db.query.companies.findFirst({
      where: and(eq(companies.id, companyId), eq(companies.tenantId, tenantId)),
    });

    if (!company) {
      throw new NotFoundError('Empresa', companyId);
    }

    // Detect XML type
    const docType = detectDocumentType(xmlContent);

    if (!docType) {
      throw new ValidationError('Tipo de documento XML nao reconhecido');
    }

    // Parse XML based on type
    let parsedData: {
      chave: string;
      numero: string;
      serie: string;
      dataEmissao: Date;
      valorTotal: number;
      emitCnpj: string;
      emitRazaoSocial: string;
      destCnpj?: string;
      destRazaoSocial?: string;
      natOp?: string;
      situacao: string;
      uf: string;
    };

    switch (docType) {
      case 'NFE':
        const nfe = parseNFe(xmlContent);
        parsedData = {
          chave: nfe.chave,
          numero: nfe.numero,
          serie: nfe.serie,
          dataEmissao: new Date(nfe.dataEmissao),
          valorTotal: nfe.valorTotal,
          emitCnpj: nfe.emitente.cnpj,
          emitRazaoSocial: nfe.emitente.razaoSocial,
          destCnpj: nfe.destinatario?.cnpj,
          destRazaoSocial: nfe.destinatario?.razaoSocial,
          natOp: nfe.natOp,
          situacao: 'autorizada',
          uf: nfe.uf,
        };
        break;

      case 'CTE':
        const cte = parseCTe(xmlContent);
        parsedData = {
          chave: cte.chave,
          numero: cte.numero,
          serie: cte.serie,
          dataEmissao: new Date(cte.dataEmissao),
          valorTotal: cte.valorTotal,
          emitCnpj: cte.emitente.cnpj,
          emitRazaoSocial: cte.emitente.razaoSocial,
          destCnpj: cte.destinatario?.cnpj,
          destRazaoSocial: cte.destinatario?.razaoSocial,
          natOp: cte.natOp,
          situacao: 'autorizada',
          uf: cte.uf,
        };
        break;

      default:
        throw new ValidationError(`Tipo de documento ${docType} nao suportado para upload`);
    }

    // Check if document already exists
    const existing = await db.query.documents.findFirst({
      where: eq(documents.chave, parsedData.chave),
    });

    if (existing) {
      throw new ConflictError(`Documento com chave ${parsedData.chave} ja existe`);
    }

    // Store XML in S3
    const dataEmissao = parsedData.dataEmissao;
    const storageParams: StorageKey = {
      tenantId,
      companyId,
      docType: docType,
      year: dataEmissao.getFullYear(),
      month: dataEmissao.getMonth() + 1,
      documentId: parsedData.chave,
    };

    const storageKey = await storage.uploadXml(storageParams, xmlContent);

    // Insert document in database
    const [document] = await db
      .insert(documents)
      .values({
        tenantId,
        companyId,
        chave: parsedData.chave,
        numero: parsedData.numero,
        serie: parsedData.serie,
        docType: docType,
        situacao: parsedData.situacao,
        dataEmissao: parsedData.dataEmissao,
        valorTotal: parsedData.valorTotal.toString(),
        emitCnpj: parsedData.emitCnpj,
        emitRazaoSocial: parsedData.emitRazaoSocial,
        destCnpj: parsedData.destCnpj,
        destRazaoSocial: parsedData.destRazaoSocial,
        natOp: parsedData.natOp,
        uf: parsedData.uf,
        storageKey,
        xmlOriginal: xmlContent,
      })
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
      dataEmissao: document.dataEmissao.toISOString(),
      valorTotal: Number(document.valorTotal),
      emitRazaoSocial: document.emitRazaoSocial,
      emitCnpj: document.emitCnpj,
      destRazaoSocial: document.destRazaoSocial ?? undefined,
      destCnpj: document.destCnpj ?? undefined,
      natOp: document.natOp ?? undefined,
      uf: document.uf,
      createdAt: document.createdAt.toISOString(),
    };

    await search.indexDocument(searchRecord);

    return document;
  },
};