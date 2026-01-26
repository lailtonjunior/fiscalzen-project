import { FastifyPluginAsync } from 'fastify';
import { commentsService, CreateCommentDto } from './service';
import { getTenantId, getUserId } from '../../plugins/auth';
import { z } from 'zod';

const createCommentSchema = z.object({
    content: z.string().min(1),
    isInternal: z.boolean().optional(),
    parentId: z.string().uuid().optional(),
});

const updateCommentSchema = z.object({
    content: z.string().min(1),
});

export const commentsRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.addHook('onRequest', fastify.authenticate);

    fastify.get('/documents/:documentId/comments', async (request, reply) => {
        const tenantId = getTenantId(request);
        const { documentId } = request.params as { documentId: string };

        const result = await commentsService.list(documentId, tenantId);
        return result;
    });

    fastify.post('/documents/:documentId/comments', async (request, reply) => {
        const tenantId = getTenantId(request);
        const userId = getUserId(request);
        const { documentId } = request.params as { documentId: string };

        const body = createCommentSchema.parse(request.body);

        const comment = await commentsService.create(tenantId, userId, {
            documentId,
            ...body
        });

        return reply.status(201).send(comment);
    });

    fastify.put('/comments/:id', async (request, reply) => {
        const tenantId = getTenantId(request);
        const userId = getUserId(request);
        const { id } = request.params as { id: string };

        const body = updateCommentSchema.parse(request.body);

        const comment = await commentsService.update(id, tenantId, userId, body.content);
        return comment;
    });

    fastify.delete('/comments/:id', async (request, reply) => {
        const tenantId = getTenantId(request);
        const userId = getUserId(request);
        const { id } = request.params as { id: string };

        await commentsService.delete(id, tenantId, userId);

        return reply.status(204).send();
    });
};
