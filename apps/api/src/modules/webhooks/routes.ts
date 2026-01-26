import { FastifyPluginAsync } from 'fastify';
import { container } from 'tsyringe';
import { WebhookService } from './service';
import { getTenantId } from '../../plugins/auth';

const webhookService = container.resolve(WebhookService);

export const webhooksRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.addHook('onRequest', fastify.authenticate);

    fastify.get('/', async (request) => {
        const tenantId = getTenantId(request);
        return webhookService.list(tenantId);
    });

    fastify.post('/', async (request) => {
        const tenantId = getTenantId(request);
        const data = request.body as any;
        return webhookService.create(tenantId, data);
    });

    fastify.get('/:id', async (request) => {
        const tenantId = getTenantId(request);
        const { id } = request.params as { id: string };
        const webhook = await webhookService.get(id, tenantId);
        if (!webhook) throw { statusCode: 404, message: 'Webhook not found' };
        return webhook;
    });

    fastify.put('/:id', async (request) => {
        const tenantId = getTenantId(request);
        const { id } = request.params as { id: string };
        const data = request.body as any;
        return webhookService.update(id, tenantId, data);
    });

    fastify.delete('/:id', async (request) => {
        const tenantId = getTenantId(request);
        const { id } = request.params as { id: string };
        await webhookService.delete(id, tenantId);
        return { success: true };
    });

    fastify.post('/:id/test', async (request) => {
        const tenantId = getTenantId(request);
        const { id } = request.params as { id: string };
        return webhookService.test(id, tenantId);
    });

    fastify.get('/:id/logs', async (request) => {
        const tenantId = getTenantId(request);
        const { id } = request.params as { id: string };
        const { page, limit } = request.query as any;

        return webhookService.getLogs(id, tenantId, {
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 20
        });
    });

    fastify.post('/:id/regenerate-secret', async (request) => {
        const tenantId = getTenantId(request);
        const { id } = request.params as { id: string };
        const secret = await webhookService.regenerateSecret(id, tenantId);
        return { secret };
    });

    // Provide simplified list of available events for UI
    fastify.get('/events-metadata', async () => {
        return {
            events: [
                { id: 'document.created', label: 'Documento Criado/Importado' },
                { id: 'document.manifested', label: 'Documento Manifestado' },
                { id: 'document.cancelled', label: 'Documento Cancelado' },
                { id: 'document.cte_desacordo', label: 'Desacordo de CTe' },
                { id: 'document.tagged', label: 'Tag Adicionada' }
            ]
        };
    });
};
