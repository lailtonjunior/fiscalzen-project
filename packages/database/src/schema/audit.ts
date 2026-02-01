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

// ============================================
// Certificate Access Logs - Auditoria de Certificados
// ============================================

export const certificateAccessLogs = pgTable(
  'certificate_access_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    userId: uuid('user_id'),
    action: varchar('action', { length: 50 }).notNull(), // VIEW, DOWNLOAD, USE_FOR_SIGNING, UPLOAD, DELETE, VALIDATE
    status: varchar('status', { length: 20 }).default('success'), // success, failure, denied
    ipAddress: inet('ip_address'),
    userAgent: varchar('user_agent', { length: 500 }),
    requestId: varchar('request_id', { length: 100 }),
    metadata: jsonb('metadata'), // Dados adicionais sobre a operacao
    errorMessage: varchar('error_message', { length: 500 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    tenantIdIdx: index('idx_cert_logs_tenant_id').on(table.tenantId),
    companyIdIdx: index('idx_cert_logs_company_id').on(table.companyId),
    userIdIdx: index('idx_cert_logs_user_id').on(table.userId),
    actionIdx: index('idx_cert_logs_action').on(table.action),
    createdAtIdx: index('idx_cert_logs_created_at').on(table.createdAt),
    statusIdx: index('idx_cert_logs_status').on(table.status),
  })
);

export const certificateAccessLogsRelations = relations(certificateAccessLogs, ({ one }) => ({
  tenant: one(tenants, {
    fields: [certificateAccessLogs.tenantId],
    references: [tenants.id],
  }),
  company: one(companies, {
    fields: [certificateAccessLogs.companyId],
    references: [companies.id],
  }),
}));

// ============================================
// Security Events - Eventos de Seguranca
// ============================================

export const securityEvents = pgTable(
  'security_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
    eventType: varchar('event_type', { length: 50 }).notNull(), // AUTH_FAILURE, RATE_LIMIT, SUSPICIOUS_ACTIVITY, KEY_ROTATION
    severity: varchar('severity', { length: 20 }).notNull(), // INFO, WARNING, CRITICAL
    source: varchar('source', { length: 100 }), // IP, User-Agent, etc
    description: varchar('description', { length: 1000 }).notNull(),
    ipAddress: inet('ip_address'),
    userAgent: varchar('user_agent', { length: 500 }),
    userId: uuid('user_id'),
    metadata: jsonb('metadata'),
    resolved: timestamp('resolved', { withTimezone: true }),
    resolvedBy: uuid('resolved_by'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    tenantIdIdx: index('idx_security_events_tenant_id').on(table.tenantId),
    eventTypeIdx: index('idx_security_events_event_type').on(table.eventType),
    severityIdx: index('idx_security_events_severity').on(table.severity),
    createdAtIdx: index('idx_security_events_created_at').on(table.createdAt),
    unresolvedIdx: index('idx_security_events_unresolved').on(table.resolved),
  })
);

// ============================================
// Types
// ============================================

export type MonitorJob = typeof monitorJobs.$inferSelect;
export type NewMonitorJob = typeof monitorJobs.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
export type CertificateAccessLog = typeof certificateAccessLogs.$inferSelect;
export type NewCertificateAccessLog = typeof certificateAccessLogs.$inferInsert;
export type SecurityEvent = typeof securityEvents.$inferSelect;
export type NewSecurityEvent = typeof securityEvents.$inferInsert;
