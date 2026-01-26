import { pgTable, uuid, text, boolean, timestamp, index, foreignKey } from 'drizzle-orm/pg-core';
import { documents } from './documents';
import { tenants } from './tenants';

export const comments = pgTable('comments', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
    documentId: uuid('document_id').notNull().references(() => documents.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull(), // No FK
    content: text('content').notNull(),
    isInternal: boolean('is_internal').default(false), // Visible only to team
    parentId: uuid('parent_id'), // For replies
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    deletedAt: timestamp('deleted_at') // Soft delete
}, (table) => ({
    idxDocument: index('idx_comments_document').on(table.documentId, table.createdAt),
    parentFk: foreignKey({
        columns: [table.parentId],
        foreignColumns: [table.id],
        name: 'comments_parent_id_fkey'
    })
}));
