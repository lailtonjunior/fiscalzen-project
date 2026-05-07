import { pgTable, uuid, varchar, integer, boolean, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';

export const downloadRegistry = pgTable('download_registry', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  userId: uuid('user_id'),
  jobId: varchar('job_id', { length: 100 }).notNull(),

  status: varchar('status', { length: 20 }).notNull().default('queued'),
  progress: integer('progress').notNull().default(0),

  format: varchar('format', { length: 10 }).notNull(),
  includeMetadata: boolean('include_metadata').notNull().default(true),
  organizacao: varchar('organizacao', { length: 30 }).notNull().default('by-date'),
  estimatedDocuments: integer('estimated_documents').default(0),
  processedDocuments: integer('processed_documents').default(0),
  errorCount: integer('error_count').default(0),

  filters: jsonb('filters'),
  documentIds: jsonb('document_ids'),
  result: jsonb('result'),
  downloadUrl: varchar('download_url', { length: 2000 }),
  errorMessage: varchar('error_message', { length: 1000 }),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  startedAt: timestamp('started_at', { withTimezone: true }),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  tenantCreatedIdx: index('idx_download_registry_tenant_created').on(table.tenantId, table.createdAt),
  tenantStatusIdx: index('idx_download_registry_tenant_status').on(table.tenantId, table.status),
  jobIdx: index('idx_download_registry_job_id').on(table.jobId),
}));

export type DownloadRegistry = typeof downloadRegistry.$inferSelect;
export type NewDownloadRegistry = typeof downloadRegistry.$inferInsert;
