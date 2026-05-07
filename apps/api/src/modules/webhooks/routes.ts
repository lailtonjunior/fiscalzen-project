import { FastifyPluginAsync } from 'fastify';
import { container } from 'tsyringe';
import { WebhookService } from './service';
import { getTenantId } from '../../plugins/auth';
import { standardResponses } from '../../utils/schema-converter';
import { sendSuccess } from '../../utils/response';
import { NotFoundError } from '../../utils/errors';

const webhookService = container.resolve(WebhookService);

export const webhooksRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.addHook('onRequest', fastify.authenticate);

    // GET /api/v1/webhooks - List webhooks
    fastify.get('/', {
        schema: {
            tags: ['Webhooks'],
            summary: 'Listar webhooks',
            description: 'Lista todos os webhooks configurados',
            response: {
                200: {
                    description: 'Lista de webhooks',
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
        const webhooks = await webhookService.list(tenantId);
        return sendSuccess(reply, webhooks);
    });

    // POST /api/v1/webhooks - Create webhook
    fastify.post('/', {
        schema: {
            tags: ['Webhooks'],
            summary: 'Criar webhook',
            description: 'Configura um novo webhook para receber notificações',
            body: {
                type: 'object',
                required: ['name', 'url', 'events'],
                properties: {
                    name: { type: 'string', minLength: 1, maxLength: 100 },
                    url: { type: 'string', format: 'uri' },
                    events: { type: 'array', items: { type: 'string' } },
                    active: { type: 'boolean', default: true },
                },
            },
            response: {
                201: standardResponses[201],
                400: standardResponses[400],
                401: standardResponses[401],
            },
        },
    }, async (request, reply) => {
        const tenantId = getTenantId(request);
        const data = request.body as any;
        const webhook = await webhookService.create(tenantId, data);
        return sendSuccess(reply, webhook, 201);
    });

    // GET /api/v1/webhooks/:id - Get webhook
    fastify.get('/:id', {
        schema: {
            tags: ['Webhooks'],
            summary: 'Obter webhook',
            description: 'Retorna detalhes de um webhook específico',
            params: {
                type: 'object',
                properties: { id: { type: 'string', format: 'uuid' } },
            },
            response: {
                200: standardResponses[200],
                401: standardResponses[401],
                404: standardResponses[404],
            },
        },
    }, async (request, reply) => {
        const tenantId = getTenantId(request);
        const { id } = request.params as { id: string };
        const webhook = await webhookService.get(id, tenantId);
        if (!webhook) {
            throw new NotFoundError('Webhook');
        }
        return sendSuccess(reply, webhook);
    });

    // PUT /api/v1/webhooks/:id - Update webhook
    fastify.put('/:id', {
        schema: {
            tags: ['Webhooks'],
            summary: 'Atualizar webhook',
            description: 'Atualiza configuração de um webhook',
            params: {
                type: 'object',
                properties: { id: { type: 'string', format: 'uuid' } },
            },
            response: {
                200: standardResponses[200],
                400: standardResponses[400],
                401: standardResponses[401],
                404: standardResponses[404],
            },
        },
    }, async (request, reply) => {
        const tenantId = getTenantId(request);
        const { id } = request.params as { id: string };
        const data = request.body as any;
        const webhook = await webhookService.update(id, tenantId, data);
        return sendSuccess(reply, webhook);
    });

    // DELETE /api/v1/webhooks/:id - Delete webhook
    fastify.delete('/:id', {
        schema: {
            tags: ['Webhooks'],
            summary: 'Excluir webhook',
            description: 'Remove um webhook',
            params: {
                type: 'object',
                properties: { id: { type: 'string', format: 'uuid' } },
            },
            response: {
                200: standardResponses[200],
                401: standardResponses[401],
                404: standardResponses[404],
            },
        },
    }, async (request, reply) => {
        const tenantId = getTenantId(request);
        const { id } = request.params as { id: string };
        await webhookService.delete(id, tenantId);
        return sendSuccess(reply, { deleted: true });
    });

    // POST /api/v1/webhooks/:id/test - Test webhook
    fastify.post('/:id/test', {
        schema: {
            tags: ['Webhooks'],
            summary: 'Testar webhook',
            description: 'Envia um payload de teste para o webhook',
            params: {
                type: 'object',
                properties: { id: { type: 'string', format: 'uuid' } },
            },
            response: {
                200: standardResponses[200],
                401: standardResponses[401],
                404: standardResponses[404],
            },
        },
    }, async (request, reply) => {
        const tenantId = getTenantId(request);
        const { id } = request.params as { id: string };
        const result = await webhookService.test(id, tenantId);
        return sendSuccess(reply, result);
    });

    // GET /api/v1/webhooks/:id/logs - Get webhook logs
    fastify.get('/:id/logs', {
        schema: {
            tags: ['Webhooks'],
            summary: 'Logs do webhook',
            description: 'Lista logs de execução do webhook',
            params: {
                type: 'object',
                properties: { id: { type: 'string', format: 'uuid' } },
            },
            querystring: {
                type: 'object',
                properties: {
                    page: { type: 'integer', default: 1 },
                    limit: { type: 'integer', default: 20 },
                },
            },
            response: {
                200: standardResponses[200],
                401: standardResponses[401],
                404: standardResponses[404],
            },
        },
    }, async (request, reply) => {
        const tenantId = getTenantId(request);
        const { id } = request.params as { id: string };
        const { page, limit } = request.query as any;

        const logs = await webhookService.getLogs(id, tenantId, {
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 20
        });
        return sendSuccess(reply, logs);
    });

    // POST /api/v1/webhooks/:id/regenerate-secret - Regenerate secret
    fastify.post('/:id/regenerate-secret', {
        schema: {
            tags: ['Webhooks'],
            summary: 'Regenerar secret',
            description: 'Gera um novo secret para assinatura HMAC do webhook',
            params: {
                type: 'object',
                properties: { id: { type: 'string', format: 'uuid' } },
            },
            response: {
                200: {
                    description: 'Novo secret gerado',
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        data: {
                            type: 'object',
                            properties: {
                                secret: { type: 'string' },
                            },
                        },
                    },
                },
                401: standardResponses[401],
                404: standardResponses[404],
            },
        },
    }, async (request, reply) => {
        const tenantId = getTenantId(request);
        const { id } = request.params as { id: string };
        const secret = await webhookService.regenerateSecret(id, tenantId);
        return sendSuccess(reply, { secret });
    });

    // GET /api/v1/webhooks/events-metadata - Available events
    fastify.get('/events-metadata', {
        schema: {
            tags: ['Webhooks'],
            summary: 'Eventos disponíveis',
            description: 'Lista eventos disponíveis para webhooks',
            response: {
                200: {
                    description: 'Lista de eventos',
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        data: {
                            type: 'object',
                            properties: {
                                events: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            id: { type: 'string' },
                                            label: { type: 'string' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    }, async (_request, reply) => {
        return sendSuccess(reply, {
            events: [
                { id: 'document.created', label: 'Documento Criado/Importado' },
                { id: 'document.manifested', label: 'Documento Manifestado' },
                { id: 'document.cancelled', label: 'Documento Cancelado' },
                { id: 'document.cte_desacordo', label: 'Desacordo de CTe' },
                { id: 'document.tagged', label: 'Tag Adicionada' }
            ]
        });
    });
};
