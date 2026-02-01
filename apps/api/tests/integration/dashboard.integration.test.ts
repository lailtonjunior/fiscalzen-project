/**
 * Dashboard Integration Tests
 * 
 * Tests dashboard queries and statistics against real PostgreSQL database.
 * Validates aggregations, timeline queries, and gap detection.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { eq, sql, count } from 'drizzle-orm';
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
    createTestDocuments,
} from './test-utils';

describe('Dashboard Integration Tests', () => {
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

    describe('Document Summary', () => {
        it('should count documents by type', async () => {
            // Setup
            const tenant = await createTestTenant(db);
            const company = await createTestCompany(db, tenant.id);

            await createTestDocument(db, tenant.id, company.id, { docType: 'NFE' });
            await createTestDocument(db, tenant.id, company.id, { docType: 'NFE' });
            await createTestDocument(db, tenant.id, company.id, { docType: 'CTE' });
            await createTestDocument(db, tenant.id, company.id, { docType: 'MDFE' });

            // Act
            const summary = await db
                .select({
                    docType: schema.documents.docType,
                    count: count(),
                })
                .from(schema.documents)
                .where(eq(schema.documents.tenantId, tenant.id))
                .groupBy(schema.documents.docType);

            // Assert
            const counts = Object.fromEntries(summary.map(s => [s.docType, Number(s.count)]));
            expect(counts.NFE).toBe(2);
            expect(counts.CTE).toBe(1);
            expect(counts.MDFE).toBe(1);
        });

        it('should calculate total document value', async () => {
            // Setup
            const tenant = await createTestTenant(db);
            const company = await createTestCompany(db, tenant.id);

            await createTestDocument(db, tenant.id, company.id, { valorTotal: '1000.00' });
            await createTestDocument(db, tenant.id, company.id, { valorTotal: '2500.50' });
            await createTestDocument(db, tenant.id, company.id, { valorTotal: '500.00' });

            // Act
            const result = await db
                .select({
                    total: sql<string>`SUM(CAST(${schema.documents.valorTotal} AS DECIMAL(15,2)))`,
                })
                .from(schema.documents)
                .where(eq(schema.documents.tenantId, tenant.id));

            // Assert
            expect(parseFloat(result[0].total)).toBe(4000.50);
        });
    });

    describe('Timeline Queries', () => {
        it('should aggregate documents by emission date', async () => {
            // Setup
            const tenant = await createTestTenant(db);
            const company = await createTestCompany(db, tenant.id);

            await createTestDocument(db, tenant.id, company.id, { dataEmissao: '2024-01-15' });
            await createTestDocument(db, tenant.id, company.id, { dataEmissao: '2024-01-15' });
            await createTestDocument(db, tenant.id, company.id, { dataEmissao: '2024-01-16' });

            // Act
            const timeline = await db
                .select({
                    date: schema.documents.dataEmissao,
                    count: count(),
                })
                .from(schema.documents)
                .where(eq(schema.documents.tenantId, tenant.id))
                .groupBy(schema.documents.dataEmissao)
                .orderBy(schema.documents.dataEmissao);

            // Assert
            expect(timeline).toHaveLength(2);
            expect(Number(timeline[0].count)).toBe(2);
            expect(Number(timeline[1].count)).toBe(1);
        });
    });

    describe('Gap Detection', () => {
        it('should detect gaps in document numbering', async () => {
            // Setup
            const tenant = await createTestTenant(db);
            const company = await createTestCompany(db, tenant.id);

            // Create documents with gap: 1, 2, 5, 6 (missing 3, 4)
            await createTestDocument(db, tenant.id, company.id, { numero: 1, serie: 1 });
            await createTestDocument(db, tenant.id, company.id, { numero: 2, serie: 1 });
            await createTestDocument(db, tenant.id, company.id, { numero: 5, serie: 1 });
            await createTestDocument(db, tenant.id, company.id, { numero: 6, serie: 1 });

            // Act - Query to find gaps
            const docs = await db
                .select({ numero: schema.documents.numero })
                .from(schema.documents)
                .where(eq(schema.documents.tenantId, tenant.id))
                .orderBy(schema.documents.numero);

            const numbers = docs.map(d => d.numero as number);

            // Detect gaps
            const gaps: { from: number; to: number }[] = [];
            for (let i = 0; i < numbers.length - 1; i++) {
                if (numbers[i + 1] - numbers[i] > 1) {
                    gaps.push({
                        from: numbers[i] + 1,
                        to: numbers[i + 1] - 1,
                    });
                }
            }

            // Assert
            expect(gaps).toHaveLength(1);
            expect(gaps[0]).toEqual({ from: 3, to: 4 });
        });
    });

    describe('Recent Documents', () => {
        it('should return most recent documents first', async () => {
            // Setup
            const tenant = await createTestTenant(db);
            const company = await createTestCompany(db, tenant.id);

            await createTestDocument(db, tenant.id, company.id, {
                dataEmissao: '2024-01-01',
                numero: 1
            });
            await createTestDocument(db, tenant.id, company.id, {
                dataEmissao: '2024-01-15',
                numero: 2
            });
            await createTestDocument(db, tenant.id, company.id, {
                dataEmissao: '2024-01-10',
                numero: 3
            });

            // Act
            const recent = await db
                .select()
                .from(schema.documents)
                .where(eq(schema.documents.tenantId, tenant.id))
                .orderBy(sql`${schema.documents.dataEmissao} DESC`)
                .limit(2);

            // Assert
            expect(recent).toHaveLength(2);
            expect(recent[0].numero).toBe(2); // Most recent
            expect(recent[1].numero).toBe(3); // Second most recent
        });
    });
});
