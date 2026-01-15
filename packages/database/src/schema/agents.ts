import { pgTable, uuid, varchar, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { tenants } from './tenants';

export const agentStatusEnum = ['online', 'offline', 'error'] as const;
export type AgentStatus = (typeof agentStatusEnum)[number];

export const agents = pgTable(
  'agents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }),
    machineId: varchar('machine_id', { length: 100 }),
    lastHeartbeat: timestamp('last_heartbeat', { withTimezone: true }),
    version: varchar('version', { length: 20 }),
    status: varchar('status', { length: 20 }).default('offline').$type<AgentStatus>(),
    ipAddress: varchar('ip_address', { length: 45 }),
    config: jsonb('config').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    tenantIdIdx: index('idx_agents_tenant_id').on(table.tenantId),
    machineIdIdx: index('idx_agents_machine_id').on(table.machineId),
    statusIdx: index('idx_agents_status').on(table.status),
  })
);

export const agentsRelations = relations(agents, ({ one }) => ({
  tenant: one(tenants, {
    fields: [agents.tenantId],
    references: [tenants.id],
  }),
}));

export type Agent = typeof agents.$inferSelect;
export type NewAgent = typeof agents.$inferInsert;
