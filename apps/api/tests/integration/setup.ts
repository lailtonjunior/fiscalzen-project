/**
 * Integration Test Setup
 * 
 * Global setup for integration tests with real PostgreSQL database.
 * Uses isolated test database on port 55434.
 */

import 'reflect-metadata';
import { afterAll, vi } from 'vitest';
import {
    setupIntegrationEnvironment,
    TEST_COMPANY_ID,
    TEST_TENANT_ID,
    TEST_USER_ID,
} from './setup.integration';

setupIntegrationEnvironment();

// Cleanup after all tests
import {
    closeTestClient,
    setupTestDatabase,
    cleanupDatabase,
    createTestClient,
} from '../helpers/database';
import { sefazServer } from '../mocks/sefaz';
import { beforeAll, afterEach } from 'vitest';

export { TEST_COMPANY_ID, TEST_TENANT_ID, TEST_USER_ID };

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
    await closeTestClient();
    vi.clearAllMocks();
});
