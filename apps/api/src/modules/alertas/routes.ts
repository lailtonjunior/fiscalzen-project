import { FastifyPluginAsync } from 'fastify';
import { container } from 'tsyringe';
import { AlertasService } from './service';
import { getTenantId } from '../../plugins/auth';
import { zodToFastify, standardResponses } from '../../utils/schema-converter';
import { listAlertasQuerySchema, alertIdParamsSchema, type ListAlertasQuery } from './schemas';
import { sendSuccess } from '../../utils/response';

const alertasService = container.resolve(AlertasService);

export const alertsRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.addHook('onRequest', fastify.authenticate);

    // GET /api/v1/alertas - List alerts
    fastify.get<{
        Querystring: ListAlertasQuery;
    }>('/', {
        schema: {
            tags: ['Alertas'],
            summary: 'Listar alertas',
            description: 'Lista alertas do sistema com filtros',
            querystring: zodToFastify(listAlertasQuerySchema),
            response: {
                200: {
                    description: 'Lista de alertas',
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
        const query = listAlertasQuerySchema.parse(request.query);

        const result = await alertasService.getAlertas(tenantId, query);
        return sendSuccess(reply, result.items, 200, {
            page: query.page,
            limit: query.limit,
            total: result.total,
            pages: Math.ceil(result.total / query.limit)
        });
    });

    // GET /api/v1/alertas/summary - Get alerts summary
    fastify.get('/summary', {
        schema: {
            tags: ['Alertas'],
            summary: 'Resumo de alertas',
            description: 'Retorna contagem de alertas não lidos por prioridade',
            response: {
                200: {
                    description: 'Resumo de alertas',
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        data: {
                            type: 'object',
                            properties: {
                                total: { type: 'integer' },
                                critica: { type: 'integer' },
                                alta: { type: 'integer' },
                                media: { type: 'integer' },
                                baixa: { type: 'integer' },
                            },
                        },
                    },
                },
                401: standardResponses[401],
            },
        },
    }, async (request, reply) => {
        const tenantId = getTenantId(request);
        const summary = await alertasService.getResumo(tenantId);
        return sendSuccess(reply, summary);
    });

    // PATCH /api/v1/alertas/:id/read - Mark as read
    fastify.patch('/:id/read', {
        schema: {
            tags: ['Alertas'],
            summary: 'Marcar como lido',
            description: 'Marca um alerta específico como lido',
            params: zodToFastify(alertIdParamsSchema),
            response: {
                200: standardResponses[200],
                401: standardResponses[401],
                404: standardResponses[404],
            },
        },
    }, async (request, reply) => {
        const tenantId = getTenantId(request);
        const { id } = alertIdParamsSchema.parse(request.params);

        await alertasService.marcarComoLido(id, tenantId);

        return sendSuccess(reply, { read: true });
    });

    // PATCH /api/v1/alertas/read-all - Mark all as read
    fastify.patch('/read-all', {
        schema: {
            tags: ['Alertas'],
            summary: 'Marcar todos como lidos',
            description: 'Marca todos os alertas do usuário como lidos',
            response: {
                200: standardResponses[200],
                401: standardResponses[401],
            },
        },
    }, async (request, reply) => {
        const tenantId = getTenantId(request);
        await alertasService.marcarTodosComoLidos(tenantId);
        return sendSuccess(reply, { readAll: true });
    });
};
