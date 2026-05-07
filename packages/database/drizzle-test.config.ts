import 'dotenv/config';
import type { Config } from 'drizzle-kit';

const testDatabaseUrl =
  process.env.DATABASE_URL_TEST ||
  process.env.TEST_DATABASE_URL;

if (!testDatabaseUrl) {
  throw new Error(
    'DATABASE_URL_TEST ou TEST_DATABASE_URL nao configurado para drizzle-test.config.ts'
  );
}

function assertSafeTestDatabaseUrl(url: string) {
  const parsedUrl = new URL(url);
  const databaseName = parsedUrl.pathname.replace(/^\/+/, '');
  const isLocalHost =
    parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1';
  const isTestPort = parsedUrl.port === '55434';
  const isTestDatabase = /(^|[_-])test([_-]|$)/i.test(databaseName);

  if (!isLocalHost || !isTestPort || !isTestDatabase) {
    throw new Error(
      [
        'Refusing to push schema to an unsafe database URL.',
        'Expected a local PostgreSQL test database on localhost:55434 with a database name marked as test.',
        `Resolved URL: ${url}`,
      ].join(' ')
    );
  }
}

assertSafeTestDatabaseUrl(testDatabaseUrl);

export default {
  schema: './src/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: testDatabaseUrl,
  },
  verbose: true,
  strict: true,
} satisfies Config;
