import { eq, and, sql, desc, gte, lte, count } from 'drizzle-orm';
import { documents, companies } from '@fiscalzen/database/schema';
import type { TimelineQuery, GapsQuery, SummaryQuery, RecentQuery } from './schemas';
import { injectable, inject, container } from 'tsyringe';
import { DATABASE_TOKEN } from '../../providers/database';
import type { Database } from '../../config/database';
import { NsuService } from '../nsu/service';

export interface DocumentSummary {
  docType: string;
  total: number;
  valorTotal: number;
  autorizadas: number;
  canceladas: number;
  denegadas: number;
  pendentes: number;
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

@injectable()
export class DashboardService {
  constructor(
    @inject(DATABASE_TOKEN) private db: Database,
    @inject(NsuService) private nsuService: NsuService
  ) { }

  async getSummary(tenantId: string, query: SummaryQuery) {
    const conditions = [eq((documents as any).tenantId, tenantId)];

    if (query.companyId) {
      conditions.push(eq((documents as any).companyId, query.companyId));
    }

    if (query.dataInicio) {
      conditions.push(gte((documents as any).dataEmissao, query.dataInicio));
    }

    if (query.dataFim) {
      conditions.push(lte((documents as any).dataEmissao, query.dataFim));
    }

    const [totals] = await this.db
      .select({
        totalDocuments: count(),
        totalValue: sql<number>`COALESCE(SUM(${(documents as any).valorTotal}), 0)`,
      })
      .from(documents as any)
      .where(and(...conditions));

    const byType = await this.db
      .select({
        type: (documents as any).docType,
        count: count(),
      })
      .from(documents as any)
      .where(and(...conditions))
      .groupBy((documents as any).docType);

    const byStatus = await this.db
      .select({
        status: (documents as any).situacao,
        count: count(),
      })
      .from(documents as any)
      .where(and(...conditions))
      .groupBy((documents as any).situacao);

    const totalByType = {
      NFE: 0,
      CTE: 0,
      MDFE: 0,
      NFSE: 0,
      SAT: 0,
      NFCE: 0,
    };

    byType.forEach((item) => {
      if (item.type in totalByType) {
        totalByType[item.type as keyof typeof totalByType] = Number(item.count);
      }
    });

    const totalByStatus = {
      autorizada: 0,
      cancelada: 0,
      denegada: 0,
      inutilizada: 0,
      pendente: 0,
    };

    byStatus.forEach((item) => {
      if (item.status && item.status in totalByStatus) {
        totalByStatus[item.status as keyof typeof totalByStatus] = Number(item.count);
      }
    });

    // Recent documents
    const recentDocuments = await (this.db.query as any).documents.findMany({
      where: and(...conditions),
      orderBy: [desc((documents as any).createdAt)],
      limit: 5,
    });

    return {
      totalDocuments: Number(totals?.totalDocuments || 0),
      totalValue: Number(totals?.totalValue || 0),
      totalByType,
      totalByStatus,
      pendingManifestation: 0,
      recentDocuments,
    };
  }

  async getIntegrity(tenantId: string, companyId?: string): Promise<IntegrityStatus> {
    const conditions = [eq((companies as any).tenantId, tenantId), eq((companies as any).active, true)];
    if (companyId) {
      conditions.push(eq((companies as any).id, companyId));
    }

    // Get companies for certificate check
    const companiesData = await this.db
      .select({
        id: (companies as any).id,
        certificateExpiry: (companies as any).certificateExpiry,
      })
      .from(companies as any)
      .where(and(...conditions));

    // Delegate NSU/Sync checks to NsuService
    const companyIds = companiesData.map((c) => String(c.id));
    const nsuStatus = await this.nsuService.getNsuIntegrityEx(tenantId, companyIds);

    // Check certificate status (Aggregate Logic)
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

    const hasError = nsuStatus.syncStatus === 'error' || certificateStatus === 'expired';
    const hasWarning = nsuStatus.syncStatus === 'warning' || certificateStatus === 'expiring' || certificateStatus === 'missing';

    if (hasError) {
      status = 'red';
      message = certificateStatus === 'expired'
        ? 'Certificado expirado'
        : 'Erro na sincronizacao com SEFAZ';
    } else if (hasWarning) {
      status = 'yellow';
      message = certificateStatus === 'missing'
        ? 'Certificado nao configurado'
        : certificateStatus === 'expiring'
          ? 'Certificado proximo do vencimento'
          : 'Sincronizacao atrasada';
    }

    // Get gaps count
    const gaps = await this.nsuService.getGaps(tenantId, { companyId, limit: 100 });
    const gapsDetected = gaps.reduce((acc, gap) => acc + gap.quantidade, 0);

    return {
      status,
      message,
      details: {
        syncStatus: nsuStatus.syncStatus || 'ok',
        gapsDetected,
        certificateStatus,
        lastSyncAge: nsuStatus.lastSyncAge || null,
      },
    };
  }

