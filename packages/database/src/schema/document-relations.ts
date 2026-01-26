import { pgTable, uuid, varchar, timestamp, index, unique, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { tenants } from './tenants';
import { documents } from './documents';

// Tipos de relacionamento
export const relationTypeEnum = [
    'cte_transporta_nfe',      // CTe -> NFe
    'nfe_referencia_nfe',      // NFe referencia outra NFe
    'mdfe_contem_cte',            // MDFe -> CTe
    'mdfe_contem_nfe',            // MDFe -> NFe
    'cancelamento',                   // Evento cancelamento
    'carta_correcao'               // CCe
] as const;

export type RelationType = (typeof relationTypeEnum)[number];

export const documentRelations = pgTable('document_relations', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),

    // Documento origem (quem referencia)
    sourceDocumentId: uuid('source_document_id').references(() => documents.id, { onDelete: 'set null' }),
    sourceChave: varchar('source_chave', { length: 44 }).notNull(),
    sourceType: varchar('source_type', { length: 10 }).notNull(), // CTe, MDFe, etc

    // Documento destino (quem e referenciado)
    targetDocumentId: uuid('target_document_id').references(() => documents.id, { onDelete: 'set null' }),
    targetChave: varchar('target_chave', { length: 44 }).notNull(),
    targetType: varchar('target_type', { length: 10 }).notNull(), // NFe, CTe, etc

    // Tipo de relacao
    relationType: varchar('relation_type', { length: 30 }).notNull(),

    // Metadados adicionais
    metadata: jsonb('metadata'), // Ex: numero da NFe no CTe, sequencial

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
}, (table) => ({
    // Indices para consultas frequentes
    idxRelationsSource: index('idx_relations_source').on(table.tenantId, table.sourceDocumentId),
    idxRelationsTarget: index('idx_relations_target').on(table.tenantId, table.targetDocumentId),
    idxRelationsSourceChave: index('idx_relations_source_chave').on(table.tenantId, table.sourceChave),
    idxRelationsTargetChave: index('idx_relations_target_chave').on(table.tenantId, table.targetChave),

    // Evitar duplicatas
    uniqueRelation: unique('unique_relation').on(
        table.tenantId,
        table.sourceChave,
        table.targetChave,
        table.relationType
    )
}));

export const documentRelationsRelations = relations(documentRelations, ({ one }) => ({
    sourceDocument: one(documents, {
        fields: [documentRelations.sourceDocumentId],
        references: [documents.id],
        relationName: 'sourceRelations'
    }),
    targetDocument: one(documents, {
        fields: [documentRelations.targetDocumentId],
        references: [documents.id],
        relationName: 'targetRelations'
    })
}));

export type DocumentRelation = typeof documentRelations.$inferSelect;
export type NewDocumentRelation = typeof documentRelations.$inferInsert;
