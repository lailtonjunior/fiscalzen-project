import { FastifyPluginAsync } from 'fastify';
import { container } from 'tsyringe';
import { AlertasService } from './service';
import { getTenantId } from '../../plugins/auth';

const alertasService = container.resolve(AlertasService);

export const alertsRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.addHook('onRequest', fastify.authenticate);

    fastify.get('/', async (request) => {
        const tenantId = getTenantId(request);
        const { page, limit, lido, prioridade } = request.query as any;

        // Simple basic parsing
        const filters = {
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 20,
            lido: lido === 'true' ? true : lido === 'false' ? false : undefined,
            prioridade
        };

        const result = await alertasService.getAlertas(tenantId, filters);
        return result;
    });

    fastify.get('/summary', async (request) => {
        const tenantId = getTenantId(request);
        const summary = await alertasService.getResumo(tenantId);
        return summary;
    });

    fastify.patch('/:id/read', async (request) => {
        const tenantId = getTenantId(request);
        const { id } = request.params as { id: string };

        await alertasService.marcarComoLido(id, tenantId);

        return { success: true };
    });

    fastify.patch('/read-all', async (request) => {
        const tenantId = getTenantId(request);
        await alertasService.marcarTodosComoLidos(tenantId);
        return { success: true };
    });
};