  async getGaps(tenantId: string, query: GapsQuery): Promise<Gap[]> {
    // Delegate to optimized service
    const rawGaps = await this.nsuService.getGaps(tenantId, query);

    // Enrich with company names if needed (or minimal implementation)
    // For now returning basic structure tailored to match interface
    return rawGaps.map(g => ({
      ...g,
      companyName: '' // Population would require extra join or frontend lookup
    }));
  }

  async getTimeline(tenantId: string, query: TimelineQuery): Promise<TimelinePoint[]> {
    const conditions = [eq((documents as any).tenantId, tenantId)];

    if (query.companyId) {
      conditions.push(eq((documents as any).companyId, query.companyId));
    }

    if (query.dataInicio) {
      conditions.push(gte((documents as any).dataEmissao, new Date(query.dataInicio)));
    }

    if (query.dataFim) {
      conditions.push(lte((documents as any).dataEmissao, new Date(query.dataFim)));
    }

    const formatMap = {
      day: 'YYYY-MM-DD',
      week: 'IYYY-IW',
      month: 'YYYY-MM',
    } as const;

    const dateFormat = formatMap[query.groupBy];
    const safeDateFormat = dateFormat ?? 'YYYY-MM-DD';

    const result = await this.db
      .select({
        date: sql<string>`TO_CHAR(${(documents as any).dataEmissao}, '${sql.raw(safeDateFormat)}')`,
        nfe: sql<number>`COUNT(*) FILTER (WHERE ${(documents as any).docType} = 'NFE')`,
        cte: sql<number>`COUNT(*) FILTER (WHERE ${(documents as any).docType} = 'CTE')`,
        mdfe: sql<number>`COUNT(*) FILTER (WHERE ${(documents as any).docType} = 'MDFE')`,
        nfse: sql<number>`COUNT(*) FILTER (WHERE ${(documents as any).docType} = 'NFSE')`,
        total: count(),
        valorTotal: sql<number>`COALESCE(SUM(${(documents as any).valorTotal}::numeric), 0)`,
      })
      .from(documents as any)
      .where(and(...conditions))
      .groupBy(sql`TO_CHAR(${(documents as any).dataEmissao}, '${sql.raw(safeDateFormat)}')`)
      .orderBy(sql`TO_CHAR(${(documents as any).dataEmissao}, '${sql.raw(safeDateFormat)}')`);

    return result.map((r) => ({
      date: r.date,
      nfe: Number(r.nfe),
      cte: Number(r.cte),
      mdfe: Number(r.mdfe),
      nfse: Number(r.nfse),
      total: Number(r.total),
      valorTotal: Number(r.valorTotal),
    }));
  }

  async getRecent(tenantId: string, query: RecentQuery) {
    const conditions = [eq((documents as any).tenantId, tenantId)];

    if (query.companyId) {
      conditions.push(eq((documents as any).companyId, query.companyId));
    }

    const result = await (this.db.query as any).documents.findMany({
      where: and(...conditions),
      orderBy: desc((documents as any).createdAt),
      limit: query.limit,
    });

    return result;
  }
}

export const dashboardService = container.resolve(DashboardService);
