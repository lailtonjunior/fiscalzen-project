import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  integer,
  text,
  index,
  unique,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { companies } from './tenants.js';

/**
 * NSU Control Table
 *
 * Controla o NSU (Número Sequencial Único) de cada empresa para cada tipo de documento.
 * O NSU é usado pela SEFAZ para controlar a distribuição de documentos fiscais.
 *
 * Regras importantes:
 * - Cada empresa tem um NSU separado para NFE, CTE e MDFE
 * - O NSU é um número de 15 dígitos (string com zeros à esquerda)
 * - Se ultNSU === maxNSU, aguardar 1 hora antes de nova consulta
 * - Documentos ficam disponíveis por até 90 dias (NFe/CTe) ou 6 meses (MDF-e)
 */

export const nsuDocTypeEnum = ['NFE', 'CTE', 'MDFE'] as const;
export type NsuDocType = (typeof nsuDocTypeEnum)[number];

export const nsuSyncStatusEnum = ['idle', 'syncing', 'error', 'rate_limited'] as const;
export type NsuSyncStatus = (typeof nsuSyncStatusEnum)[number];

export const nsuControl = pgTable(
  'nsu_control',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),

    // Tipo de documento (NFE, CTE, MDFE)
    docType: varchar('doc_type', { length: 10 }).notNull().$type<NsuDocType>(),

    // NSU Control - 15 dígitos com zeros à esquerda
    lastNsu: varchar('last_nsu', { length: 15 }).notNull().default('000000000000000'),
    maxNsu: varchar('max_nsu', { length: 15 }),

    // Timestamps de sincronização
    lastSync: timestamp('last_sync', { withTimezone: true }),
    nextSync: timestamp('next_sync', { withTimezone: true }),

    // Status e controle de erros
    syncStatus: varchar('sync_status', { length: 20 }).default('idle').$type<NsuSyncStatus>(),
    errorCount: integer('error_count').notNull().default(0),
    lastError: text('last_error'),
    lastErrorAt: timestamp('last_error_at', { withTimezone: true }),

    // Estatísticas
    totalDocumentsReceived: integer('total_documents_received').notNull().default(0),
    lastDocumentReceivedAt: timestamp('last_document_received_at', { withTimezone: true }),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    // Índices
    companyDocTypeIdx: index('idx_nsu_control_company_doc_type').on(table.companyId, table.docType),
    nextSyncIdx: index('idx_nsu_control_next_sync').on(table.nextSync),
    syncStatusIdx: index('idx_nsu_control_sync_status').on(table.syncStatus),

    // Constraint: Uma entrada por empresa/tipo de documento
    uniqueCompanyDocType: unique('uq_nsu_control_company_doc_type').on(table.companyId, table.docType),
  })
);

export const nsuControlRelations = relations(nsuControl, ({ one }) => ({
  company: one(companies, {
    fields: [nsuControl.companyId],
    references: [companies.id],
  }),
}));

// Types
export type NsuControl = typeof nsuControl.$inferSelect;
export type NewNsuControl = typeof nsuControl.$inferInsert;

/**
 * Helper functions for NSU manipulation
 */

/**
 * Formata um número como NSU (15 dígitos com zeros à esquerda)
 */
export function formatNsu(nsu: number | string): string {
  const num = typeof nsu === 'string' ? parseInt(nsu, 10) : nsu;
  return num.toString().padStart(15, '0');
}

/**
 * Incrementa um NSU em 1
 */
export function incrementNsu(nsu: string): string {
  const num = parseInt(nsu, 10);
  return formatNsu(num + 1);
}

/**
 * Verifica se deve aguardar antes da próxima sincronização
 * (quando ultNSU === maxNSU)
 */
export function shouldWaitForNextSync(lastNsu: string, maxNsu: string | null): boolean {
  if (!maxNsu) return false;
  return lastNsu === maxNsu;
}

/**
 * Calcula o próximo horário de sincronização baseado nas regras da SEFAZ
 * - Se ultNSU === maxNSU: aguardar 1 hora
 * - Se ainda há documentos: aguardar 5 minutos
 * - Se houve erro: backoff exponencial (max 1 hora)
 */
export function calculateNextSyncTime(
  lastNsu: string,
  maxNsu: string | null,
  errorCount: number
): Date {
  const now = new Date();

  // Se houve erros, usar backoff exponencial
  if (errorCount > 0) {
    const backoffMinutes = Math.min(Math.pow(2, errorCount) * 5, 60); // max 1 hora
    return new Date(now.getTime() + backoffMinutes * 60 * 1000);
  }

  // Se não há mais documentos (ultNSU === maxNSU), aguardar 1 hora
  if (shouldWaitForNextSync(lastNsu, maxNsu)) {
    return new Date(now.getTime() + 60 * 60 * 1000); // 1 hora
  }

  // Ainda há documentos, aguardar 5 minutos
  return new Date(now.getTime() + 5 * 60 * 1000); // 5 minutos
}
