import { pgTable, uuid, varchar, jsonb, boolean, timestamp, index, text } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';
import { companies } from './companies';
import { documents } from './documents';

export const alerts = pgTable('alerts', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }),
    documentId: uuid('document_id').references(() => documents.id, { onDelete: 'set null' }),

    type: varchar('type', { length: 20 }).notNull(), // CRITICO, INFO, WARNING
    priority: varchar('priority', { length: 20 }).default('MEDIA'), // ALTA, MEDIA, BAIXA

    title: varchar('title', { length: 255 }).notNull(),
    message: text('message'),

    data: jsonb('data').default({}), // Helper data (event protocol, changes, etc)

    lido: boolean('lido').default(false),
    lidoEm: timestamp('lido_em', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    tenantIdx: index('idx_alerts_tenant').on(table.tenantId),
    unreadIdx: index('idx_alerts_unread').on(table.tenantId, table.lido),
}));
