/**
 * Test Utilities and Factories
 * 
 * Provides factory functions to create test data
 * that respects all database constraints and relationships.
 * 
 * Note: Only uses columns that exist in the current migrations.
 */

import { createTestClient, schema } from './db-helper';
import { TEST_TENANT_ID, TEST_COMPANY_ID } from './setup.integration';

type TestDb = ReturnType<typeof createTestClient>;

/**
 * Create a test tenant
 */
export async function createTestTenant(
    db: TestDb,
    overrides: Partial<typeof schema.tenants.$inferInsert> = {}
) {
    const tenant = {
        id: TEST_TENANT_ID,
        name: 'Test Tenant',
        plan: 'starter',
        active: true,
        settings: {},
        ...overrides,
    };

    const [result] = await db.insert(schema.tenants).values(tenant).returning();
    return result;
}

/**
 * Create a test company
 * Only uses columns that exist in migrations (without ambiente, certificate fields)
 */
export async function createTestCompany(
    db: TestDb,
    tenantId: string = TEST_TENANT_ID,
    overrides: Partial<typeof schema.companies.$inferInsert> = {}
) {
    const company = {
        id: TEST_COMPANY_ID,
        tenantId,
        cnpj: '12345678000100',
        razaoSocial: 'Test Company LTDA',
        nomeFantasia: 'Test Company',
        uf: 'SP',
        active: true,
        settings: {},
        ...overrides,
    };

    const [result] = await db.insert(schema.companies).values(company).returning();
    return result;
}

/**
 * Create a test document
 */
export async function createTestDocument(
    db: TestDb,
    tenantId: string = TEST_TENANT_ID,
    companyId: string = TEST_COMPANY_ID,
    overrides: Partial<typeof schema.documents.$inferInsert> = {}
) {
    // Generate a proper 44-character chave (NFe access key format)
    const randomPart = Math.random().toString().slice(2, 20).padEnd(18, '0');
    const chave = `35241234567890001234550010000${randomPart}`.slice(0, 44);

    const document = {
        tenantId,
        companyId,
        docType: 'NFE' as const,
        chave,
        numero: Math.floor(Math.random() * 100000),
        serie: 1,
        emitCnpj: '12345678000100',
        emitRazao: 'Emitente Test LTDA',
        destCnpjCpf: '98765432000199',
        destRazao: 'Destinatario Test LTDA',
        valorTotal: '1000.00',
        dataEmissao: new Date().toISOString().split('T')[0],
        situacao: 'autorizada' as const,
        metadata: {},
        ...overrides,
    };

    const [result] = await db.insert(schema.documents).values(document).returning();
    return result;
}

/**
 * Create multiple test documents
 */
export async function createTestDocuments(
    db: TestDb,
    count: number,
    tenantId: string = TEST_TENANT_ID,
    companyId: string = TEST_COMPANY_ID
) {
    const documents = [];
    for (let i = 0; i < count; i++) {
        // Generate unique 44-char chave for each document
        const seq = (i + 1).toString().padStart(9, '0');
        const chave = `35241234567890001234550010000${seq}00000`.slice(0, 44);

        const doc = await createTestDocument(db, tenantId, companyId, {
            numero: i + 1,
            chave,
        });
        documents.push(doc);
    }
    return documents;
}

/**
 * Create a complete test scenario with tenant, company, and documents
 */
export async function createTestScenario(db: TestDb) {
    const tenant = await createTestTenant(db);
    const company = await createTestCompany(db, tenant.id);
    const documents = await createTestDocuments(db, 5, tenant.id, company.id);

    return { tenant, company, documents };
}
