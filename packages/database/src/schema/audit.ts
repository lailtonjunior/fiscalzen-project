import { pgTable, uuid, varchar, timestamp, jsonb, inet, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { tenants } from './tenants';
import { companies } from './tenants';

export const monitorJobs = pgTable(
  'monitor_jobs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    jobType: varchar('job_type', { length: 50 }).notNull(),
    lastNsu: varchar('last_nsu', { length: 25 }),
    lastRun: timestamp('last_run', { withTimezone: true }),
    nextRun: timestamp('next_run', { withTimezone: true }),
    status: varchar('status', { length: 20 }).default('pending'),
    errorCount: varchar('error_count', { length: 10 }).default('0'),
    lastError: varchar('last_error', { length: 500 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    companyIdIdx: index('idx_monitor_jobs_company_id').on(table.companyId),
    jobTypeIdx: index('idx_monitor_jobs_job_type').on(table.jobType),
    nextRunIdx: index('idx_monitor_jobs_next_run').on(table.nextRun),
  })
);

export const monitorJobsRelations = relations(monitorJobs, ({ one }) => ({
  company: one(companies, {
    fields: [monitorJobs.companyId],
    references: [companies.id],
  }),
}));

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    userId: uuid('user_id'),
    action: varchar('action', { length: 100 }).notNull(),
    entityType: varchar('entity_type', { length: 50 }),
    entityId: uuid('entity_id'),
    details: jsonb('details'),
    ipAddress: inet('ip_address'),
    userAgent: varchar('user_agent', { length: 500 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    tenantIdIdx: index('idx_audit_logs_tenant_id').on(table.tenantId),
    userIdIdx: index('idx_audit_logs_user_id').on(table.userId),
    actionIdx: index('idx_audit_logs_action').on(table.action),
    entityTypeIdx: index('idx_audit_logs_entity_type').on(table.entityType),
    createdAtIdx: index('idx_audit_logs_created_at').on(table.createdAt),
  })
);

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  tenant: one(tenants, {
    fields: [auditLogs.tenantId],
    references: [tenants.id],
  }),
}));

export type MonitorJob = typeof monitorJobs.$inferSelect;
export type NewMonitorJob = typeof monitorJobs.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
