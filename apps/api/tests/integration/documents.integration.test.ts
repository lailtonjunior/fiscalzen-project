/**
 * Documents Integration Tests
 * 
 * Tests document CRUD operations against real PostgreSQL database.
 * Validates Drizzle queries, relationships, and constraints.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
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
    createTestDocuments
} from './test-utils';

describe('Documents Integration Tests', () => {
    let db: ReturnType<typeof createTestClient>;

    beforeAll(async () => {
        // Initialize database and check schema exists
        db = await setupTestDatabase();
    });

    beforeEach(async () => {
        // Clean database before each test
        await cleanupDatabase(db);
    });

    afterAll(async () => {
        // Final cleanup and close connection
        await cleanupDatabase(db);
        await teardownTestDatabase();
    });

    describe('Document CRUD', () => {
        it('should create a document with all fields', async () => {
            // Setup
            const tenant = await createTestTenant(db);
            const company = await createTestCompany(db, tenant.id);

            // Act
            const doc = await createTestDocument(db, tenant.id, company.id, {
                docType: 'NFE',
                numero: 12345,
                serie: 1,
                valorTotal: '5000.50',
                situacao: 'autorizada',
            });

            // Assert
            expect(doc.id).toBeDefined();
            expect(doc.docType).toBe('NFE');
            expect(doc.numero).toBe(12345);
            expect(doc.valorTotal).toBe('5000.50');
            expect(doc.tenantId).toBe(tenant.id);
            expect(doc.companyId).toBe(company.id);
        });

        it('should query documents by tenant and docType', async () => {
            // Setup
            const tenant = await createTestTenant(db);
            const company = await createTestCompany(db, tenant.id);

            await createTestDocument(db, tenant.id, company.id, { docType: 'NFE' });
            await createTestDocument(db, tenant.id, company.id, { docType: 'NFE' });
            await createTestDocument(db, tenant.id, company.id, { docType: 'CTE' });

            // Act
            const nfes = await db
                .select()
                .from(schema.documents)
                .where(
                    and(
                        eq(schema.documents.tenantId, tenant.id),
                        eq(schema.documents.docType, 'NFE')
                    )
                );

            // Assert
            expect(nfes).toHaveLength(2);
            expect(nfes.every(d => d.docType === 'NFE')).toBe(true);
        });

        it('should update document situacao', async () => {
            // Setup
            const tenant = await createTestTenant(db);
            const company = await createTestCompany(db, tenant.id);
            const doc = await createTestDocument(db, tenant.id, company.id);

            // Act
            const [updated] = await db
                .update(schema.documents)
                .set({ situacao: 'cancelada' })
                .where(eq(schema.documents.id, doc.id))
                .returning();

            // Assert
            expect(updated.situacao).toBe('cancelada');
        });

        it('should delete document and cascade to events', async () => {
            // Setup
            const tenant = await createTestTenant(db);
            const company = await createTestCompany(db, tenant.id);
            const doc = await createTestDocument(db, tenant.id, company.id);

            // Create an event for the document
            await db.insert(schema.documentEvents).values({
                documentId: doc.id,
                eventType: 'authorization',
                eventDate: new Date(),
                description: 'Test event',
            });

            // Act
            await db.delete(schema.documents).where(eq(schema.documents.id, doc.id));

            // Assert - both document and event should be deleted
            const docs = await db
                .select()
                .from(schema.documents)
                .where(eq(schema.documents.id, doc.id));

            const events = await db
                .select()
                .from(schema.documentEvents)
                .where(eq(schema.documentEvents.documentId, doc.id));

            expect(docs).toHaveLength(0);
            expect(events).toHaveLength(0);
        });
    });

    describe('Document Queries with Filters', () => {
        it('should filter documents by date range', async () => {
            // Setup
            const tenant = await createTestTenant(db);
            const company = await createTestCompany(db, tenant.id);

            await createTestDocument(db, tenant.id, company.id, {
                dataEmissao: '2024-01-15'
            });
            await createTestDocument(db, tenant.id, company.id, {
                dataEmissao: '2024-02-15'
            });
            await createTestDocument(db, tenant.id, company.id, {
                dataEmissao: '2024-03-15'
            });

            // Act - Query January to February
            const docs = await db
                .select()
                .from(schema.documents)
                .where(
                    and(
                        eq(schema.documents.tenantId, tenant.id),
                        gte(schema.documents.dataEmissao, '2024-01-01'),
                        lte(schema.documents.dataEmissao, '2024-02-28')
                    )
                )
                .orderBy(desc(schema.documents.dataEmissao));

            // Assert
            expect(docs).toHaveLength(2);
            // Get date strings (handle both Date objects and strings)
            const dates = docs.map(d => {
                const date = d.dataEmissao;
                if (date && typeof date === 'object' && 'toISOString' in date) {
                    return (date as Date).toISOString().slice(0, 10);
                }
                return String(date);
            });
            expect(dates).toContain('2024-02-15');
            expect(dates).toContain('2024-01-15');
        });

        it('should query documents with pagination', async () => {
            // Setup
            const tenant = await createTestTenant(db);
            const company = await createTestCompany(db, tenant.id);
            await createTestDocuments(db, 10, tenant.id, company.id);

            // Act - Get page 2 with 3 items per page
            const pageSize = 3;
            const page = 2;
            const docs = await db
                .select()
                .from(schema.documents)
                .where(eq(schema.documents.tenantId, tenant.id))
                .limit(pageSize)
                .offset((page - 1) * pageSize);

            // Assert
            expect(docs).toHaveLength(3);
        });
    });

    describe('Document Relationships', () => {
        it('should enforce tenant FK constraint', async () => {
            // Setup
            const company = await createTestCompany(db,
                '99999999-9999-9999-9999-999999999999' // Non-existent tenant
            ).catch(() => null);

            // Assert - Should fail due to FK constraint
            expect(company).toBeNull();
        });

        it('should cascade delete when tenant is deleted', async () => {
            // Setup
            const tenant = await createTestTenant(db, {
                id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
            });
            const company = await createTestCompany(db, tenant.id, {
                id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
            });
            await createTestDocument(db, tenant.id, company.id);

            // Act
            await db.delete(schema.tenants).where(eq(schema.tenants.id, tenant.id));

            // Assert - Company and documents should be cascade deleted
            const companies = await db
                .select()
                .from(schema.companies)
                .where(eq(schema.companies.tenantId, tenant.id));

            expect(companies).toHaveLength(0);
        });
    });
});
