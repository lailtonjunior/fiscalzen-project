import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';

const TEST_DATABASE_DEFAULT =
  'postgresql://fiscalzen_test:fiscalzen_test@localhost:55434/fiscalzen_test';
const TEST_REDIS_DEFAULT = 'redis://localhost:56380';
export const TEST_SCHEMA_NAME = 'public';
export const TEST_SCHEMA_READY_TABLE = 'tenants';

function loadIntegrationEnvFile() {
  const candidates = [
    resolve(process.cwd(), '.env.test'),
    resolve(process.cwd(), '../../.env.test'),
  ];

  for (const file of candidates) {
    if (existsSync(file)) {
      loadEnv({ path: file, override: false });
    }
  }
}

export function getTestDatabaseUrl() {
  return (
    process.env.DATABASE_URL_TEST ||
    process.env.TEST_DATABASE_URL ||
    TEST_DATABASE_DEFAULT
  );
}

export function describeTestDatabaseTarget(url: string) {
  const parsedUrl = new URL(url);

  return [
    `host=${parsedUrl.hostname}`,
    `port=${parsedUrl.port}`,
    `database=${parsedUrl.pathname.replace(/^\/+/, '')}`,
    `schema=${TEST_SCHEMA_NAME}`,
    `table=${TEST_SCHEMA_READY_TABLE}`,
  ].join(' ');
}

export function assertSafeTestDatabaseUrl(url: string) {
  const parsedUrl = new URL(url);
  const databaseName = parsedUrl.pathname.replace(/^\/+/, '');
  const isLocalHost =
    parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1';
  const isTestPort = parsedUrl.port === '55434';
  const isTestDatabase = /(^|[_-])test([_-]|$)/i.test(databaseName);

  if (!isLocalHost || !isTestPort || !isTestDatabase) {
    throw new Error(
      [
        'Unsafe integration test database URL detected.',
        'Expected a local PostgreSQL test database on localhost:55434 with a database name marked as test.',
        `Resolved URL: ${url}`,
        'Set DATABASE_URL_TEST or TEST_DATABASE_URL to a dedicated test database such as fiscalzen_test.',
      ].join(' ')
    );
  }
}

export function setupIntegrationEnvironment() {
  loadIntegrationEnvFile();

  process.env.NODE_ENV = 'test';
  process.env.PORT = process.env.PORT || '3098';
  process.env.HOST = process.env.HOST || 'localhost';
  process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'error';

  const databaseUrl = getTestDatabaseUrl();
  assertSafeTestDatabaseUrl(databaseUrl);
  process.env.DATABASE_URL = databaseUrl;
  process.env.DATABASE_URL_TEST = databaseUrl;
  process.env.TEST_DATABASE_URL = databaseUrl;

  process.env.REDIS_URL = process.env.REDIS_URL || TEST_REDIS_DEFAULT;
  process.env.JWT_SECRET =
    process.env.JWT_SECRET || 'test-jwt-secret-must-be-at-least-32-chars-long';
  process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';
  process.env.S3_ENDPOINT = process.env.S3_ENDPOINT || 'http://localhost:9000';
  process.env.S3_ACCESS_KEY = process.env.S3_ACCESS_KEY || 'test-access-key';
  process.env.S3_SECRET_KEY = process.env.S3_SECRET_KEY || 'test-secret-key';
  process.env.S3_BUCKET = process.env.S3_BUCKET || 'fiscalzen-test';
  process.env.S3_REGION = process.env.S3_REGION || 'us-east-1';
  process.env.MEILISEARCH_URL =
    process.env.MEILISEARCH_URL || process.env.MEILISEARCH_HOST || 'http://localhost:7700';
  process.env.SEFAZ_AMBIENTE = process.env.SEFAZ_AMBIENTE || 'homologacao';
  process.env.CERT_ENCRYPTION_KEY =
    process.env.CERT_ENCRYPTION_KEY ||
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

  return {
    databaseUrl,
    redisUrl: process.env.REDIS_URL,
  };
}

export const TEST_TENANT_ID = '11111111-1111-1111-1111-111111111111';
export const TEST_USER_ID = '22222222-2222-2222-2222-222222222222';
export const TEST_COMPANY_ID = '33333333-3333-3333-3333-333333333333';
