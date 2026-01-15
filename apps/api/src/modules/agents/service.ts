import { eq, and, sql, desc } from 'drizzle-orm';
import { db } from '../../config/database';
// Importa 'agents' e renomeia para 'localAgents' para manter o padrão do arquivo
import { agents as localAgents, companies } from '@fiscalzen/database/schema';
import { NotFoundError, ConflictError } from '../../utils/errors';
import { cache } from '../../config/redis';
import type { RegisterAgentInput, ListAgentsQuery, AgentHeartbeatInput } from './schemas';

const AGENT_HEARTBEAT_TTL = 120; // 2 minutes
const AGENT_CACHE_PREFIX = 'agent:heartbeat:';

export const agentsService = {
  async list(tenantId: string, query: ListAgentsQuery) {
    const { page, limit, companyId, type, status } = query;
    const offset = (page - 1) * limit;

    const conditions = [eq(localAgents.tenantId, tenantId)];

    if (companyId) {
      conditions.push(eq(localAgents.companyId, companyId));
    }

    if (type) {
      conditions.push(eq(localAgents.type, type));
    }

    if (status) {
      conditions.push(eq(localAgents.status, status));
    }

    const [items, countResult] = await Promise.all([
      db
        .select()
        .from(localAgents)
        .where(and(...conditions))
        .orderBy(desc(localAgents.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(localAgents)
        .where(and(...conditions)),
    ]);

    // Enrich with online status from Redis
    const enrichedItems = await Promise.all(
      items.map(async (agent) => {
        const heartbeat = await cache.get<{ lastSeen: string }>(
          `${AGENT_CACHE_PREFIX}${agent.id}`
        );
        return {
          ...agent,
          isOnline: !!heartbeat,
          lastSeen: heartbeat?.lastSeen,
        };
      })
    );

    return {
      items: enrichedItems,
      total: Number(countResult[0]?.count ?? 0),
    };
  },

  async getById(tenantId: string, agentId: string) {
    const agent = await db.query.agents.findFirst({
      where: and(eq(localAgents.id, agentId), eq(localAgents.tenantId, tenantId)),
    });

    if (!agent) {
      throw new NotFoundError('Agente', agentId);
    }

    const heartbeat = await cache.get<{ lastSeen: string }>(
      `${AGENT_CACHE_PREFIX}${agent.id}`
    );

    return {
      ...agent,
      isOnline: !!heartbeat,
      lastSeen: heartbeat?.lastSeen,
    };
  },

  async register(tenantId: string, data: RegisterAgentInput) {
    // Verify company belongs to tenant
    const company = await db.query.companies.findFirst({
      where: and(eq(companies.id, data.companyId), eq(companies.tenantId, tenantId)),
    });

    if (!company) {
      throw new NotFoundError('Empresa', data.companyId);
    }

    // Check if agent with same machineId already exists
    const existing = await db.query.agents.findFirst({
      where: and(
        eq(localAgents.tenantId, tenantId),
        eq(localAgents.machineId, data.machineId)
      ),
    });

    if (existing) {
      throw new ConflictError(`Agente com machineId ${data.machineId} ja registrado`);
    }

    // Generate API key for agent
    const apiKey = generateApiKey();

    const [agent] = await db
      .insert(localAgents)
      .values({
        tenantId,
        companyId: data.companyId,
        name: data.name,
        type: data.type,
        machineId: data.machineId,
        apiKey,
        status: 'offline',
        metadata: data.metadata,
      })
      .returning();

    return {
      ...agent,
      apiKey, // Return API key only on registration
    };
  },

  async delete(tenantId: string, agentId: string) {
    const existing = await db.query.agents.findFirst({
      where: and(eq(localAgents.id, agentId), eq(localAgents.tenantId, tenantId)),
    });

    if (!existing) {
      throw new NotFoundError('Agente', agentId);
    }

    await db.delete(localAgents).where(eq(localAgents.id, agentId));

    // Clear heartbeat cache
    await cache.del(`${AGENT_CACHE_PREFIX}${agentId}`);
  },

  async heartbeat(agentId: string, data: AgentHeartbeatInput) {
    // Update agent status in database
    await db
      .update(localAgents)
      .set({
        status: data.status,
        lastActivity: data.lastActivity ? new Date(data.lastActivity) : new Date(),
        metadata: data.metadata,
        updatedAt: new Date(),
      })
      .where(eq(localAgents.id, agentId));

    // Update Redis cache for real-time status
    await cache.set(
      `${AGENT_CACHE_PREFIX}${agentId}`,
      { lastSeen: new Date().toISOString(), status: data.status },
      AGENT_HEARTBEAT_TTL
    );

    return { success: true };
  },

  async validateApiKey(apiKey: string): Promise<{ agentId: string; tenantId: string } | null> {
    const agent = await db.query.agents.findFirst({
      where: eq(localAgents.apiKey, apiKey),
    });

    if (!agent) {
      return null;
    }

    return {
      agentId: agent.id,
      tenantId: agent.tenantId,
    };
  },
};

function generateApiKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const prefix = 'fz_agent_';
  let key = prefix;

  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return key;
}