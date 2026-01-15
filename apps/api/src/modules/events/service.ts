import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from '../../config/database';
import { documentEvents, documents } from '@fiscalzen/database/schema';
import { NotFoundError } from '../../utils/errors';
import type { ListEventsQuery } from './schemas';

export const eventsService = {
  async listByDocument(tenantId: string, documentId: string, query: ListEventsQuery) {
    const { page, limit } = query;
    const offset = (page - 1) * limit;

    // Verify document belongs to tenant
    const document = await db.query.documents.findFirst({
      where: and(eq(documents.id, documentId), eq(documents.tenantId, tenantId)),
    });

    if (!document) {
      throw new NotFoundError('Documento', documentId);
    }

    const [items, countResult] = await Promise.all([
      db
        .select()
        .from(documentEvents)
        .where(eq(documentEvents.documentId, documentId))
        .orderBy(desc(documentEvents.dhEvento))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(documentEvents)
        .where(eq(documentEvents.documentId, documentId)),
    ]);

    return {
      items,
      total: Number(countResult[0]?.count ?? 0),
    };
  },

  async getEventById(tenantId: string, documentId: string, eventId: string) {
    // Verify document belongs to tenant
    const document = await db.query.documents.findFirst({
      where: and(eq(documents.id, documentId), eq(documents.tenantId, tenantId)),
    });

    if (!document) {
      throw new NotFoundError('Documento', documentId);
    }

    const event = await db.query.documentEvents.findFirst({
      where: and(
        eq(documentEvents.id, eventId),
        eq(documentEvents.documentId, documentId)
      ),
    });

    if (!event) {
      throw new NotFoundError('Evento', eventId);
    }

    return event;
  },
};
