import { and, desc, eq } from 'drizzle-orm';
import { injectable, inject, container } from 'tsyringe';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '@fiscalzen/database/schema';
import { DATABASE_TOKEN } from '../../providers/database';
import { NotFoundError } from '../../utils/errors';

type Database = NodePgDatabase<typeof schema>;

export interface RegisterHistoryInput {
  tenantId: string;
  documentId?: string | null;
  companyId?: string | null;
  userId?: string | null;
  eventType: string;
  source: string;
  title: string;
  summary?: string | null;
  details?: Record<string, unknown> | null;
  createdAt?: Date;
}

export interface HistoryTimelineItem {
  id: string;
  eventType: string;
  source: string;
  title: string;
  summary: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
  kind: 'audit' | 'fiscal-event';
}

const fiscalEventTitles: Record<string, string> = {
  '110111': 'Cancelamento registrado',
  '210200': 'Confirmacao da operacao',
  '210210': 'Ciencia da operacao',
  '210220': 'Desconhecimento da operacao',
  '210240': 'Operacao nao realizada',
  '610110': 'Prestacao em desacordo',
};

const auditEventTitles: Record<string, string> = {
  'document.synced': 'Documento sincronizado',
  'document.summary.synced': 'Resumo sincronizado',
  'document.uploaded': 'Documento importado manualmente',
  'download.batch.queued': 'Pacote enfileirado',
  'download.batch.processing_started': 'Processamento do pacote iniciado',
  'download.batch.completed': 'Pacote concluido',
  'download.batch.failed': 'Falha no pacote',
  'download.batch.accessed': 'ZIP acessado',
  'pdf.requested': 'Geracao de PDF solicitada',
  'pdf.generated': 'PDF fiscal disponibilizado',
  'pdf.failed': 'Falha ao gerar PDF',
};

function normalizeDetails(details: Record<string, unknown> | null | undefined) {
  if (!details) {
    return null;
  }

  return Object.fromEntries(
    Object.entries(details).filter(([, value]) => value !== undefined)
  );
}

function toIsoDate(value: Date | string | null | undefined) {
  if (!value) {
    return new Date(0).toISOString();
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date(0).toISOString() : date.toISOString();
}

@injectable()
export class HistoryService {
  constructor(@inject(DATABASE_TOKEN) private db: Database) {}

  async registerEvent(input: RegisterHistoryInput) {
    const [event] = await this.registerMany([input]);

    return event;
  }

  async registerMany(inputs: RegisterHistoryInput[]) {
    if (inputs.length === 0) {
      return [];
    }

    return this.db
      .insert(schema.documentHistory)
      .values(
        inputs.map((input) => ({
          tenantId: input.tenantId,
          documentId: input.documentId ?? null,
          companyId: input.companyId ?? null,
          userId: input.userId ?? null,
          eventType: input.eventType,
          source: input.source,
          title: input.title,
          summary: input.summary ?? null,
          details: input.details ?? {},
          createdAt: input.createdAt,
        }))
      )
      .returning();
  }

  async listByDocument(tenantId: string, documentId: string, limit = 100): Promise<HistoryTimelineItem[]> {
    const document = await this.db.query.documents.findFirst({
      where: and(eq(schema.documents.id, documentId), eq(schema.documents.tenantId, tenantId)),
    });

    if (!document) {
      throw new NotFoundError('Documento', documentId);
    }

    const [auditItems, fiscalItems] = await Promise.all([
      this.db.query.documentHistory.findMany({
        where: and(
          eq(schema.documentHistory.tenantId, tenantId),
          eq(schema.documentHistory.documentId, documentId)
        ),
        orderBy: [desc(schema.documentHistory.createdAt)],
        limit,
      }),
      this.db.query.documentEvents.findMany({
        where: eq(schema.documentEvents.documentId, documentId),
        orderBy: [desc(schema.documentEvents.eventDate), desc(schema.documentEvents.createdAt)],
        limit,
      }),
    ]);

    const combined = [
      ...auditItems.map<HistoryTimelineItem>((item) => ({
        id: item.id,
        eventType: item.eventType,
        source: item.source,
        title: item.title || auditEventTitles[item.eventType] || 'Evento operacional',
        summary: item.summary ?? null,
        details: normalizeDetails(item.details as Record<string, unknown> | null),
        createdAt: toIsoDate(item.createdAt),
        kind: 'audit',
      })),
      ...fiscalItems.map<HistoryTimelineItem>((item) => {
        const metadata = (item.metadata as Record<string, unknown> | null) ?? null;
        const createdAt = item.eventDate ?? item.createdAt ?? new Date();

        return {
          id: item.id,
          eventType: item.eventType,
          source: 'sefaz.events',
          title: fiscalEventTitles[item.eventType] ?? item.description ?? 'Evento fiscal',
          summary: item.description ?? null,
          details: normalizeDetails({
            protocol: item.protocol,
            ...metadata,
          }),
          createdAt: toIsoDate(createdAt),
          kind: 'fiscal-event',
        };
      }),
    ];

    return combined
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }
}

export const historyService = container.resolve(HistoryService);
