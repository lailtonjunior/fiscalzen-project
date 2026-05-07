import { FastifyPluginAsync } from 'fastify';
import { tagsService } from './service';
import { getTenantId, getUserId } from '../../plugins/auth';
import { commonSchemas, zodToFastify, standardResponses } from '../../utils/schema-converter';
import { sendNoContent, sendSuccess } from '../../utils/response';
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
    const tagIdParamsJsonSchema = {
        type: 'object',
        properties: {
            id: { type: 'string', format: 'uuid' },
        },
        required: ['id'],
    } as const;
    const documentIdParamsJsonSchema = {
        type: 'object',
        properties: {
            documentId: { type: 'string', format: 'uuid' },
        },
        required: ['documentId'],
    } as const;
    const documentTagParamsJsonSchema = {
        type: 'object',
        properties: {
            documentId: { type: 'string', format: 'uuid' },
            tagId: { type: 'string', format: 'uuid' },
        },
        required: ['documentId', 'tagId'],
    } as const;

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

        return sendSuccess(reply, tag, 201);
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
            params: tagIdParamsJsonSchema,
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
                400: commonSchemas.errorResponse,
                401: commonSchemas.errorResponse,
                404: commonSchemas.errorResponse,
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
            params: tagIdParamsJsonSchema,
            response: {
                204: {
                    description: 'Tag excluída',
                    type: 'null',
                },
                401: commonSchemas.errorResponse,
                404: commonSchemas.errorResponse,
            },
        },
    }, async (request, reply) => {
        const tenantId = getTenantId(request);
        const { id } = tagIdParamsSchema.parse(request.params);

        await tagsService.delete(id, tenantId);

        return sendNoContent(reply);
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
            params: documentIdParamsJsonSchema,
            body: zodToFastify(addTagsToDocumentSchema),
            response: {
                200: {
                    description: 'Tags adicionadas com sucesso',
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        data: {
                            type: 'object',
                            properties: {
                                added: { type: 'boolean' },
                            },
                            required: ['added'],
                        },
                    },
                    required: ['success', 'data'],
                },
                400: commonSchemas.errorResponse,
                401: commonSchemas.errorResponse,
                404: commonSchemas.errorResponse,
            },
        },
    }, async (request, reply) => {
        const tenantId = getTenantId(request);
        const userId = getUserId(request);
        const { documentId } = documentTagsParamsSchema.parse(request.params);

        const body = addTagsToDocumentSchema.parse(request.body);

        await tagsService.addTagsToDocument(documentId, body.tagIds, tenantId, userId);

        return sendSuccess(reply, { added: true });
    });

    // DELETE /api/v1/tags/documents/:documentId/tags/:tagId - Remove tag from document
    fastify.delete<{
        Params: { documentId: string; tagId: string };
    }>('/documents/:documentId/tags/:tagId', {
        schema: {
            tags: ['Tags'],
            summary: 'Remover tag do documento',
            description: 'Desassocia uma tag de um documento fiscal',
            params: documentTagParamsJsonSchema,
            response: {
                204: {
                    description: 'Tag removida do documento',
                    type: 'null',
                },
                401: commonSchemas.errorResponse,
                404: commonSchemas.errorResponse,
            },
        },
    }, async (request, reply) => {
        const tenantId = getTenantId(request);
        const { documentId, tagId } = documentTagParamsSchema.parse(request.params);

        await tagsService.removeTagFromDocument(documentId, tagId, tenantId);

        return sendNoContent(reply);
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
            // querystring: zodToFastify(listDocumentsByTagQuerySchema),
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
