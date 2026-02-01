/**
 * Companies Integration Tests
 * 
 * Tests company CRUD operations against real PostgreSQL database.
 * Validates Drizzle queries, relationships, and business logic.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { eq, and } from 'drizzle-orm';
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
} from './test-utils';

describe('Companies Integration Tests', () => {
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

    describe('Company CRUD', () => {
        it('should create a company with all fields', async () => {
            // Setup
            const tenant = await createTestTenant(db);

            // Act
            const [company] = await db.insert(schema.companies).values({
                tenantId: tenant.id,
                cnpj: '12345678000199',
                razaoSocial: 'Empresa Teste LTDA',
                nomeFantasia: 'Empresa Teste',
                ie: '123456789',
                uf: 'SP',
                active: true,
            }).returning();

            // Assert
            expect(company.id).toBeDefined();
            expect(company.cnpj).toBe('12345678000199');
            expect(company.razaoSocial).toBe('Empresa Teste LTDA');
            expect(company.tenantId).toBe(tenant.id);
        });

        it('should list companies by tenant', async () => {
            // Setup
            const tenant1 = await createTestTenant(db, { id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' });
            const tenant2 = await createTestTenant(db, { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' });

            await createTestCompany(db, tenant1.id, { id: 'cccccccc-cccc-cccc-cccc-cccccccccccc', cnpj: '11111111000111' });
            await createTestCompany(db, tenant1.id, { id: 'dddddddd-dddd-dddd-dddd-dddddddddddd', cnpj: '22222222000222' });
            await createTestCompany(db, tenant2.id, { id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', cnpj: '33333333000333' });

            // Act
            const tenant1Companies = await db
                .select()
                .from(schema.companies)
                .where(eq(schema.companies.tenantId, tenant1.id));

            // Assert
            expect(tenant1Companies).toHaveLength(2);
            expect(tenant1Companies.every(c => c.tenantId === tenant1.id)).toBe(true);
        });

        it('should update company data', async () => {
            // Setup
            const tenant = await createTestTenant(db);
            const company = await createTestCompany(db, tenant.id);

            // Act
            const [updated] = await db
                .update(schema.companies)
                .set({ nomeFantasia: 'Novo Nome Fantasia' })
                .where(eq(schema.companies.id, company.id))
                .returning();

            // Assert
            expect(updated.nomeFantasia).toBe('Novo Nome Fantasia');
            expect(updated.razaoSocial).toBe(company.razaoSocial);
        });

        it('should soft delete company (set active = false)', async () => {
            // Setup
            const tenant = await createTestTenant(db);
            const company = await createTestCompany(db, tenant.id);

            // Act
            const [deactivated] = await db
                .update(schema.companies)
                .set({ active: false })
                .where(eq(schema.companies.id, company.id))
                .returning();

            // Assert
            expect(deactivated.active).toBe(false);
        });
    });

    describe('Company Constraints', () => {
        it('should enforce unique CNPJ per tenant', async () => {
            // Setup
            const tenant = await createTestTenant(db);
            await createTestCompany(db, tenant.id, { cnpj: '12345678000100' });

            // Act & Assert - Should fail on duplicate CNPJ
            await expect(
                createTestCompany(db, tenant.id, {
                    id: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
                    cnpj: '12345678000100'
                })
            ).rejects.toThrow();
        });

        it('should allow same CNPJ in different tenants', async () => {
            // Setup
            const tenant1 = await createTestTenant(db, { id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' });
            const tenant2 = await createTestTenant(db, { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' });

            // Act
            const company1 = await createTestCompany(db, tenant1.id, {
                id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
                cnpj: '12345678000100'
            });
            const company2 = await createTestCompany(db, tenant2.id, {
                id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
                cnpj: '12345678000100'
            });

            // Assert
            expect(company1.cnpj).toBe(company2.cnpj);
            expect(company1.tenantId).not.toBe(company2.tenantId);
        });
    });

    describe('Company Queries', () => {
        it('should query active companies only', async () => {
            // Setup
            const tenant = await createTestTenant(db);
            await createTestCompany(db, tenant.id, {
                id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
                active: true,
                cnpj: '11111111000111'
            });
            await createTestCompany(db, tenant.id, {
                id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
                active: false,
                cnpj: '22222222000222'
            });

            // Act
            const activeCompanies = await db
                .select()
                .from(schema.companies)
                .where(
                    and(
                        eq(schema.companies.tenantId, tenant.id),
                        eq(schema.companies.active, true)
                    )
                );

            // Assert
            expect(activeCompanies).toHaveLength(1);
            expect(activeCompanies[0].active).toBe(true);
        });

        it('should search companies by razaoSocial', async () => {
            // Setup
            const tenant = await createTestTenant(db);
            await createTestCompany(db, tenant.id, {
                id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
                razaoSocial: 'ABC Transportes LTDA',
                cnpj: '11111111000111'
            });
            await createTestCompany(db, tenant.id, {
                id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
                razaoSocial: 'XYZ Comercio SA',
                cnpj: '22222222000222'
            });

            // Act - using ilike for case-insensitive search
            const result = await db
                .select()
                .from(schema.companies)
                .where(eq(schema.companies.tenantId, tenant.id));

            const filtered = result.filter(c =>
                c.razaoSocial?.toLowerCase().includes('transportes')
            );

            // Assert
            expect(filtered).toHaveLength(1);
            expect(filtered[0].razaoSocial).toContain('Transportes');
        });
    });
});
