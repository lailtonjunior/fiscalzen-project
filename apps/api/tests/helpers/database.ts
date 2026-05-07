/**
 * Database Helper for Integration Tests
 * 
 * Provides utilities to manage test database state:
 * - Create/drop test schema
 * - Cleanup data between tests
 * - Schema synchronization via Drizzle push
 * 
 * Moved from tests/integration/db-helper.ts
 */

import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
// Import schema from workspace package
import * as schema from '@fiscalzen/database/schema';
import {
    assertSafeTestDatabaseUrl,
    describeTestDatabaseTarget,
    getTestDatabaseUrl,
    setupIntegrationEnvironment,
    TEST_SCHEMA_NAME,
    TEST_SCHEMA_READY_TABLE,
} from '../integration/setup.integration';

export type TestDb = PostgresJsDatabase<typeof schema>;

let _db: TestDb | null = null;
let _client: ReturnType<typeof postgres> | null = null;

function resolveTestDatabaseUrl() {
    setupIntegrationEnvironment();
    const databaseUrl = getTestDatabaseUrl();
    assertSafeTestDatabaseUrl(databaseUrl);
    return databaseUrl;
}

// Create a test database client (singleton)
export function createTestClient(): TestDb {
    if (_db) return _db;

    const testDatabaseUrl = resolveTestDatabaseUrl();

    _client = postgres(testDatabaseUrl, {
        max: 5,
        idle_timeout: 10,
        connect_timeout: 10,
        onnotice: () => {},
    });
    _db = drizzle(_client, { schema });
    return _db;
}

// Close the test database connection
export async function closeTestClient() {
    if (_client) {
        await _client.end();
        _client = null;
        _db = null;
    }
}

// Table cleanup order (respecting FK constraints)
const CLEANUP_ORDER = [
    'document_events',
    'document_relations',
    'document_tags',
    'tags',
    'comments',
    'alerts',
    'audit_logs',
    'nsu_control',
    'nfse_configs',
    'webhooks',
    'webhook_logs',
    'agents',
    'monitor_jobs',
    'documents',
    'companies',
    'tenants',
];

/**
 * Cleanup all data from the test database
 * Truncates tables in correct order respecting FK constraints
 */
export async function cleanupDatabase(db: TestDb) {
    resolveTestDatabaseUrl();

    for (const table of CLEANUP_ORDER) {
        try {
            await db.execute(sql.raw(`TRUNCATE TABLE "${table}" CASCADE`));
        } catch {
            // Table might not exist yet, ignore
        }
    }
}

/**
 * Check if schema tables exist
 */
export async function schemaExists(db: TestDb): Promise<boolean> {
    const result = await db.execute(sql`
        SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = ${TEST_SCHEMA_NAME}
            AND table_name = ${TEST_SCHEMA_READY_TABLE}
        ) as exists
    `);

    return (result[0] as { exists: boolean }).exists;
}

export async function assertDatabaseConnection(db: TestDb) {
    await db.execute(sql`SELECT 1`);
}

/**
 * Setup test database with fresh schema
 * Call this in beforeAll of your test suite
 */
export async function setupTestDatabase(): Promise<TestDb> {
    const db = createTestClient();

    // Check if schema exists
    const hasSchema = await schemaExists(db);

    if (!hasSchema) {
        const databaseUrl = getTestDatabaseUrl();
        throw new Error(
            [
                'Integration test database schema not initialized.',
                `Checked ${describeTestDatabaseTarget(databaseUrl)}.`,
                'Run pnpm db:push:test before pnpm --filter @fiscalzen/api test:integration.',
            ].join(' ')
        );
    }

    // Clean any existing data
    await cleanupDatabase(db);

    return db;
}

/**
 * Teardown test database connection
 * Call this in afterAll of your test suite
 */
export async function teardownTestDatabase() {
    await closeTestClient();
}

// Helper to create test user
// Note: We don't have a users table in the DB (managed by external Auth/Clerk)
// This helper returns a mock user object useful for auth simulation
export function createTestUser(overrides: Record<string, any> = {}) {
    return {
        id: crypto.randomUUID(),
        email: 'test@fiscalzen.com.br',
        firstName: 'Test',
        lastName: 'User',
        ...overrides,
    };
}

// Helper to create test company (Tenant)
export async function createTestCompany(db: TestDb, overrides?: any) {
    const tenantId = crypto.randomUUID();

    // Create Tenant first
    const [tenant] = await db.insert(schema.tenants).values({
        id: tenantId,
        name: 'Test Tenant',
        cnpj: '12345678000199', // Tenant might have CNPJ too
        plan: 'starter',
    }).returning();

    // Create Company
    const [company] = await db.insert(schema.companies).values({
        tenantId: tenant.id,
        razaoSocial: 'FiscalZen Tecnologia',
        cnpj: '12345678000199',
        uf: 'SP',
        ambiente: '2', // Homologacao
        ...overrides,
    }).returning();

    return { tenant, company };
}

export { schema };
