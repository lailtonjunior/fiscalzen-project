/**
 * Database Helper for Integration Tests
 * 
 * Provides utilities to manage test database state:
 * - Create/drop test schema
 * - Cleanup data between tests
 * - Schema synchronization via Drizzle push
 */

import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
// Import schema from workspace package
import * as schema from '@fiscalzen/database/schema';

const TEST_DATABASE_URL = process.env.DATABASE_URL ||
    'postgresql://fiscalzen_test:fiscalzen_test@localhost:5434/fiscalzen_test';

type DrizzleDb = PostgresJsDatabase<typeof schema>;

let _db: DrizzleDb | null = null;
let _client: ReturnType<typeof postgres> | null = null;

// Create a test database client (singleton)
export function createTestClient(): DrizzleDb {
    if (_db) return _db;

    _client = postgres(TEST_DATABASE_URL, {
        max: 5,
        idle_timeout: 10,
        connect_timeout: 10,
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
export async function cleanupDatabase(db: DrizzleDb) {
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
export async function schemaExists(db: DrizzleDb): Promise<boolean> {
    try {
        const result = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'tenants'
      ) as exists
    `);
        return (result[0] as { exists: boolean }).exists;
    } catch {
        return false;
    }
}

/**
 * Setup test database with fresh schema
 * Call this in beforeAll of your test suite
 */
export async function setupTestDatabase(): Promise<DrizzleDb> {
    const db = createTestClient();

    // Check if schema exists
    const hasSchema = await schemaExists(db);

    if (!hasSchema) {
        console.log('⚠️  Test database schema not found!');
        console.log('   Run this command first:');
        console.log('   $env:DATABASE_URL="postgresql://fiscalzen_test:fiscalzen_test@localhost:5434/fiscalzen_test"; cd packages\\database; npx drizzle-kit push:pg');
        throw new Error('Test database schema not initialized. Run drizzle-kit push:pg first.');
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

export { schema };
