/**
 * Manifestação Integration Tests
 * 
 * Tests manifestação (MDe) data storage against real PostgreSQL database.
 * Validates document status updates for ciência, confirmação, desconhecimento.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { eq, and, isNull } from 'drizzle-orm';
import {
    createTestClient,
    cleanupDatabase,
    setupTestDatabase,
    teardownTestDatabase,
    schema
} from './db-helper';
import {
    createTestTenant,
    createTestCompany,
    createTestDocument,
} from './test-utils';

describe('Manifestação Integration Tests', () => {
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

    describe('Document Manifestation Status', () => {
        it('should update document with ciência status', async () => {
            // Setup
            const tenant = await createTestTenant(db);
            const company = await createTestCompany(db, tenant.id);
            const doc = await createTestDocument(db, tenant.id, company.id);

            // Act - simulate ciência registration
            const [updated] = await db
                .update(schema.documents)
                .set({
                    manifestacao: 'ciencia',
                    manifestacaoData: new Date(),
                })
                .where(eq(schema.documents.id, doc.id))
                .returning();

            // Assert
            expect(updated.manifestacao).toBe('ciencia');
            expect(updated.manifestacaoData).toBeDefined();
        });

        it('should update document with confirmação status', async () => {
            // Setup
            const tenant = await createTestTenant(db);
            const company = await createTestCompany(db, tenant.id);
            const doc = await createTestDocument(db, tenant.id, company.id);

            // Act
            const [updated] = await db
                .update(schema.documents)
                .set({ manifestacao: 'confirmacao' })
                .where(eq(schema.documents.id, doc.id))
                .returning();

            // Assert
            expect(updated.manifestacao).toBe('confirmacao');
        });

        it('should update document with desconhecimento status', async () => {
            // Setup
            const tenant = await createTestTenant(db);
            const company = await createTestCompany(db, tenant.id);
            const doc = await createTestDocument(db, tenant.id, company.id);

            // Act
            const [updated] = await db
                .update(schema.documents)
                .set({ manifestacao: 'desconhecimento' })
                .where(eq(schema.documents.id, doc.id))
                .returning();

            // Assert
            expect(updated.manifestacao).toBe('desconhecimento');
        });
    });

    describe('Pending Manifestations', () => {
        it('should query documents pending manifestation', async () => {
            // Setup
            const tenant = await createTestTenant(db);
            const company = await createTestCompany(db, tenant.id);

            // Create documents with different manifestation states
            await createTestDocument(db, tenant.id, company.id, {
                manifestacao: null // pending
            });
            await createTestDocument(db, tenant.id, company.id, {
                manifestacao: null // pending
            });
            await createTestDocument(db, tenant.id, company.id, {
                manifestacao: 'confirmacao' // already manifested
            });

            // Act
            const pending = await db
                .select()
                .from(schema.documents)
                .where(
                    and(
                        eq(schema.documents.tenantId, tenant.id),
                        isNull(schema.documents.manifestacao)
                    )
                );

            // Assert
            expect(pending).toHaveLength(2);
        });

        it('should filter manifestations by company', async () => {
            // Setup
            const tenant = await createTestTenant(db);
            const company1 = await createTestCompany(db, tenant.id, {
                id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
                cnpj: '11111111000111'
            });
            const company2 = await createTestCompany(db, tenant.id, {
                id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
                cnpj: '22222222000222'
            });

            await createTestDocument(db, tenant.id, company1.id, { manifestacao: 'ciencia' });
            await createTestDocument(db, tenant.id, company2.id, { manifestacao: 'confirmacao' });

            // Act
            const company1Docs = await db
                .select()
                .from(schema.documents)
                .where(
                    and(
                        eq(schema.documents.tenantId, tenant.id),
                        eq(schema.documents.companyId, company1.id)
                    )
                );

            // Assert
            expect(company1Docs).toHaveLength(1);
            expect(company1Docs[0].manifestacao).toBe('ciencia');
        });
    });
});
