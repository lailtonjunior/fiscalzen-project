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
  }>('/', async (request, reply) => {
    const tenantId = getTenantId(request);
    const query = listAgentsQuerySchema.parse(request.query);

    const { items, total } = await agentsService.list(tenantId, query);
    const { data, pagination } = paginate(items, total, query.page, query.limit);

    return sendSuccess(reply, data, 200, pagination);
  });

  // POST /api/v1/agents/register - Register new agent
  fastify.post<{
    Body: RegisterAgentInput;
  }>('/register', async (request, reply) => {
    const tenantId = getTenantId(request);
    const data = registerAgentSchema.parse(request.body);

    const agent = await agentsService.register(tenantId, data);

    return sendCreated(reply, agent);
  });

  // GET /api/v1/agents/:id - Get agent details
  fastify.get<{
    Params: AgentIdParams;
  }>('/:id', async (request, reply) => {
    const tenantId = getTenantId(request);
    const { id } = agentIdSchema.parse(request.params);

    const agent = await agentsService.getById(tenantId, id);

    return sendSuccess(reply, agent);
  });

  // DELETE /api/v1/agents/:id - Remove agent
  fastify.delete<{
    Params: AgentIdParams;
  }>('/:id', async (request, reply) => {
    const tenantId = getTenantId(request);
    const { id } = agentIdSchema.parse(request.params);

    await agentsService.delete(tenantId, id);

    return sendNoContent(reply);
  });

  // POST /api/v1/agents/:id/heartbeat - Agent heartbeat (uses API key auth)
  fastify.post<{
    Params: AgentIdParams;
    Body: AgentHeartbeatInput;
  }>('/:id/heartbeat', async (request, reply) => {
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
