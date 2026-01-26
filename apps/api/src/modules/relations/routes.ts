import { FastifyPluginAsync } from 'fastify';
import { container } from 'tsyringe';
import { RelationsService } from './service';

export const relationsRoutes: FastifyPluginAsync = async (fastify) => {
    const relationsService = container.resolve(RelationsService);

    // GET /documents/:id/relations - Obter documentos relacionados
    fastify.get('/:id/relations', {
        schema: {
            tags: ['Relations'],
            params: {
                type: 'object',
                properties: { id: { type: 'string', format: 'uuid' } },
                required: ['id']
            },
            querystring: {
                type: 'object',
                properties: {
                    direction: { type: 'string', enum: ['source', 'target', 'both'], default: 'both' }
                }
            },
            security: [{ bearerAuth: [] }]
        },
        handler: async (request, reply) => {
            const { id } = request.params as { id: string };
            const { tenantId } = (request as any).user;
            const { direction } = request.query as any;

            const relations = await relationsService.getRelatedDocuments(id, tenantId, direction);

            return reply.send(relations);
        }
    });

    // GET /documents/orphan-nfes - NFe sem CTe vinculado
    fastify.get('/orphan-nfes', {
        schema: {
            tags: ['Relations'],
            querystring: {
                type: 'object',
                properties: {
                    startDate: { type: 'string', format: 'date' },
                    endDate: { type: 'string', format: 'date' }
                }
            },
            security: [{ bearerAuth: [] }]
        },
        handler: async (request, reply) => {
            const { tenantId } = (request as any).user;
            const { startDate, endDate } = request.query as any;

            const orphans = await relationsService.findOrphanNFes(tenantId, {
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined
            });

            return reply.send({
                count: orphans.length,
                documents: orphans
            });
        }
    });

    // GET /documents/cte/:chave/nfes - NFes de um CTe
    fastify.get('/cte/:chave/nfes', {
        schema: {
            tags: ['Relations'],
            params: {
                type: 'object',
                properties: { chave: { type: 'string' } },
                required: ['chave']
            },
            security: [{ bearerAuth: [] }]
        },
        handler: async (request, reply) => {
            const { chave } = request.params as { chave: string };
            const { tenantId } = (request as any).user;

            const nfes = await relationsService.getNFesFromCTe(chave, tenantId);

            return reply.send(nfes);
        }
    });

    // GET /documents/nfe/:chave/ctes - CTes de uma NFe
    fastify.get('/nfe/:chave/ctes', {
        schema: {
            tags: ['Relations'],
            params: {
                type: 'object',
                properties: { chave: { type: 'string' } },
                required: ['chave']
            },
            security: [{ bearerAuth: [] }]
        },
        handler: async (request, reply) => {
            const { chave } = request.params as { chave: string };
            const { tenantId } = (request as any).user;

            const ctes = await relationsService.getCTesForNFe(chave, tenantId);

            return reply.send(ctes);
        }
    });
};
