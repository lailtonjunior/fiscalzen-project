import { injectable, inject, container } from 'tsyringe';
import { eq, and, sql } from 'drizzle-orm';
import { nsuControl, documents } from '@fiscalzen/database/schema';
import { DATABASE_TOKEN } from '../../providers/database';
import type { Database } from '../../config/database';
import type { GapsQuery } from '../dashboard/schemas';

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

export interface Gap {
    companyId: string;
    docType: string;
    serie: string;
    inicio: number;
    fim: number;
    quantidade: number;
}

@injectable()
export class NsuService {
    constructor(@inject(DATABASE_TOKEN) private db: Database) { }

    /**
     * Calculates NSU synchronization status and gaps.
     */
    async getNsuIntegrityEx(_tenantId: string, companyIds: string[]): Promise<Partial<IntegrityStatus['details']>> {
        const nsuStatus = { hasError: false, hasWarning: false, lastSyncAge: null as number | null };

        if (companyIds.length > 0) {
            const nsuData = await this.db
                .select()
                .from(nsuControl as any)
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

        return {
            syncStatus: nsuStatus.hasError ? 'error' : nsuStatus.hasWarning ? 'warning' : 'ok',
            lastSyncAge: nsuStatus.lastSyncAge,
        };
    }

    /**
     * Optimized Gap Detection using SQL.
     * Replaces the in-memory array iteration from the old DashboardService.
     */
    async getGaps(tenantId: string, query: GapsQuery): Promise<Gap[]> {
        const docs = documents as any;
        const conditions = [eq(docs.tenantId, tenantId)];

        if (query.companyId) conditions.push(eq(docs.companyId, query.companyId));
        if (query.docType) conditions.push(eq(docs.docType, query.docType));
        if (query.serie) conditions.push(eq(docs.serie, query.serie));

        // Advanced SQL Gap Detection:
        // Finds rows where (numero - prev_numero) > 1 within the same partitioning (company, type, serie)
        const gapsQuery = sql`
      WITH CTE_Sequence AS (
        SELECT 
          company_id, 
          doc_type, 
          serie::text as serie, 
          numero,
          LAG(numero) OVER (
            PARTITION BY company_id, doc_type, serie 
            ORDER BY numero
          ) as prev_numero
        FROM documents
        WHERE ${and(...conditions)}
      )
      SELECT 
        company_id as "companyId",
        doc_type as "docType",
        serie,
        (prev_numero + 1) as "inicio",
        (numero - 1) as "fim",
        (numero - prev_numero - 1) as "quantidade"
      FROM CTE_Sequence
      WHERE (numero - prev_numero) > 1
      LIMIT ${query.limit || 100}
    `;

        // Execute raw query as Drizzle doesn't native support this complexity easily yet
        const result = await this.db.execute(gapsQuery);

        return result.rows.map((row: any) => ({
            companyId: row.companyId,
            docType: row.docType,
            serie: row.serie,
            inicio: Number(row.inicio),
            fim: Number(row.fim),
            quantidade: Number(row.quantidade),
        }));
    }
}

export const nsuService = container.resolve(NsuService);
