import { FastifyPluginAsync } from 'fastify';
import { tagsService } from './service';
import { getTenantId, getUserId } from '../../plugins/auth';
import { zodToFastify, standardResponses } from '../../utils/schema-converter';
import { sendSuccess } from '../../utils/response';
import {
    createTagSchema,
    updateTagSchema,
    addTagsToDocumentSchema,
    listDocumentsByTagQuerySchema,
    tagIdParamsSchema,
    documentTagParamsSchema,
    documentTagsParamsSchema,
    tagSlugParamsSchema,
    type CreateTagInput,
    type UpdateTagInput,
    type AddTagsInput,
    type ListDocumentsByTagQuery
} from './schemas';

export const tagsRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.addHook('onRequest', fastify.authenticate);

    // GET /api/v1/tags - List tags
    fastify.get('/', {
        schema: {
            tags: ['Tags'],
            summary: 'Listar tags',
            description: 'Lista todas as tags disponíveis para o tenant',
            response: {
                200: {
                    description: 'Lista de tags',
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        data: { type: 'array', items: { type: 'object' } },
                    },
                },
                401: standardResponses[401],
            },
        },
    }, async (request, reply) => {
        const tenantId = getTenantId(request);
        const result = await tagsService.list(tenantId);
        return sendSuccess(reply, result);
    });

    // POST /api/v1/tags - Create tag
    fastify.post<{
        Body: CreateTagInput;
    }>('/', {
        schema: {
            tags: ['Tags'],
            summary: 'Criar tag',
            description: 'Cria uma nova tag para classificação de documentos',
            body: zodToFastify(createTagSchema),
            response: {
                201: {
                    description: 'Tag criada',
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        data: { type: 'object' },
                    },
                },
                400: standardResponses[400],
                401: standardResponses[401],
            },
        },
    }, async (request, reply) => {
        const tenantId = getTenantId(request);
        const userId = getUserId(request);

        const body = createTagSchema.parse(request.body);
        const tag = await tagsService.create(tenantId, userId, body);

        return reply.status(201).send({ success: true, data: tag });
    });

    // PUT /api/v1/tags/:id - Update tag
    fastify.put<{
        Params: { id: string };
        Body: UpdateTagInput;
    }>('/:id', {
        schema: {
            tags: ['Tags'],
            summary: 'Atualizar tag',
            description: 'Atualiza propriedades de uma tag existente',
            params: zodToFastify(tagIdParamsSchema),
            body: zodToFastify(updateTagSchema),
            response: {
                200: {
                    description: 'Tag atualizada',
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        data: { type: 'object' },
                    },
                },
                400: standardResponses[400],
                401: standardResponses[401],
                404: standardResponses[404],
            },
        },
    }, async (request, reply) => {
        const tenantId = getTenantId(request);
        const { id } = tagIdParamsSchema.parse(request.params);

        const body = updateTagSchema.parse(request.body);
        const tag = await tagsService.update(id, tenantId, body);

        return sendSuccess(reply, tag);
    });

    // DELETE /api/v1/tags/:id - Delete tag
    fastify.delete<{
        Params: { id: string };
    }>('/:id', {
        schema: {
            tags: ['Tags'],
            summary: 'Excluir tag',
            description: 'Remove uma tag e sua associação com documentos',
            params: zodToFastify(tagIdParamsSchema),
            response: {
                204: { description: 'Tag excluída' },
                401: standardResponses[401],
                404: standardResponses[404],
            },
        },
    }, async (request, reply) => {
        const tenantId = getTenantId(request);
        const { id } = tagIdParamsSchema.parse(request.params);

        await tagsService.delete(id, tenantId);

        return reply.status(204).send();
    });

    // POST /api/v1/tags/documents/:documentId/tags - Add tags to document
    fastify.post<{
        Params: { documentId: string };
        Body: AddTagsInput;
    }>('/documents/:documentId/tags', {
        schema: {
            tags: ['Tags'],
            summary: 'Adicionar tags ao documento',
            description: 'Associa uma ou mais tags a um documento fiscal',
            params: zodToFastify(documentTagsParamsSchema),
            body: zodToFastify(addTagsToDocumentSchema),
            response: {
                200: { description: 'Tags adicionadas com sucesso' },
                400: standardResponses[400],
                401: standardResponses[401],
                404: standardResponses[404],
            },
        },
    }, async (request, reply) => {
        const tenantId = getTenantId(request);
        const userId = getUserId(request);
        const { documentId } = documentTagsParamsSchema.parse(request.params);

        const body = addTagsToDocumentSchema.parse(request.body);

        await tagsService.addTagsToDocument(documentId, body.tagIds, tenantId, userId);

        return { success: true };
    });

    // DELETE /api/v1/tags/documents/:documentId/tags/:tagId - Remove tag from document
    fastify.delete<{
        Params: { documentId: string; tagId: string };
    }>('/documents/:documentId/tags/:tagId', {
        schema: {
            tags: ['Tags'],
            summary: 'Remover tag do documento',
            description: 'Desassocia uma tag de um documento fiscal',
            params: zodToFastify(documentTagParamsSchema),
            response: {
                204: { description: 'Tag removida do documento' },
                401: standardResponses[401],
                404: standardResponses[404],
            },
        },
    }, async (request, reply) => {
        const tenantId = getTenantId(request);
        const { documentId, tagId } = documentTagParamsSchema.parse(request.params);

        await tagsService.removeTagFromDocument(documentId, tagId, tenantId);

        return reply.status(204).send();
    });

    // GET /api/v1/tags/slug/:slug/documents - Get docs by tag
    fastify.get<{
        Params: { slug: string };
        Querystring: ListDocumentsByTagQuery;
    }>('/slug/:slug/documents', {
        schema: {
            tags: ['Tags'],
            summary: 'Listar documentos por tag',
            description: 'Busca documentos que possuem uma tag específica (pelo slug)',
            params: zodToFastify(tagSlugParamsSchema),
            querystring: zodToFastify(listDocumentsByTagQuerySchema),
            response: {
                200: {
                    description: 'Lista de documentos',
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        data: { type: 'array', items: { type: 'object' } },
                        pagination: { type: 'object' },
                    },
                },
                401: standardResponses[401],
            },
        },
    }, async (request, reply) => {
        const tenantId = getTenantId(request);
        const { slug } = tagSlugParamsSchema.parse(request.params);
        const query = listDocumentsByTagQuerySchema.parse(request.query);

        const result = await tagsService.findDocumentsByTag(tenantId, slug, {
            page: query.page,
            limit: query.limit
        });

        return sendSuccess(reply, result.items, 200, {
            page: query.page,
            limit: query.limit,
            total: result.total,
            pages: Math.ceil(result.total / query.limit)
        });
    });
};
