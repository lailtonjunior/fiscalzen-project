import { eq, and, desc, sql } from 'drizzle-orm';
import { documentEvents, documents } from '@fiscalzen/database/schema';
import { NotFoundError, ValidationError } from '../../utils/errors';
import { parseResEvento, parseProcEventoNFe } from '@fiscalzen/xml-parser';
import { StorageService, type StorageKey } from '../../services/storage';
import type { ListEventsQuery } from './schemas';
import { injectable, inject, container } from 'tsyringe';
import { DATABASE_TOKEN } from '../../providers/database';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '@fiscalzen/database/schema';
import { historyService } from '../history/service';

// Helper types
type Database = NodePgDatabase<typeof schema>;

interface EventoData {
  chave: string;
  tpEvento: string;
  descEvento: string;
  dhEvento: string;
  nSeqEvento: number;
  nProt?: string;
  cStat: string;
  xMotivo: string;
}

@injectable()
export class EventsService {
  constructor(
    @inject(DATABASE_TOKEN) private db: Database,
    @inject(StorageService) private storage: StorageService
  ) { }

  async listByDocument(tenantId: string, documentId: string, query: ListEventsQuery) {
    const { page, limit } = query;
    const offset = (page - 1) * limit;

    // Verify document belongs to tenant
    const document = await this.db.query.documents.findFirst({
      where: and(eq(documents.id, documentId), eq(documents.tenantId, tenantId)),
    });

    if (!document) {
      throw new NotFoundError('Documento', documentId);
    }

    const [items, countResult] = await Promise.all([
      this.db
        .select()
        .from(documentEvents)
        .where(eq(documentEvents.documentId, documentId))
        .orderBy(desc(documentEvents.eventDate), desc(documentEvents.createdAt))
        .limit(limit)
        .offset(offset),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(documentEvents)
        .where(eq(documentEvents.documentId, documentId)),
    ]);

    return {
      items,
      total: Number(countResult[0]?.count ?? 0),
    };
  }

  async getEventById(tenantId: string, documentId: string, eventId: string) {
    // Verify document belongs to tenant (security check)
    const document = await this.db.query.documents.findFirst({
      where: and(eq(documents.id, documentId), eq(documents.tenantId, tenantId)),
    });

    if (!document) {
      throw new NotFoundError('Documento', documentId);
    }

    const event = await this.db.query.documentEvents.findFirst({
      where: and(eq(documentEvents.id, eventId), eq(documentEvents.documentId, documentId)),
    });

    if (!event) {
      throw new NotFoundError('Evento', eventId);
    }

    return event;
  }

