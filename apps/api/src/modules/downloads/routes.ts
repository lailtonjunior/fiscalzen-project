import { FastifyPluginAsync } from 'fastify';
import { Queue } from 'bullmq';
import { redis } from '../../config/redis';
import { documentsService } from '../documents/service';

// Reusing the queue name from worker
const BATCH_QUEUE_NAME = 'batch-download';
const batchDownloadQueue = new Queue(BATCH_QUEUE_NAME, { connection: redis });

export const downloadsRoutes: FastifyPluginAsync = async (fastify) => {
    // POST /downloads/batch - Iniciar download em lote
    fastify.post('/batch', {
        schema: {
            tags: ['Downloads'],
            body: {
                type: 'object',
                properties: {
                    documentIds: { type: 'array', items: { type: 'string' }, maxItems: 5000 },
                    filters: { type: 'object', additionalProperties: true },
                    format: { type: 'string', enum: ['xml', 'pdf', 'both'], default: 'both' },
                    includeMetadata: { type: 'boolean', default: true },
                    organizacao: {
                        type: 'string',
                        enum: ['flat', 'by-date', 'by-type', 'by-company'],
                        default: 'by-date'
                    }
                }
            },
            security: [{ bearerAuth: [] }]
        },
        handler: async (request, reply) => {
            const { tenantId, id: userId } = (request as any).user;
            const { documentIds, filters, format, includeMetadata, organizacao } = request.body as any;

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
                const { total } = await documentsService.list(tenantId, { ...filters, page: 1, limit: 1 });
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

    // GET /downloads/batch/:jobId - Status do download
    fastify.get('/batch/:jobId', {
        schema: {
            tags: ['Downloads'],
            params: {
                type: 'object',
                properties: { jobId: { type: 'string' } },
                required: ['jobId']
            },
            security: [{ bearerAuth: [] }]
        },
        handler: async (request, reply) => {
            const { jobId } = request.params as { jobId: string };
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
