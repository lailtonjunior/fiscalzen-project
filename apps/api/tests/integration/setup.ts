/**
 * Integration Test Setup
 * 
 * Global setup for integration tests with real PostgreSQL database.
 * Uses isolated test database on port 5434.
 */

import 'reflect-metadata';
import { afterAll, vi } from 'vitest';
import { closeTestClient } from '../helpers/database';

// Test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3098';
process.env.HOST = 'localhost';
process.env.LOG_LEVEL = 'error';

// Test database (port 5434, different from dev 5432)
process.env.DATABASE_URL = 'postgresql://fiscalzen_test:fiscalzen_test@localhost:5434/fiscalzen_test';

// Test Redis (port 6380, different from dev 6379)
process.env.REDIS_URL = 'redis://localhost:6380';

// Other test config
process.env.JWT_SECRET = 'test-jwt-secret-must-be-at-least-32-chars-long';
process.env.JWT_EXPIRES_IN = '1d';
process.env.S3_ENDPOINT = 'http://localhost:9000';
process.env.S3_ACCESS_KEY = 'test-access-key';
process.env.S3_SECRET_KEY = 'test-secret-key';
process.env.S3_BUCKET = 'fiscalzen-test';
process.env.S3_REGION = 'us-east-1';
process.env.MEILISEARCH_URL = 'http://localhost:7700';
process.env.SEFAZ_AMBIENTE = 'homologacao';
process.env.CERT_ENCRYPTION_KEY = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
process.env.DISABLE_AUTH = 'true';

// Global test constants
export const TEST_TENANT_ID = '11111111-1111-1111-1111-111111111111';
export const TEST_USER_ID = '22222222-2222-2222-2222-222222222222';
export const TEST_COMPANY_ID = '33333333-3333-3333-3333-333333333333';

// Cleanup after all tests
import { setupTestDatabase, cleanupDatabase, createTestClient } from '../helpers/database';
import { sefazServer } from '../mocks/sefaz';
import { beforeAll, afterEach } from 'vitest';

beforeAll(async () => {
    // Start MSW
    sefazServer.listen();

    // Setup DB
    await setupTestDatabase();
});

afterEach(async () => {
    // Reset handlers
    sefazServer.resetHandlers();

    // Reset DB data
    const db = createTestClient();
    await cleanupDatabase(db);
});
afterAll(async () => {
    sefazServer.close();
    vi.clearAllMocks();
});
