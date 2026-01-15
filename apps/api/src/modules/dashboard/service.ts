import { eq, and, sql, desc, gte, lte, count } from 'drizzle-orm';
import { db } from '../../config/database';
import { documents, companies, nsuControl } from '@fiscalzen/database/schema';
import type { TimelineQuery, GapsQuery, SummaryQuery, RecentQuery } from './schemas';

export interface DocumentSummary {
  docType: string;
  total: number;
  valorTotal: number;
  autorizadas: number;
  canceladas: number;
  denegadas: number;
}

export interface IntegrityStatus {
  status: 'green' | 'yellow' | 'red';
  message: string;
  details: {
    syncStatus: 'ok' | 'warning' | 'error';
    gapsDetected: number;
    certificateStatus: 'ok' | 'expiring' | 'expired' | 'missing';
    lastSyncAge: number | null; // hours since last sync
  };
}

export interface TimelinePoint {
  date: string;
  nfe: number;
  cte: number;
  mdfe: number;
  nfse: number;
  total: number;
  valorTotal: number;
}

export interface Gap {
  companyId: string;
  companyName: string;
  docType: string;
  serie: string;
  inicio: number;
  fim: number;
  quantidade: number;
}

export const dashboardService = {
  async getSummary(tenantId: string, query: SummaryQuery): Promise<DocumentSummary[]> {
    const conditions = [eq(documents.tenantId, tenantId)];

    if (query.companyId) {
      conditions.push(eq(documents.companyId, query.companyId));
    }

    if (query.dataInicio) {
      conditions.push(gte(documents.dataEmissao, new Date(query.dataInicio)));
    }

    if (query.dataFim) {
      conditions.push(lte(documents.dataEmissao, new Date(query.dataFim)));
    }

    const result = await db
      .select({
        docType: documents.docType,
        total: count(),
        valorTotal: sql<number>`COALESCE(SUM(${documents.valorTotal}::numeric), 0)`,
        autorizadas: sql<number>`COUNT(*) FILTER (WHERE ${documents.situacao} = 'autorizada')`,
        canceladas: sql<number>`COUNT(*) FILTER (WHERE ${documents.situacao} = 'cancelada')`,
        denegadas: sql<number>`COUNT(*) FILTER (WHERE ${documents.situacao} = 'denegada')`,
      })
      .from(documents)
      .where(and(...conditions))
      .groupBy(documents.docType);

    return result.map((r) => ({
      docType: r.docType,
      total: Number(r.total),
      valorTotal: Number(r.valorTotal),
      autorizadas: Number(r.autorizadas),
      canceladas: Number(r.canceladas),
      denegadas: Number(r.denegadas),
    }));
  },

  async getIntegrity(tenantId: string, companyId?: string): Promise<IntegrityStatus> {
    const conditions = [eq(companies.tenantId, tenantId), eq(companies.ativo, true)];

    if (companyId) {
      conditions.push(eq(companies.id, companyId));
    }

    // Get companies with their NSU status
    const companiesData = await db
      .select({
        id: companies.id,
        certificateExpiry: companies.certificateExpiry,
      })
      .from(companies)
      .where(and(...conditions));

    // Get NSU control status
    const companyIds = companiesData.map((c) => c.id);

    let nsuStatus = { hasError: false, hasWarning: false, lastSyncAge: null as number | null };

    if (companyIds.length > 0) {
      const nsuData = await db
        .select()
        .from(nsuControl)
        .where(sql`${nsuControl.companyId} = ANY(${companyIds})`);

      const now = new Date();
      for (const nsu of nsuData) {
        if (nsu.syncStatus === 'error') {
          nsuStatus.hasError = true;
        }
        if (nsu.lastSync) {
          const ageHours = (now.getTime() - nsu.lastSync.getTime()) / (1000 * 60 * 60);
          if (nsuStatus.lastSyncAge === null || ageHours > nsuStatus.lastSyncAge) {
            nsuStatus.lastSyncAge = ageHours;
          }
          if (ageHours > 24) {
            nsuStatus.hasWarning = true;
          }
        }
      }
    }

    // Check certificate status
    let certificateStatus: IntegrityStatus['details']['certificateStatus'] = 'ok';
    const now = new Date();

    for (const company of companiesData) {
      if (!company.certificateExpiry) {
        certificateStatus = 'missing';
        break;
      }

      const daysUntilExpiry = Math.floor(
        (company.certificateExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilExpiry <= 0) {
        certificateStatus = 'expired';
        break;
      } else if (daysUntilExpiry <= 30) {
        certificateStatus = 'expiring';
      }
    }

    // Determine overall status
    let status: IntegrityStatus['status'] = 'green';
    let message = 'Sistema operando normalmente';

    if (certificateStatus === 'expired' || nsuStatus.hasError) {
      status = 'red';
      message = certificateStatus === 'expired'
        ? 'Certificado expirado'
        : 'Erro na sincronizacao com SEFAZ';
    } else if (
      certificateStatus === 'missing' ||
      certificateStatus === 'expiring' ||
      nsuStatus.hasWarning
    ) {
      status = 'yellow';
      message = certificateStatus === 'missing'
        ? 'Certificado nao configurado'
        : certificateStatus === 'expiring'
          ? 'Certificado proximo do vencimento'
          : 'Sincronizacao atrasada';
    }

    return {
      status,
      message,
      details: {
        syncStatus: nsuStatus.hasError ? 'error' : nsuStatus.hasWarning ? 'warning' : 'ok',
        gapsDetected: 0, // TODO: implement gap detection
        certificateStatus,
        lastSyncAge: nsuStatus.lastSyncAge,
      },
    };
  },

  async getGaps(tenantId: string, query: GapsQuery): Promise<Gap[]> {
    // This is a simplified implementation
    // In production, you would analyze number sequences to detect gaps

    const conditions = [eq(documents.tenantId, tenantId)];

    if (query.companyId) {
      conditions.push(eq(documents.companyId, query.companyId));
    }

    if (query.docType) {
      conditions.push(eq(documents.docType, query.docType));
    }

    if (query.serie) {
      conditions.push(eq(documents.serie, query.serie));
    }

    // Get documents grouped by company, docType, serie
    // and analyze number sequences
    const result = await db
      .select({
        companyId: documents.companyId,
        docType: documents.docType,
        serie: documents.serie,
        minNumero: sql<number>`MIN(${documents.numero}::integer)`,
        maxNumero: sql<number>`MAX(${documents.numero}::integer)`,
        count: count(),
      })
      .from(documents)
      .where(and(...conditions))
      .groupBy(documents.companyId, documents.docType, documents.serie)
      .limit(query.limit);

    // Simple gap detection: if count != (max - min + 1), there are gaps
    const gaps: Gap[] = [];

    for (const row of result) {
      const expectedCount = row.maxNumero - row.minNumero + 1;
      const actualCount = Number(row.count);

      if (actualCount < expectedCount) {
        gaps.push({
          companyId: row.companyId,
          companyName: '', // Would need to join with companies
          docType: row.docType,
          serie: row.serie,
          inicio: row.minNumero,
          fim: row.maxNumero,
          quantidade: expectedCount - actualCount,
        });
      }
    }

    return gaps;
  },

  async getTimeline(tenantId: string, query: TimelineQuery): Promise<TimelinePoint[]> {
    const conditions = [eq(documents.tenantId, tenantId)];

    if (query.companyId) {
      conditions.push(eq(documents.companyId, query.companyId));
    }

    if (query.dataInicio) {
      conditions.push(gte(documents.dataEmissao, new Date(query.dataInicio)));
    }

    if (query.dataFim) {
      conditions.push(lte(documents.dataEmissao, new Date(query.dataFim)));
    }

    const dateFormat = {
      day: 'YYYY-MM-DD',
      week: 'IYYY-IW',
      month: 'YYYY-MM',
    }[query.groupBy];

    const result = await db
      .select({
        date: sql<string>`TO_CHAR(${documents.dataEmissao}, '${sql.raw(dateFormat)}')`,
        nfe: sql<number>`COUNT(*) FILTER (WHERE ${documents.docType} = 'NFE')`,
        cte: sql<number>`COUNT(*) FILTER (WHERE ${documents.docType} = 'CTE')`,
        mdfe: sql<number>`COUNT(*) FILTER (WHERE ${documents.docType} = 'MDFE')`,
        nfse: sql<number>`COUNT(*) FILTER (WHERE ${documents.docType} = 'NFSE')`,
        total: count(),
        valorTotal: sql<number>`COALESCE(SUM(${documents.valorTotal}::numeric), 0)`,
      })
      .from(documents)
      .where(and(...conditions))
      .groupBy(sql`TO_CHAR(${documents.dataEmissao}, '${sql.raw(dateFormat)}')`)
      .orderBy(sql`TO_CHAR(${documents.dataEmissao}, '${sql.raw(dateFormat)}')`);

    return result.map((r) => ({
      date: r.date,
      nfe: Number(r.nfe),
      cte: Number(r.cte),
      mdfe: Number(r.mdfe),
      nfse: Number(r.nfse),
      total: Number(r.total),
      valorTotal: Number(r.valorTotal),
    }));
  },

  async getRecent(tenantId: string, query: RecentQuery) {
    const conditions = [eq(documents.tenantId, tenantId)];

    if (query.companyId) {
      conditions.push(eq(documents.companyId, query.companyId));
    }

    const result = await db
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
        createdAt: documents.createdAt,
      })
      .from(documents)
      .where(and(...conditions))
      .orderBy(desc(documents.createdAt))
      .limit(query.limit);

    return result;
  },
};
