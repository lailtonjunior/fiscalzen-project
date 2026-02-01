import { pgTable, uuid, varchar, jsonb, boolean, timestamp, integer, text } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';

export const webhooks = pgTable('webhooks', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(),
    url: varchar('url', { length: 500 }).notNull(),
    secret: varchar('secret', { length: 64 }).notNull(), // Para assinatura HMAC
    events: jsonb('events').notNull(), // Array de eventos a escutar. Using jsonb for better querying if needed.
    headers: jsonb('headers'), // Headers customizados
    isActive: boolean('is_active').default(true),
    retryPolicy: jsonb('retry_policy').default({
        maxAttempts: 3,
        backoffMs: 5000
    }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

export const webhookLogs = pgTable('webhook_logs', {
    id: uuid('id').primaryKey().defaultRandom(),
    webhookId: uuid('webhook_id').notNull().references(() => webhooks.id, { onDelete: 'cascade' }),
    event: varchar('event', { length: 50 }).notNull(),
    payload: jsonb('payload').notNull(),
    response: jsonb('response'),
    statusCode: integer('status_code'),
    attempt: integer('attempt').default(1),
    success: boolean('success').notNull(),
    errorMessage: text('error_message'),
    executedAt: timestamp('executed_at', { withTimezone: true }).defaultNow(),
    durationMs: integer('duration_ms')
});
