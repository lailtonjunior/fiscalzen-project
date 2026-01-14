import { z } from 'zod';

export const registerAgentSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['sat', 'nfce', 'nfse_rpa']),
  machineId: z.string().min(1).max(255),
  companyId: z.string().uuid(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const agentIdSchema = z.object({
  id: z.string().uuid('ID invalido'),
});

export const listAgentsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
  companyId: z.string().uuid().optional(),
  type: z.enum(['sat', 'nfce', 'nfse_rpa']).optional(),
  status: z.enum(['online', 'offline', 'error']).optional(),
});

export const agentHeartbeatSchema = z.object({
  status: z.enum(['online', 'offline', 'error']),
  lastActivity: z.string().datetime().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type RegisterAgentInput = z.infer<typeof registerAgentSchema>;
export type AgentIdParams = z.infer<typeof agentIdSchema>;
export type ListAgentsQuery = z.infer<typeof listAgentsQuerySchema>;
export type AgentHeartbeatInput = z.infer<typeof agentHeartbeatSchema>;
