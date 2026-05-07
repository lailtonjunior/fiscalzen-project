import { relations } from 'drizzle-orm';
import { index, jsonb, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { companies, tenants } from './tenants';
import { documents } from './documents';

export const documentHistory = pgTable(
  'document_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    documentId: uuid('document_id').references(() => documents.id, { onDelete: 'cascade' }),
    companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }),
    userId: uuid('user_id'),
    eventType: varchar('event_type', { length: 100 }).notNull(),
    source: varchar('source', { length: 100 }).notNull(),
    title: varchar('title', { length: 200 }).notNull(),
    summary: varchar('summary', { length: 500 }),
    details: jsonb('details').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    tenantCreatedIdx: index('idx_document_history_tenant_created').on(table.tenantId, table.createdAt),
    documentCreatedIdx: index('idx_document_history_document_created').on(table.documentId, table.createdAt),
    companyCreatedIdx: index('idx_document_history_company_created').on(table.companyId, table.createdAt),
    createdAtIdx: index('idx_document_history_created_at').on(table.createdAt),
    eventTypeIdx: index('idx_document_history_event_type').on(table.eventType),
    sourceIdx: index('idx_document_history_source').on(table.source),
  })
);

export const documentHistoryRelations = relations(documentHistory, ({ one }) => ({
  tenant: one(tenants, {
    fields: [documentHistory.tenantId],
    references: [tenants.id],
  }),
  document: one(documents, {
    fields: [documentHistory.documentId],
    references: [documents.id],
  }),
  company: one(companies, {
    fields: [documentHistory.companyId],
    references: [companies.id],
  }),
}));

export type DocumentHistory = typeof documentHistory.$inferSelect;
export type NewDocumentHistory = typeof documentHistory.$inferInsert;
