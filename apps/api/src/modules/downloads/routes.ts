import { FastifyPluginAsync } from 'fastify';
import { Queue } from 'bullmq';
import { redis } from '../../config/redis';
import { documentsService } from '../documents/service';
import { zodToFastify, standardResponses } from '../../utils/schema-converter';
import { batchDownloadSchema, downloadJobParamsSchema, type BatchDownloadInput } from './schemas';

// Reusing the queue name from worker
const BATCH_QUEUE_NAME = 'batch-download';
const batchDownloadQueue = new Queue(BATCH_QUEUE_NAME, { connection: redis });

export const downloadsRoutes: FastifyPluginAsync = async (fastify) => {
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
                        jobId: { type: 'string' },
                        status: { type: 'string' },
                        estimatedDocuments: { type: 'integer' },
                        estimatedTimeSeconds: { type: 'integer' },
                    },
                },
                400: standardResponses[400],
                401: standardResponses[401],
            }
        },
        handler: async (request, reply) => {
            const { tenantId, id: userId } = (request as any).user;
            const body = batchDownloadSchema.parse(request.body);
            const { documentIds, filters, format, includeMetadata, organizacao } = body;

            // Validar que tem IDs ou filtros
            if ((!documentIds || documentIds.length === 0) && !filters) {
                return reply.status(400).send({
                    error: 'Informe documentIds ou filters'
                });
            }

            // Estimar quantidade se usar filtros
            let estimatedCount = documentIds?.length || 0;
            if (filters) {
                // Optimization: documentsService.list returns { items, total }
                // We assume countByFilter or list handles minimal overhead for count
                const { total } = await documentsService.list(tenantId, { ...filters, page: 1, limit: 1, sortBy: 'createdAt', sortOrder: 'desc' });
                estimatedCount = total;

                if (estimatedCount > 5000) {
                    return reply.status(400).send({
                        error: `Muitos documentos (${estimatedCount}). Maximo: 5000. Refine os filtros.`
                    });
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

            return reply.status(202).send({
                jobId: job.id,
                status: 'queued',
                estimatedDocuments: estimatedCount,
                estimatedTimeSeconds: Math.ceil(estimatedCount * 0.5)
            });
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
                        status: { type: 'string', enum: ['queued', 'active', 'completed', 'failed'] },
                        progress: { type: 'number' },
                        result: { type: 'object', nullable: true }, // URL de download, etc.
                        error: { type: 'string', nullable: true },
                    },
                },
                401: standardResponses[401],
                404: standardResponses[404],
            }
        },
        handler: async (request, reply) => {
            const { jobId } = downloadJobParamsSchema.parse(request.params);
            const { tenantId } = (request as any).user;

            const job = await batchDownloadQueue.getJob(jobId);

            if (!job || job.data.tenantId !== tenantId) {
                return reply.status(404).send({ error: 'Download nao encontrado' });
            }

            const state = await job.getState();
            const progress = typeof job.progress === 'number' ? job.progress : 0;

            if (state === 'completed') {
                return reply.send({
                    status: 'completed',
                    progress: 100,
                    result: job.returnvalue
                });
            }

            if (state === 'failed') {
                return reply.send({
                    status: 'failed',
                    error: job.failedReason
                });
            }

            return reply.send({
                status: state,
                progress
            });
        }
    });
};
