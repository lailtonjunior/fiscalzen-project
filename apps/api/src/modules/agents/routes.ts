import type { FastifyInstance } from 'fastify';
import { agentsService } from './service';
import {
  registerAgentSchema,
  agentIdSchema,
  listAgentsQuerySchema,
  agentHeartbeatSchema,
  type RegisterAgentInput,
  type AgentIdParams,
  type ListAgentsQuery,
  type AgentHeartbeatInput,
} from './schemas';
import { getTenantId } from '../../plugins/auth';
import { sendSuccess, sendCreated, sendNoContent, paginate } from '../../utils/response';
import { UnauthorizedError } from '../../utils/errors';
import { zodToFastify, standardResponses } from '../../utils/schema-converter';

export async function agentsRoutes(fastify: FastifyInstance) {
  // All routes except heartbeat require authentication
  fastify.addHook('preHandler', async (request, reply) => {
    // Skip auth for heartbeat endpoint (uses API key)
    if (request.url.includes('/heartbeat')) {
      return;
    }
    await fastify.authenticate(request, reply);
  });

  // GET /api/v1/agents - List agents
  fastify.get<{
    Querystring: ListAgentsQuery;
  }>('/', {
    schema: {
      tags: ['Agentes'],
      summary: 'Listar agentes',
      description: 'Lista agentes registrados no tenant',
      querystring: zodToFastify(listAgentsQuerySchema),
      response: {
        200: {
          description: 'Lista de agentes',
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
    const query = listAgentsQuerySchema.parse(request.query);

    const { items, total } = await agentsService.list(tenantId, query);
    const { data, pagination } = paginate(items, total, query.page, query.limit);

    return sendSuccess(reply, data, 200, pagination);
  });

  // POST /api/v1/agents/register - Register new agent
  fastify.post<{
    Body: RegisterAgentInput;
  }>('/register', {
    schema: {
      tags: ['Agentes'],
      summary: 'Registrar agente',
      description: 'Registra um novo agente local para processamento',
      body: zodToFastify(registerAgentSchema),
      response: {
        201: {
          description: 'Agente registrado',
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
    const data = registerAgentSchema.parse(request.body);

    const agent = await agentsService.register(tenantId, data);

    return sendCreated(reply, agent);
  });

  // GET /api/v1/agents/:id - Get agent details
  fastify.get<{
    Params: AgentIdParams;
  }>('/:id', {
    schema: {
      tags: ['Agentes'],
      summary: 'Detalhes do agente',
      description: 'Retorna informações de um agente específico',
      params: zodToFastify(agentIdSchema),
      response: {
        200: {
          description: 'Detalhes do agente',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
          },
        },
        401: standardResponses[401],
        404: standardResponses[404],
      },
    },
  }, async (request, reply) => {
    const tenantId = getTenantId(request);
    const { id } = agentIdSchema.parse(request.params);

    const agent = await agentsService.getById(tenantId, id);

    return sendSuccess(reply, agent);
  });

  // DELETE /api/v1/agents/:id - Remove agent
  fastify.delete<{
    Params: AgentIdParams;
  }>('/:id', {
    schema: {
      tags: ['Agentes'],
      summary: 'Remover agente',
      description: 'Remove o registro de um agente',
      params: zodToFastify(agentIdSchema),
      response: {
        204: standardResponses[204],
        401: standardResponses[401],
        404: standardResponses[404],
      },
    },
  }, async (request, reply) => {
    const tenantId = getTenantId(request);
    const { id } = agentIdSchema.parse(request.params);

    await agentsService.delete(tenantId, id);

    return sendNoContent(reply);
  });

  // POST /api/v1/agents/:id/heartbeat - Agent heartbeat (uses API key auth)
  fastify.post<{
    Params: AgentIdParams;
    Body: AgentHeartbeatInput;
  }>('/:id/heartbeat', {
    schema: {
      tags: ['Agentes'],
      summary: 'Heartbeat do agente',
      description: 'Endpoint para agentes enviarem heartbeat e status',
      params: zodToFastify(agentIdSchema),
      body: zodToFastify(agentHeartbeatSchema),
      security: [{ apiKey: [] }], // Customize scheme if needed, usually defined in swagger.ts
      response: {
        200: {
          description: 'Status atualizado',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
          },
        },
        401: standardResponses[401],
        404: standardResponses[404],
      },
    },
  }, async (request, reply) => {
    const { id } = agentIdSchema.parse(request.params);

    // Validate API key from header
    const apiKey = request.headers['x-agent-api-key'] as string;

    if (!apiKey) {
      throw new UnauthorizedError('API key do agente nao fornecida');
    }

    const validation = await agentsService.validateApiKey(apiKey);

    if (!validation || validation.agentId !== id) {
      throw new UnauthorizedError('API key invalida');
    }

    const data = agentHeartbeatSchema.parse(request.body);
    const result = await agentsService.heartbeat(id, data);

    return sendSuccess(reply, result);
  });
}
