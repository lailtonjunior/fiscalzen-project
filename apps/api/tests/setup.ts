// Test setup file
// Sets up environment variables and mocks for testing

import { vi } from 'vitest';

// Mock environment variables for tests
process.env.NODE_ENV = 'test';
process.env.PORT = '3099';
process.env.HOST = 'localhost';
process.env.LOG_LEVEL = 'error';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/fiscalzen_test';
process.env.REDIS_URL = 'redis://localhost:6379';
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

// Global test utilities
export const TEST_TENANT_ID = '00000000-0000-0000-0000-000000000000';
export const TEST_USER_ID = '00000000-0000-0000-0000-000000000001';

// Clean up after all tests
afterAll(async () => {
  vi.clearAllMocks();
});