  /**
   * Ingests an event XML (procEventoNFe or resEvento).
   * Updates document status if applicable.
   */
  async ingestEvent(params: {
    tenantId: string;
    // companyId is optional as we might derive it from document, but good for validation
    companyId?: string;
    xmlContent: string;
  }) {
    const { tenantId, xmlContent } = params;

    // 1. Parsing
    // Try to parse as resEvento first, then procEventoNFe
    let eventoData: EventoData;

    try {
      const resEvento = parseResEvento(xmlContent);
      eventoData = {
        chave: resEvento.chave,
        tpEvento: resEvento.tipoEvento,
        descEvento: resEvento.descricaoEvento,
        dhEvento: resEvento.dataEvento.toISOString(),
        nSeqEvento: resEvento.sequencia,
        nProt: resEvento.protocolo,
        cStat: '135', // Assumed authorized if returned as summary
        xMotivo: '', // Summary doesn't have motivo
      };
    } catch {
      // Try procEventoNFe
      try {
        const procEvento = parseProcEventoNFe(xmlContent);
        eventoData = {
          chave: procEvento.evento.chave,
          tpEvento: procEvento.evento.tipoEvento,
          descEvento: procEvento.evento.descricaoEvento,
          dhEvento: procEvento.evento.dataEvento.toISOString(),
          nSeqEvento: procEvento.evento.sequencia,
          nProt: procEvento.retorno.protocolo,
          cStat: procEvento.retorno.status.toString(),
          xMotivo: procEvento.retorno.motivo,
        };
      } catch {
        throw new ValidationError('Formato de evento XML nao reconhecido (esperado procEvento ou resEvento)');
      }
    }

    // 2. Find Parent Document
    // We search by Chave + Tenant to ensure ownership
    const document = await this.db.query.documents.findFirst({
      where: and(eq(documents.chave, eventoData.chave), eq(documents.tenantId, tenantId)),
    });

    if (!document) {
      // If we don't have the document, we can't attach the event.
      // Strategy: Skip with warning.
      return { success: true, action: 'skip_no_document', chave: eventoData.chave };
    }

    // 3. Idempotency
    // Schema uses eventType / eventSeq
    const existingEvent = await this.db.query.documentEvents.findFirst({
      where: and(
        eq(documentEvents.documentId, document.id),
        eq(documentEvents.eventType, eventoData.tpEvento),
        eq(documentEvents.eventSeq, eventoData.nSeqEvento)
      ),
    });

    if (existingEvent) {
      return { success: true, action: 'skip', eventId: existingEvent.id };
    }

    // 4. Storage (S3)
    const eventDate = new Date(eventoData.dhEvento);
    const storageParams: StorageKey = {
      tenantId,
      companyId: document.companyId, // Use document's company
      docType: document.docType,
      year: eventDate.getFullYear(),
      month: eventDate.getMonth() + 1,
      documentId: `${eventoData.chave}-${eventoData.tpEvento}-${eventoData.nSeqEvento}`,
    };

    let xmlStorageKey: string | null = null;
    try {
      xmlStorageKey = await this.storage.uploadXml(storageParams, xmlContent);
    } catch (e) {
      // Log but continue? No, ensure data integrity needs storage.
      // Or maybe allow fail if strict reliability isn't critical?
      // Better to throw.
      throw e; // Bubble up, let job retry
    }

    // 5. Persistence
    const [event] = await this.db
      .insert(documentEvents)
      .values({
        documentId: document.id,
        eventType: eventoData.tpEvento,
        description: eventoData.descEvento,
        eventSeq: eventoData.nSeqEvento,
        eventDate: eventDate,
        protocol: eventoData.nProt,
        xmlStorageKey,
        metadata: {
          cStat: eventoData.cStat,
          xMotivo: eventoData.xMotivo,
        },
      })
      .returning();

    // 6. Update Document Status (Side Effect)
    await this.updateDocumentFromEvento(document.id, eventoData);

    await historyService.registerEvent({
      tenantId,
      documentId: document.id,
      companyId: document.companyId,
      eventType: `document.event.${eventoData.tpEvento}`,
      source: 'events.ingest',
      title: 'Evento fiscal sincronizado',
      summary: `${eventoData.descEvento} recebido para a chave ${eventoData.chave}`,
      details: {
        protocol: eventoData.nProt ?? null,
        cStat: eventoData.cStat,
        xMotivo: eventoData.xMotivo,
        eventType: eventoData.tpEvento,
        eventSeq: eventoData.nSeqEvento,
        sourceId: event.id,
        correlationId: `${document.id}:${eventoData.tpEvento}:${eventoData.nSeqEvento}`,
      },
      createdAt: eventDate,
    });

    return { success: true, action: 'create', eventId: event.id };
  }

  private async updateDocumentFromEvento(documentId: string, evento: EventoData) {
    const updates: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    // Update situacao based on event type
    switch (evento.tpEvento) {
      case '110111': // Cancelamento
        updates.situacao = 'cancelada';
        break;
      case '210200': // Confirmacao da Operacao
      case '210210': // Ciencia da Emissao
      case '210220': // Desconhecimento da Operacao
      case '210240': // Operacao nao Realizada
        updates.manifestacao = evento.tpEvento;
        updates.manifestacaoData = new Date(evento.dhEvento);
        break;
    }

    await this.db.update(documents).set(updates).where(eq(documents.id, documentId));
  }
}

// Export singleton instance for backward compatibility
export const eventsService = container.resolve(EventsService);

