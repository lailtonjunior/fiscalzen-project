import { FastifyPluginAsync } from 'fastify';
import { Queue } from 'bullmq';
import { desc, eq, and } from 'drizzle-orm';
import { redis } from '../../config/redis';
import { db } from '../../config/database';
import { documentsService } from '../documents/service';
import { downloadRegistry } from '@fiscalzen/database/schema';
import { zodToFastify, standardResponses } from '../../utils/schema-converter';
import { sendSuccess } from '../../utils/response';
import { ValidationError, NotFoundError } from '../../utils/errors';
import { batchDownloadSchema, downloadJobParamsSchema, type BatchDownloadInput } from './schemas';
import { getTenantId, getUserId } from '../../plugins/auth';
import { historyService } from '../history/service';
import { storage } from '../../services/storage';
import { sanitizeDownloadResult } from './public-result';

// Reusing the queue name from worker
const BATCH_QUEUE_NAME = 'batch-download';
const batchDownloadQueue = new Queue(BATCH_QUEUE_NAME, { connection: redis });

async function resolveTargetDocuments(tenantId: string, documentIds?: string[], filters?: Record<string, unknown>) {
    if (documentIds && documentIds.length > 0) {
        const documents = await Promise.all(documentIds.map((id) => documentsService.getById(tenantId, id)));
        return documents.map((document) => ({
            id: document.id,
            companyId: document.companyId,
            chave: document.chave,
        }));
    }

    if (filters) {
        const result = await documentsService.list(tenantId, {
            ...filters,
            page: 1,
            limit: 5000,
            sortBy: 'createdAt',
            sortOrder: 'desc',
        } as any);

        const documents = await Promise.all(result.items.map((item) => documentsService.getById(tenantId, item.id)));
        return documents.map((document) => ({
            id: document.id,
            companyId: document.companyId,
            chave: document.chave,
        }));
    }

    return [];
}

async function registerBatchHistory(params: {
    tenantId: string;
    userId?: string;
    documentIds?: string[];
    filters?: Record<string, unknown>;
    eventType: string;
    source: string;
    title: string;
    summary: string;
    details?: Record<string, unknown>;
}) {
    const targets = await resolveTargetDocuments(params.tenantId, params.documentIds, params.filters);

    if (targets.length === 0) {
        await historyService.registerEvent({
            tenantId: params.tenantId,
            userId: params.userId,
            eventType: params.eventType,
            source: params.source,
            title: params.title,
            summary: params.summary,
            details: params.details,
        });
        return;
    }

    await historyService.registerMany(
        targets.map((target) => ({
            tenantId: params.tenantId,
            documentId: target.id,
            companyId: target.companyId,
            userId: params.userId,
            eventType: params.eventType,
            source: params.source,
            title: params.title,
            summary: params.summary,
            details: {
                ...params.details,
                chave: target.chave,
            },
        }))
    );
}

async function syncRegistryFromJob(jobId: string, tenantId: string) {
    const job = await batchDownloadQueue.getJob(jobId);

    if (!job || job.data.tenantId !== tenantId) {
        return null;
    }

    const state = await job.getState();
    const progress = typeof job.progress === 'number' ? job.progress : 0;
    const status = state === 'waiting' || state === 'delayed' ? 'queued' : state;
    const result = status === 'completed' ? job.returnvalue ?? null : null;
    const error = status === 'failed' ? job.failedReason ?? null : null;

    await db
        .update(downloadRegistry)
        .set({
            status,
            progress: status === 'completed' ? 100 : progress,
            startedAt: job.processedOn ? new Date(job.processedOn) : undefined,
            finishedAt: job.finishedOn ? new Date(job.finishedOn) : undefined,
            result,
            downloadUrl: result?.downloadUrl,
            processedDocuments: result?.processed,
            errorCount: result?.errors,
            errorMessage: error,
            updatedAt: new Date(),
        })
        .where(and(eq(downloadRegistry.jobId, jobId), eq(downloadRegistry.tenantId, tenantId)));

    return ({
        status,
        progress: status === 'completed' ? 100 : progress,
        result,
        error,
    });
}

