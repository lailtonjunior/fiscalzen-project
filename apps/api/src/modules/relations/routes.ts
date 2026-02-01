import { FastifyPluginAsync } from 'fastify';
import { container } from 'tsyringe';
import { RelationsService } from './service';
import { zodToFastify, standardResponses } from '../../utils/schema-converter';
import {
    documentIdParamsSchema,
    listRelationsQuerySchema,
    orphanNfesQuerySchema,
    chaveParamsSchema,
    type ListRelationsQuery,
    type OrphanNfesQuery
} from './schemas';

export const relationsRoutes: FastifyPluginAsync = async (fastify) => {
    const relationsService = container.resolve(RelationsService);

    // GET /documents/:id/relations - Obter documentos relacionados
    fastify.get<{
        Params: { id: string }; // simple param, usually string
        Querystring: ListRelationsQuery;
    }>('/:id/relations', {
        schema: {
            tags: ['Relações'],
            summary: 'Listar relações',
            description: 'Lista documentos relacionados ao documento informado (ex: NFe vinculada a CTe)',
            params: zodToFastify(documentIdParamsSchema),
            querystring: zodToFastify(listRelationsQuerySchema),
            response: {
                200: {
                    description: 'Lista de relações',
                    type: 'array',
                    items: { type: 'object' }
                },
                400: standardResponses[400],
                401: standardResponses[401],
            }
        },
        handler: async (request, reply) => {
            const { id } = documentIdParamsSchema.parse(request.params);
            const { tenantId } = (request as any).user;
            const { direction } = listRelationsQuerySchema.parse(request.query);

            const relations = await relationsService.getRelatedDocuments(id, tenantId, direction);

            return reply.send(relations);
        }
    });

    // GET /documents/orphan-nfes - NFe sem CTe vinculado
    fastify.get<{
        Querystring: OrphanNfesQuery;
    }>('/orphan-nfes', {
        schema: {
            tags: ['Relações'],
            summary: 'Listar NFEs órfãs',
            description: 'Lista NFes que não possuem um CTe vinculado',
            querystring: zodToFastify(orphanNfesQuerySchema),
            response: {
                200: {
                    description: 'Lista de NFes órfãs',
                    type: 'object',
                    properties: {
                        count: { type: 'integer' },
                        documents: { type: 'array', items: { type: 'object' } }
                    }
                },
                400: standardResponses[400],
                401: standardResponses[401],
            }
        },
        handler: async (request, reply) => {
            const { tenantId } = (request as any).user;
            const { startDate, endDate } = orphanNfesQuerySchema.parse(request.query);

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
            tags: ['Relações'],
            summary: 'Buscar NFes do CTe',
            description: 'Busca as NFes vinculadas a um CTe pela chave',
            params: zodToFastify(chaveParamsSchema),
            response: {
                200: {
                    description: 'Lista de NFes',
                    type: 'array',
                    items: { type: 'object' }
                },
                401: standardResponses[401],
            }
        },
        handler: async (request, reply) => {
            const { chave } = chaveParamsSchema.parse(request.params);
            const { tenantId } = (request as any).user;

            const nfes = await relationsService.getNFesFromCTe(chave, tenantId);

            return reply.send(nfes);
        }
    });

    // GET /documents/nfe/:chave/ctes - CTes de uma NFe
    fastify.get('/nfe/:chave/ctes', {
        schema: {
            tags: ['Relações'],
            summary: 'Buscar CTes da NFe',
            description: 'Busca os CTes que referenciam uma NFe pela chave',
            params: zodToFastify(chaveParamsSchema),
            response: {
                200: {
                    description: 'Lista de CTes',
                    type: 'array',
                    items: { type: 'object' }
                },
                401: standardResponses[401],
            }
        },
        handler: async (request, reply) => {
            const { chave } = chaveParamsSchema.parse(request.params);
            const { tenantId } = (request as any).user;

            const ctes = await relationsService.getCTesForNFe(chave, tenantId);

            return reply.send(ctes);
        }
    });
};
