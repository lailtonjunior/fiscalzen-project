import { injectable, inject } from 'tsyringe';
import { eq, and, desc, sql, count } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '@fiscalzen/database/schema';
import { alerts } from '@fiscalzen/database/schema';
import { DATABASE_TOKEN } from '../../providers/database';

type Database = NodePgDatabase<typeof schema>;

export interface AlertaFilters {
    lido?: boolean;
    prioridade?: string;
    tipo?: string;
    page?: number;
    limit?: number;
}

@injectable()
export class AlertasService {
    constructor(
        @inject(DATABASE_TOKEN) private db: Database
    ) { }

    async getAlertas(tenantId: string, filters?: AlertaFilters) {
        const page = filters?.page || 1;
        const limit = filters?.limit || 20;

        return this.db
            .select()
            .from(alerts)
            .where(and(
                eq(alerts.tenantId, tenantId),
                filters?.lido !== undefined ? eq(alerts.lido, filters.lido) : undefined,
                filters?.prioridade ? eq(alerts.priority, filters.prioridade) : undefined,
                filters?.tipo ? eq(alerts.type, filters.tipo) : undefined
            ))
            .orderBy(desc(alerts.createdAt))
            .limit(limit)
            .offset((page - 1) * limit);
    }

    async marcarComoLido(alertaId: string, tenantId: string): Promise<void> {
        await this.db
            .update(alerts)
            .set({ lido: true, lidoEm: new Date() })
            .where(and(
                eq(alerts.id, alertaId),
                eq(alerts.tenantId, tenantId)
            ));
    }

    async marcarTodosComoLidos(tenantId: string): Promise<void> {
        await this.db
            .update(alerts)
            .set({ lido: true, lidoEm: new Date() })
            .where(and(
                eq(alerts.tenantId, tenantId),
                eq(alerts.lido, false)
            ));
    }

    async getResumo(tenantId: string) {
        const [result] = await this.db
            .select({
                total: count(alerts.id),
                naoLidos: count(sql`CASE WHEN ${alerts.lido} = false THEN 1 END`),
                altaPrioridade: count(sql`CASE WHEN ${alerts.priority} = 'ALTA' AND ${alerts.lido} = false THEN 1 END`)
            })
            .from(alerts)
            .where(eq(alerts.tenantId, tenantId));

        return {
            total: Number(result?.total || 0),
            naoLidos: Number(result?.naoLidos || 0),
            altaPrioridade: Number(result?.altaPrioridade || 0)
        };
    }
}
