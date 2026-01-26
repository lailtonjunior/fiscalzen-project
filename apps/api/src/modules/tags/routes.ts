import { FastifyPluginAsync } from 'fastify';
import { tagsService, CreateTagDto } from './service';
import { getTenantId, getUserId } from '../../plugins/auth';
import { z } from 'zod';

const createTagSchema = z.object({
    name: z.string().min(1).max(50),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    description: z.string().max(255).optional(),
    icon: z.string().optional(),
});

const addTagsSchema = z.object({
    tagIds: z.array(z.string().uuid()),
});

export const tagsRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.addHook('onRequest', fastify.authenticate);

    fastify.get('/', async (request, reply) => {
        const tenantId = getTenantId(request);
        const result = await tagsService.list(tenantId);
        return result;
    });

    fastify.post('/', async (request, reply) => {
        const tenantId = getTenantId(request);
        const userId = getUserId(request);

        const body = createTagSchema.parse(request.body);
        const tag = await tagsService.create(tenantId, userId, body);

        return reply.status(201).send(tag);
    });

    fastify.put('/:id', async (request, reply) => {
        const tenantId = getTenantId(request);
        const { id } = request.params as { id: string };

        const body = createTagSchema.partial().parse(request.body);
        const tag = await tagsService.update(id, tenantId, body);

        return tag;
    });

    fastify.delete('/:id', async (request, reply) => {
        const tenantId = getTenantId(request);
        const { id } = request.params as { id: string };

        await tagsService.delete(id, tenantId);

        return reply.status(204).send();
    });

    // Document Tags
    fastify.post('/documents/:documentId/tags', async (request, reply) => {
        const tenantId = getTenantId(request);
        const userId = getUserId(request);
        const { documentId } = request.params as { documentId: string };

        const body = addTagsSchema.parse(request.body);

        await tagsService.addTagsToDocument(documentId, body.tagIds, tenantId, userId);

        return { success: true };
    });

    fastify.delete('/documents/:documentId/tags/:tagId', async (request, reply) => {
        const tenantId = getTenantId(request);
        const { documentId, tagId } = request.params as { documentId: string; tagId: string };

        await tagsService.removeTagFromDocument(documentId, tagId, tenantId);

        return reply.status(204).send();
    });

    fastify.get('/slug/:slug/documents', async (request, reply) => {
        const tenantId = getTenantId(request);
        const { slug } = request.params as { slug: string };
        const { page, limit } = request.query as { page?: string, limit?: string };

        const p = parseInt(page || '1');
        const l = parseInt(limit || '20');

        const result = await tagsService.findDocumentsByTag(tenantId, slug, { page: p, limit: l });

        return result;
    });
};
