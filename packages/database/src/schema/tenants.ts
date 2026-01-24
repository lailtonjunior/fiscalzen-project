import { pgTable, uuid, varchar, jsonb, timestamp, boolean, text } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  cnpj: varchar('cnpj', { length: 14 }).unique(),
  plan: varchar('plan', { length: 50 }).default('starter'),
  settings: jsonb('settings').default({}),
  active: boolean('active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const tenantsRelations = relations(tenants, ({ many }) => ({
  companies: many(companies),
}));

export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  cnpj: varchar('cnpj', { length: 14 }).notNull(),
  razaoSocial: varchar('razao_social', { length: 255 }),
  nomeFantasia: varchar('nome_fantasia', { length: 255 }),
  uf: varchar('uf', { length: 2 }),
  inscricaoEstadual: varchar('inscricao_estadual', { length: 20 }),
  inscricaoMunicipal: varchar('inscricao_municipal', { length: 20 }),
  codigoMunicipio: varchar('codigo_municipio', { length: 7 }),

  // Certificate info
  certificate: text('certificate'),
  certificatePassword: text('certificate_password'),
  certificateExpiry: timestamp('certificate_expiry', { withTimezone: true }),

  settings: jsonb('settings').default({}),
  active: boolean('active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const companiesRelations = relations(companies, ({ one }) => ({
  tenant: one(tenants, {
    fields: [companies.tenantId],
    references: [tenants.id],
  }),
}));

export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;
export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;