export const downloadsRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.addHook('preHandler', fastify.authenticate);

    // GET /api/v1/downloads/batch - Listar downloads em lote recentes
    fastify.get('/batch', {
        schema: {
            tags: ['Downloads'],
            summary: 'Listar downloads em lote',
            description: 'Lista jobs recentes de download em lote do tenant autenticado',
            response: {
                200: {
                    description: 'Lista de downloads em lote',
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        data: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    jobId: { type: 'string' },
                                    status: { type: 'string' },
                                    progress: { type: 'number' },
                                    estimatedDocuments: { type: 'integer' },
                                    format: { type: 'string' },
                                    includeMetadata: { type: 'boolean' },
                                    organizacao: { type: 'string' },
                                    createdAt: { type: 'string' },
                                    processedAt: { type: 'string', nullable: true },
                                    finishedAt: { type: 'string', nullable: true },
                                    result: { type: 'object', nullable: true },
                                    error: { type: 'string', nullable: true },
                                },
                            },
                        },
                    },
                },
                401: standardResponses[401],
            }
        },
        handler: async (request, reply) => {
            const tenantId = getTenantId(request);
            const registryRows = await db
                .select()
                .from(downloadRegistry)
                .where(eq(downloadRegistry.tenantId, tenantId))
                .orderBy(desc(downloadRegistry.createdAt))
                .limit(50);

            const downloads = await Promise.all(
                registryRows.map(async (row) => {
                    const live = row.status === 'queued' || row.status === 'active'
                        ? await syncRegistryFromJob(row.jobId, tenantId)
                        : null;

                    const result = live?.result ?? row.result as any;

                    return ({
                        jobId: row.jobId,
                        status: live?.status ?? row.status,
                        progress: live?.progress ?? row.progress,
                        estimatedDocuments: row.estimatedDocuments,
                        format: row.format,
                        includeMetadata: row.includeMetadata,
                        organizacao: row.organizacao,
                        createdAt: row.createdAt?.toISOString(),
                        processedAt: row.startedAt?.toISOString() ?? null,
                        finishedAt: row.finishedAt?.toISOString() ?? null,
                        result: sanitizeDownloadResult(result as Record<string, unknown> | null),
                        error: live?.error ?? row.errorMessage,
                    });
                })
            );

            return sendSuccess(reply, downloads);
        }
    });

    // POST /api/v1/downloads/batch - Iniciar download em lote
    fastify.post<{
        Body: BatchDownloadInput;
    }>('/batch', {
        schema: {
            tags: ['Downloads'],
            summary: 'Download em lote',
            description: 'Solicita processamento de download em massa de documentos. Retorna um Job ID.',
            body: zodToFastify(batchDownloadSchema),
            response: {
                202: {
                    description: 'Download enfileirado',
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        data: {
                            type: 'object',
                            properties: {
                                jobId: { type: 'string' },
                                status: { type: 'string' },
                                estimatedDocuments: { type: 'integer' },
                                estimatedTimeSeconds: { type: 'integer' },
                            },
                        },
                    },
                },
                400: standardResponses[400],
                401: standardResponses[401],
            }
        },
        handler: async (request, reply) => {
            const tenantId = getTenantId(request);
            const userId = getUserId(request);
            const body = batchDownloadSchema.parse(request.body);
            const { documentIds, filters, format, includeMetadata, organizacao } = body;

            // Validar que tem IDs ou filtros
            if ((!documentIds || documentIds.length === 0) && !filters) {
                throw new ValidationError('Informe documentIds ou filters');
            }

            // Estimar quantidade se usar filtros
            let estimatedCount = documentIds?.length || 0;
            if (filters) {
                // Optimization: documentsService.list returns { items, total }
                // We assume countByFilter or list handles minimal overhead for count
                const { total } = await documentsService.list(tenantId, { ...filters, page: 1, limit: 1, sortBy: 'createdAt', sortOrder: 'desc' });
                estimatedCount = total;

                if (estimatedCount > 5000) {
                    throw new ValidationError(`Muitos documentos (${estimatedCount}). Maximo: 5000. Refine os filtros.`);
                }
            }

            const job = await batchDownloadQueue.add('download', {
                tenantId,
                userId,
                documentIds,
                filters,
                format,
                includeMetadata,
                organizacao
            }, {
                removeOnComplete: { age: 24 * 60 * 60 }, // Manter 24h
                removeOnFail: { age: 7 * 24 * 60 * 60 }  // Manter falhas 7 dias
            });

            await db.insert(downloadRegistry).values({
                tenantId,
                userId,
                jobId: String(job.id),
                status: 'queued',
                progress: 0,
                format,
                includeMetadata,
                organizacao,
                estimatedDocuments: estimatedCount,
                documentIds: documentIds ?? null,
                filters: filters ?? null,
            });

            await registerBatchHistory({
                tenantId,
                userId,
                documentIds,
                filters: filters ?? undefined,
                eventType: 'download.batch.queued',
                source: 'downloads.route',
                title: 'Pacote enfileirado',
                summary: `Solicitacao de exportacao em lote criada para o pacote ${job.id}`,
                details: {
                    jobId: String(job.id),
                    sourceId: String(job.id),
                    correlationId: String(job.id),
                    format,
                    includeMetadata,
                    organizacao,
                    estimatedDocuments: estimatedCount,
                },
            });

            return sendSuccess(reply, {
                jobId: String(job.id),
                status: 'queued',
                estimatedDocuments: estimatedCount,
                estimatedTimeSeconds: Math.ceil(estimatedCount * 0.5)
            }, 202);
        }
    });

    // GET /api/v1/downloads/batch/:jobId - Status do download
    fastify.get<{
        Params: { jobId: string };
    }>('/batch/:jobId', {
        schema: {
            tags: ['Downloads'],
            summary: 'Status do download',
            description: 'Consulta o status ou resultado de um job de download em lote',
            params: zodToFastify(downloadJobParamsSchema),
            response: {
                200: {
                    description: 'Status do job',
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        data: {
                            type: 'object',
                            properties: {
                                status: { type: 'string', enum: ['queued', 'active', 'completed', 'failed'] },
                                progress: { type: 'number' },
                                result: { type: 'object', nullable: true }, // URL de download, etc.
                                error: { type: 'string', nullable: true },
                            },
                        },
                    },
                },
                401: standardResponses[401],
                404: standardResponses[404],
            }
        },
        handler: async (request, reply) => {
            const { jobId } = downloadJobParamsSchema.parse(request.params);
            const tenantId = getTenantId(request);
            const registryRow = await db.query.downloadRegistry.findFirst({
                where: and(eq(downloadRegistry.jobId, jobId), eq(downloadRegistry.tenantId, tenantId)),
            });

            if (!registryRow) {
                throw new NotFoundError('Download', jobId);
            }

            const job = await batchDownloadQueue.getJob(jobId);

            if (!job) {
                return sendSuccess(reply, {
                    status: registryRow.status,
                    progress: registryRow.progress,
                    result: sanitizeDownloadResult(registryRow.result as Record<string, unknown> | null),
                    error: registryRow.errorMessage,
                });
            }

            if (job.data.tenantId !== tenantId) {
                throw new NotFoundError('Download', jobId);
            }

            const state = await job.getState();
            const progress = typeof job.progress === 'number' ? job.progress : 0;

            if (state === 'completed') {
                await syncRegistryFromJob(jobId, tenantId);
                return sendSuccess(reply, {
                    status: 'completed',
                    progress: 100,
                    result: sanitizeDownloadResult(job.returnvalue as Record<string, unknown> | null),
                    error: null,
                });
            }

            if (state === 'failed') {
                await syncRegistryFromJob(jobId, tenantId);
                return sendSuccess(reply, {
                    status: 'failed',
                    progress,
                    result: null,
                    error: job.failedReason,
                });
            }

            const status = state === 'active' ? 'active' : 'queued';
            await syncRegistryFromJob(jobId, tenantId);
            return sendSuccess(reply, {
                status,
                progress,
                result: null,
                error: null,
            });
        }
    });

    // GET /api/v1/downloads/batch/:jobId/download - Gera URL atualizada e registra acesso
    fastify.get<{
        Params: { jobId: string };
    }>('/batch/:jobId/download', {
        schema: {
            tags: ['Downloads'],
            summary: 'Obter URL do ZIP concluido',
            description: 'Retorna uma URL temporaria para o ZIP e registra o acesso para auditoria',
            params: zodToFastify(downloadJobParamsSchema),
            response: {
                200: {
                    description: 'URL de download',
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        data: {
                            type: 'object',
                            properties: {
                                url: { type: 'string' },
                                expiresInSeconds: { type: 'integer' },
                            },
                        },
                    },
                },
                401: standardResponses[401],
                404: standardResponses[404],
            }
        },
        handler: async (request, reply) => {
            const { jobId } = downloadJobParamsSchema.parse(request.params);
            const tenantId = getTenantId(request);
            const userId = getUserId(request);

            const row = await db.query.downloadRegistry.findFirst({
                where: and(eq(downloadRegistry.jobId, jobId), eq(downloadRegistry.tenantId, tenantId)),
            });

            if (!row) {
                throw new NotFoundError('Download', jobId);
            }

            if (row.status === 'queued' || row.status === 'active') {
                await syncRegistryFromJob(jobId, tenantId);
            }

            const latest = await db.query.downloadRegistry.findFirst({
                where: and(eq(downloadRegistry.jobId, jobId), eq(downloadRegistry.tenantId, tenantId)),
            });

            if (!latest || latest.status !== 'completed') {
                throw new ValidationError('Pacote ainda nao esta disponivel para download');
            }

            const result = (latest.result as Record<string, unknown> | null) ?? null;
            const storageKey = typeof result?.storageKey === 'string' ? result.storageKey : null;

            if (!storageKey) {
                throw new ValidationError('Pacote concluido sem chave de armazenamento registrada');
            }

            const expiresInSeconds = 24 * 60 * 60;
            let url: string;

            try {
                url = await storage.generatePresignedUrl(storageKey, expiresInSeconds);
            } catch {
                throw new ValidationError('Arquivo do pacote indisponivel no storage');
            }

            await registerBatchHistory({
                tenantId,
                userId,
                documentIds: Array.isArray(latest.documentIds) ? latest.documentIds as string[] : undefined,
                filters: (latest.filters as Record<string, unknown> | null) ?? undefined,
                eventType: 'download.batch.accessed',
                source: 'downloads.route',
                title: 'ZIP acessado para download',
                summary: `Pacote ${jobId} disponibilizado para download`,
                details: {
                    jobId,
                    sourceId: jobId,
                    correlationId: jobId,
                    downloadGranted: true,
                },
            });

            return sendSuccess(reply, {
                url,
                expiresInSeconds,
            });
        }
    });
};
