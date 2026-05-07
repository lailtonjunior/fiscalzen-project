import { FastifyPluginAsync } from 'fastify';
import { commentsService } from './service';
import { getTenantId, getUserId } from '../../plugins/auth';
import { zodToFastify, standardResponses } from '../../utils/schema-converter';
import { sendCreated, sendNoContent, sendSuccess } from '../../utils/response';
import {
    createCommentSchema,
    updateCommentSchema,
    commentIdParamsSchema,
    documentCommentsParamsSchema,
    type CreateCommentInput,
    type UpdateCommentInput
} from './schemas';

export const commentsRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.addHook('onRequest', fastify.authenticate);

    // GET /api/v1/comments/documents/:documentId/comments - List comments
    // NOTE: Fastify routes without prefix usually relative to module prefix. 
    // Assuming module prefix is '/comments' or similar in app.ts, but user code had path '/documents/:documentId/comments'
    // This looks like it is mounted at root or '/api/v1', let's preserve the paths from original file.
    fastify.get<{
        Params: { documentId: string };
    }>('/documents/:documentId/comments', {
        schema: {
            tags: ['Comentários'],
            summary: 'Listar comentários',
            description: 'Lista comentários de um documento fiscal',
            params: zodToFastify(documentCommentsParamsSchema),
            response: {
                200: {
                    description: 'Lista de comentários',
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        data: { type: 'array', items: { type: 'object' } },
                    },
                },
                401: standardResponses[401],
                404: standardResponses[404],
            },
        },
    }, async (request, reply) => {
        const tenantId = getTenantId(request);
        const { documentId } = documentCommentsParamsSchema.parse(request.params);

        const result = await commentsService.list(documentId, tenantId);
        return sendSuccess(reply, result);
    });

    // POST /api/v1/comments/documents/:documentId/comments - Create comment
    fastify.post<{
        Params: { documentId: string };
        Body: CreateCommentInput;
    }>('/documents/:documentId/comments', {
        schema: {
            tags: ['Comentários'],
            summary: 'Adicionar comentário',
            description: 'Adiciona um novo comentário a um documento',
            params: zodToFastify(documentCommentsParamsSchema),
            body: zodToFastify(createCommentSchema),
            response: {
                201: {
                    description: 'Comentário criado',
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
        const { documentId } = documentCommentsParamsSchema.parse(request.params);

        const body = createCommentSchema.parse(request.body);

        const comment = await commentsService.create(tenantId, userId, {
            documentId,
            ...body
        });

        return sendCreated(reply, comment);
    });

    // PUT /api/v1/comments/comments/:id - Update comment
    // Original path: /comments/:id
    fastify.put<{
        Params: { id: string };
        Body: UpdateCommentInput;
    }>('/comments/:id', {
        schema: {
            tags: ['Comentários'],
            summary: 'Atualizar comentário',
            description: 'Edita o conteúdo de um comentário',
            params: zodToFastify(commentIdParamsSchema),
            body: zodToFastify(updateCommentSchema),
            response: {
                200: {
                    description: 'Comentário atualizado',
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
        const userId = getUserId(request);
        const { id } = commentIdParamsSchema.parse(request.params);

        const body = updateCommentSchema.parse(request.body);

        const comment = await commentsService.update(id, tenantId, userId, body.content);
        return sendSuccess(reply, comment);
    });

    // DELETE /api/v1/comments/comments/:id - Delete comment
    // Original path: /comments/:id
    fastify.delete<{
        Params: { id: string };
    }>('/comments/:id', {
        schema: {
            tags: ['Comentários'],
            summary: 'Excluir comentário',
            description: 'Remove um comentário',
            params: zodToFastify(commentIdParamsSchema),
            response: {
                204: standardResponses[204],
                401: standardResponses[401],
                404: standardResponses[404],
            },
        },
    }, async (request, reply) => {
        const tenantId = getTenantId(request);
        const userId = getUserId(request);
        const { id } = commentIdParamsSchema.parse(request.params);

        await commentsService.delete(id, tenantId, userId);

        return sendNoContent(reply);
    });
};
