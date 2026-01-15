import {
  pgTable,
  uuid,
  varchar,
  integer,
  decimal,
  date,
  timestamp,
  jsonb,
  text,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { tenants, companies } from './tenants';

export const docTypeEnum = ['NFE', 'NFSE', 'CTE', 'MDFE', 'SAT', 'NFCE'] as const;
export type DocType = (typeof docTypeEnum)[number];

export const situacaoEnum = ['autorizada', 'cancelada', 'inutilizada', 'denegada'] as const;
export type Situacao = (typeof situacaoEnum)[number];

export const documents = pgTable(
  'documents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),

    // Document identification
    docType: varchar('doc_type', { length: 20 }).notNull().$type<DocType>(),
    chave: varchar('chave', { length: 44 }),
    numero: integer('numero'),
    serie: integer('serie'),

    // Parties involved
    emitCnpj: varchar('emit_cnpj', { length: 14 }),
    emitRazao: varchar('emit_razao', { length: 255 }),
    destCnpjCpf: varchar('dest_cnpj_cpf', { length: 14 }),
    destRazao: varchar('dest_razao', { length: 255 }),

    // Values
    valorTotal: decimal('valor_total', { precision: 15, scale: 2 }),

    // Dates
    dataEmissao: date('data_emissao').notNull(),
    dataAutorizacao: timestamp('data_autorizacao', { withTimezone: true }),
    dataCaptura: timestamp('data_captura', { withTimezone: true }).defaultNow(),

    // Status
    situacao: varchar('situacao', { length: 20 }).default('autorizada').$type<Situacao>(),

    // Storage
    xmlStorageKey: varchar('xml_storage_key', { length: 255 }),
    xmlHashSha256: varchar('xml_hash_sha256', { length: 64 }),
    xmlSizeBytes: integer('xml_size_bytes'),

    // Metadata and search
    metadata: jsonb('metadata').default({}),
    searchContent: text('search_content'),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    tenantTypeIdx: index('idx_documents_tenant_type').on(table.tenantId, table.docType),
    companyDateIdx: index('idx_documents_company_date').on(table.companyId, table.dataEmissao),
    chaveIdx: index('idx_documents_chave').on(table.chave),
    emitCnpjIdx: index('idx_documents_emit_cnpj').on(table.emitCnpj),
    destCnpjCpfIdx: index('idx_documents_dest_cnpj_cpf').on(table.destCnpjCpf),
    dataEmissaoIdx: index('idx_documents_data_emissao').on(table.dataEmissao),
  })
);

export const documentsRelations = relations(documents, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [documents.tenantId],
    references: [tenants.id],
  }),
  company: one(companies, {
    fields: [documents.companyId],
    references: [companies.id],
  }),
  events: many(documentEvents),
}));

export const documentEvents = pgTable(
  'document_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    documentId: uuid('document_id')
      .notNull()
      .references(() => documents.id, { onDelete: 'cascade' }),
    eventType: varchar('event_type', { length: 50 }).notNull(),
    eventSeq: integer('event_seq'),
    eventDate: timestamp('event_date', { withTimezone: true }),
    protocol: varchar('protocol', { length: 50 }),
    description: text('description'),
    xmlStorageKey: varchar('xml_storage_key', { length: 255 }),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    documentIdIdx: index('idx_document_events_document_id').on(table.documentId),
    eventTypeIdx: index('idx_document_events_event_type').on(table.eventType),
  })
);

export const documentEventsRelations = relations(documentEvents, ({ one }) => ({
  document: one(documents, {
    fields: [documentEvents.documentId],
    references: [documents.id],
  }),
}));

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
export type DocumentEvent = typeof documentEvents.$inferSelect;
export type NewDocumentEvent = typeof documentEvents.$inferInsert;
