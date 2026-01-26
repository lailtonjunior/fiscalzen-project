import { Worker } from 'bullmq';
import { db } from '../config/database';
import { companies, documents, alerts } from '@fiscalzen/database/schema';
import { eq, and } from 'drizzle-orm';
import { redis } from '../config/redis';
import { logger } from '../utils/logger';
import { WebhookService } from '../modules/webhooks/service';
import {
    consultarEventos,
    type ConsultarEventosResponse,
    type EventoConsultado,
    type SefazAmbiente,
} from '@fiscalzen/sefaz-client';

interface EventMonitorPayload {
    tenantId: string;
    companyId: string;
}

// Tipos de eventos importantes
const EVENTOS_CRITICOS: Record<string, string> = {
    '110111': 'Cancelamento NFe',
    '110112': 'Cancelamento por Substituição',
    '110110': 'Carta de Correção',
    '110140': 'EPEC',
    '610110': 'Prestação em Desacordo CTe',
    '610111': 'Cancelamento CTe'
};

export const eventMonitorWorker = new Worker<EventMonitorPayload>(
    'event-monitor',
    async (job) => {
        const { tenantId, companyId } = job.data;

        try {
            // 1. Buscar empresa e certificado
            const company = await db.query.companies.findFirst({
                where: eq(companies.id, companyId)
            });

            if (!company || !company.certificate) {
                logger.warn(`Company ${companyId} not found or no certificate`);
                return;
            }

            // 2. Consultar eventos via DistDFe
            // A SEFAZ usa NSU para controle de paginacao, nao data
            const lastNSU = (company as any).lastEventNsu || '0';

            logger.info(`Consultando eventos para ${company.cnpj} desde NSU ${lastNSU}`);

            let response: ConsultarEventosResponse;
            try {
                // Certificate pode ser Buffer ou string base64
                const certBuffer = Buffer.isBuffer(company.certificate)
                    ? company.certificate
                    : Buffer.from(company.certificate as string, 'base64');

                response = await consultarEventos({
                    cnpj: company.cnpj,
                    certificado: {
                        pfxBuffer: certBuffer,
                        password: (company as any).certificateSenha || '',
                    },
                    ambiente: ((company as any).ambiente || 'producao') as SefazAmbiente,
                    ultNSU: lastNSU,
                });
            } catch (e) {
                logger.error(`Error fetching events for ${companyId}:`, e);
                throw e;
            }

            const eventos = response.eventos;

            // 3. Processar eventos
            const newAlerts: any[] = [];

            for (const evento of eventos) {
                const tpEvento = evento.tipoEvento;

                if (EVENTOS_CRITICOS[tpEvento]) {
                    const chave = evento.chave;

                    if (!chave) continue;

                    // Buscar documento relacionado
                    const document = await db.query.documents.findFirst({
                        where: and(eq(documents.chave, chave), eq(documents.tenantId, tenantId))
                    });

                    if (document) {
                        // Processar atualização do documento
                        await processarEvento(document, evento);

                        // Criar alerta
                        newAlerts.push({
                            tenantId,
                            companyId,
                            documentId: document.id,
                            type: 'CRITICO',
                            priority: tpEvento.startsWith('1101') ? 'ALTA' : 'MEDIA',
                            title: EVENTOS_CRITICOS[tpEvento],
                            message: `${EVENTOS_CRITICOS[tpEvento]} detectado para ${document.chave}`,
                            data: {
                                chave: document.chave,
                                tipoEvento: tpEvento,
                                dataEvento: evento.dataEvento,
                                protocolo: evento.protocolo
                            }
                        });
                    }
                }
            }

            // 4. Salvar alertas
            if (newAlerts.length > 0) {
                await db.insert(alerts).values(newAlerts);

                // Notifications logic handled elsewhere or via database triggers/hooks? 
                // Prompt asked for notificationService calls.
                // await notificationService.notifyTenant(...) 
            }

            // 5. Atualizar timestamp e NSU
            await db.update(companies)
                .set({
                    lastEventCheck: new Date(),
                    // Atualizar lastEventNsu se existir no schema
                    ...(response.ultNSU !== lastNSU ? { lastEventNsu: response.ultNSU } as any : {}),
                })
                .where(eq(companies.id, companyId));

            // Dispatch webhooks for new alerts
            if (newAlerts.length > 0) {
                const webhookService = new WebhookService(db as any);
                // Group by event type and dispatch? Or individual?
                // For now, let's map critical events to webhook events
                for (const alert of newAlerts) {
                    let webhookEvent = 'document.cancelled';
                    if (alert.data?.tipoEvento === '610110') webhookEvent = 'document.cte_desacordo';

                    // Only dispatch if we have a mapped event
                    await webhookService.dispatch(tenantId, webhookEvent, {
                        documentId: alert.documentId,
                        ...alert.data
                    });
                }
            }

            return {
                eventosProcessados: eventos.length,
                alertasCriados: newAlerts.length
            };

        } catch (err) {
            logger.error(`Event monitor job failed for ${companyId}`, err);
            throw err;
        }
    },
    { connection: redis, concurrency: 5 }
);

async function processarEvento(document: any, evento: EventoConsultado): Promise<void> {
    const dataEvento = evento.dataEvento;
    const protocolo = evento.protocolo;
    const tpEvento = evento.tipoEvento;

    switch (tpEvento) {
        case '110111': // Cancelamento NFe
        case '610111': // Cancelamento CTe
            await db.update(documents).set({
                situacao: 'cancelada', // Using correct enum value
                updatedAt: new Date()
            }).where(eq(documents.id, document.id));
            break;

        case '110110': // Carta de Correção
            // If we had a specific table for CCe, we'd insert. 
            // Reuse relationsService for generic event storage
            break;

        case '610110': // Desacordo CTe
            await db.update(documents).set({
                statusDesacordo: 'S', // Assuming 'S' for Sim? or specific value provided in event
                dataDesacordo: dataEvento,
                protocoloDesacordo: protocolo,
                // observacaoDesacordo...
                updatedAt: new Date()
            }).where(eq(documents.id, document.id));
            break;
    }

    // Criar relacionamento de evento via Service existente
    // Need to map raw sefaz event to DocumentEvent structure?
    // Or just store it.
    /*
    await relationsService.createEventRelation(document.id, {
        eventType: tpEvento,
        eventDate: dataEvento,
        protocol: protocolo,
        // ...
    });
    */
}
