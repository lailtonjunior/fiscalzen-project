import {
  pgTable,
  varchar,
  boolean,
  timestamp,
  text,
  uuid,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { companies } from './companies.js';

// ============================================
// NFSe Configuration Table
// ============================================

export const nfseConfigs = pgTable(
  'nfse_configs',
  {
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    codigoMunicipio: varchar('codigo_municipio', { length: 7 }).notNull(),
    nomeMunicipio: varchar('nome_municipio', { length: 100 }).notNull(),
    uf: varchar('uf', { length: 2 }).notNull(),
    tipo: varchar('tipo', { length: 20 }).notNull(), // 'abrasf' | 'rpa'
    versaoAbrasf: varchar('versao_abrasf', { length: 10 }),
    isActive: boolean('is_active').notNull().default(false),

    // RPA credentials (encrypted)
    rpaLogin: text('rpa_login'),
    rpaPassword: text('rpa_password'),
    inscricaoMunicipal: varchar('inscricao_municipal', { length: 20 }),

    // Sync status
    lastSync: timestamp('last_sync', { withTimezone: true }),
    lastError: text('last_error'),
    syncStatus: varchar('sync_status', { length: 20 }).default('idle'), // 'idle' | 'syncing' | 'error'

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.companyId, table.codigoMunicipio] }),
  })
);

// ============================================
// Relations
// ============================================

export const nfseConfigsRelations = relations(nfseConfigs, ({ one }) => ({
  company: one(companies, {
    fields: [nfseConfigs.companyId],
    references: [companies.id],
  }),
}));

// ============================================
// Types
// ============================================

export type NfseConfig = typeof nfseConfigs.$inferSelect;
export type NewNfseConfig = typeof nfseConfigs.$inferInsert;
