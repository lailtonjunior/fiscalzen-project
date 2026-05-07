/**
 * Webhooks Integration Tests
 * 
 * Tests webhook CRUD and logging against real PostgreSQL database.
 * Validates webhook creation, updates, and log storage.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { eq } from 'drizzle-orm';
import {
    createTestClient,
    cleanupDatabase,
    setupTestDatabase,
    teardownTestDatabase,
    schema
} from './db-helper';
import {
    createTestTenant,
} from './test-utils';

describe('Webhooks Integration Tests', () => {
    let db: ReturnType<typeof createTestClient>;

    beforeAll(async () => {
        db = await setupTestDatabase();
    });

    beforeEach(async () => {
        await cleanupDatabase(db);
    });

    afterAll(async () => {
        await cleanupDatabase(db);
        await teardownTestDatabase();
    });

    async function createTestWebhook(
        tenantId: string,
        overrides: Partial<typeof schema.webhooks.$inferInsert> = {}
    ) {
        const webhook = {
            tenantId,
            name: 'Webhook Teste',
            url: 'https://example.com/webhook',
            secret: 'test-secret-key',
            events: ['document.created', 'document.manifested'],
            isActive: true,
            ...overrides,
        };

        const [result] = await db.insert(schema.webhooks).values(webhook).returning();
        return result;
    }

    describe('Webhook CRUD', () => {
        it('should create a webhook with all fields', async () => {
            // Setup
            const tenant = await createTestTenant(db);

            // Act
            const webhook = await createTestWebhook(tenant.id);

            // Assert
            expect(webhook.id).toBeDefined();
            expect(webhook.name).toBe('Webhook Teste');
            expect(webhook.url).toBe('https://example.com/webhook');
            expect(webhook.events).toContain('document.created');
            expect(webhook.isActive).toBe(true);
        });

        it('should list webhooks by tenant', async () => {
            // Setup
            const tenant = await createTestTenant(db);
            await createTestWebhook(tenant.id, { url: 'https://example.com/hook1' });
            await createTestWebhook(tenant.id, { url: 'https://example.com/hook2' });

            // Act
            const webhooks = await db
                .select()
                .from(schema.webhooks)
                .where(eq(schema.webhooks.tenantId, tenant.id));

            // Assert
            expect(webhooks).toHaveLength(2);
        });

        it('should update webhook URL and events', async () => {
            // Setup
            const tenant = await createTestTenant(db);
            const webhook = await createTestWebhook(tenant.id);

            // Act
            const [updated] = await db
                .update(schema.webhooks)
                .set({
                    url: 'https://new-endpoint.com/hook',
                    events: ['document.cancelled']
                })
                .where(eq(schema.webhooks.id, webhook.id))
                .returning();

            // Assert
            expect(updated.url).toBe('https://new-endpoint.com/hook');
            expect(updated.events).toContain('document.cancelled');
            expect(updated.events).not.toContain('document.created');
        });

        it('should delete a webhook', async () => {
            // Setup
            const tenant = await createTestTenant(db);
            const webhook = await createTestWebhook(tenant.id);

            // Act
            await db.delete(schema.webhooks).where(eq(schema.webhooks.id, webhook.id));

            // Assert
            const remaining = await db
                .select()
                .from(schema.webhooks)
                .where(eq(schema.webhooks.id, webhook.id));

            expect(remaining).toHaveLength(0);
        });
    });

    describe('Webhook Activation', () => {
        it('should toggle webhook active status', async () => {
            // Setup
            const tenant = await createTestTenant(db);
            const webhook = await createTestWebhook(tenant.id, { isActive: true });

            // Act - Deactivate
            const [deactivated] = await db
                .update(schema.webhooks)
                .set({ isActive: false })
                .where(eq(schema.webhooks.id, webhook.id))
                .returning();

            // Assert
            expect(deactivated.isActive).toBe(false);

            // Act - Reactivate
            const [reactivated] = await db
                .update(schema.webhooks)
                .set({ isActive: true })
                .where(eq(schema.webhooks.id, webhook.id))
                .returning();

            expect(reactivated.isActive).toBe(true);
        });

        it('should only return active webhooks for event dispatch', async () => {
            // Setup
            const tenant = await createTestTenant(db);
            await createTestWebhook(tenant.id, { isActive: true, url: 'https://active.com' });
            await createTestWebhook(tenant.id, { isActive: false, url: 'https://inactive.com' });

            // Act
            const activeHooks = await db
                .select()
                .from(schema.webhooks)
                .where(eq(schema.webhooks.isActive, true));

            // Assert
            expect(activeHooks).toHaveLength(1);
            expect(activeHooks[0].url).toBe('https://active.com');
        });
    });
});
