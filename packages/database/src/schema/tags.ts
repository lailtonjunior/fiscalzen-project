import { pgTable, uuid, varchar, timestamp, boolean, unique, primaryKey, index } from 'drizzle-orm/pg-core';
import { documents } from './documents';
import { tenants } from './tenants';

export const tags = pgTable('tags', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
    name: varchar('name', { length: 50 }).notNull(),
    slug: varchar('slug', { length: 50 }).notNull(), // URL-friendly
    color: varchar('color', { length: 7 }).notNull().default('#6366f1'), // Hex
    description: varchar('description', { length: 255 }),
    icon: varchar('icon', { length: 50 }), // icon name (lucide)
    isSystem: boolean('is_system').default(false), // System tags (not editable)
    createdAt: timestamp('created_at').defaultNow(),
    createdBy: uuid('created_by') // No FK to users table as it doesn't exist locally
}, (table) => ({
    uniqueSlug: unique('unique_tag_slug').on(table.tenantId, table.slug)
}));

export const documentTags = pgTable('document_tags', {
    documentId: uuid('document_id').notNull().references(() => documents.id, { onDelete: 'cascade' }),
    tagId: uuid('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow(),
    createdBy: uuid('created_by') // No FK
}, (table) => ({
    pk: primaryKey({ columns: [table.documentId, table.tagId] }),
    idxDocument: index('idx_document_tags_doc').on(table.documentId),
    idxTag: index('idx_document_tags_tag').on(table.tagId)
}));
