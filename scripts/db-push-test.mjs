import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function loadDotEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return;
  }

  const content = readFileSync(filePath, 'utf8');

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separator = trimmed.indexOf('=');
    if (separator === -1) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '');

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

const rootDir = resolve(process.cwd());
loadDotEnvFile(resolve(rootDir, '.env.test'));

const testDatabaseUrl =
  process.env.DATABASE_URL_TEST ||
  process.env.TEST_DATABASE_URL ||
  'postgresql://fiscalzen_test:fiscalzen_test@localhost:55434/fiscalzen_test';
const schemaReadyTable = 'tenants';

function formatDatabaseTarget(url) {
  const parsedUrl = new URL(url);

  return [
    `host=${parsedUrl.hostname}`,
    `port=${parsedUrl.port}`,
    `database=${parsedUrl.pathname.replace(/^\/+/, '')}`,
    'schema=public',
    `table=${schemaReadyTable}`,
  ].join(' ');
}

function assertSafeTestDatabaseUrl(url) {
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

try {
  assertSafeTestDatabaseUrl(testDatabaseUrl);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

const result = spawnSync(
  'pnpm',
  [
    '--filter',
    '@fiscalzen/database',
    'db:push:test',
  ],
  {
    cwd: rootDir,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: {
      ...process.env,
      DATABASE_URL_TEST: testDatabaseUrl,
      TEST_DATABASE_URL: testDatabaseUrl,
      NODE_ENV: 'test',
    },
  }
);

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

const verifySchemaCode = `
import postgres from 'postgres';

const databaseUrl = process.env.DATABASE_URL_TEST || process.env.TEST_DATABASE_URL;
const tableName = process.env.TEST_SCHEMA_READY_TABLE || 'tenants';

if (!databaseUrl) {
  throw new Error('DATABASE_URL_TEST ou TEST_DATABASE_URL nao configurado para verificacao do schema de teste');
}

const db = postgres(databaseUrl, {
  max: 1,
  idle_timeout: 1,
  connect_timeout: 5,
  onnotice: () => {},
});

try {
  const rows = await db\`
    SELECT table_schema, table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = \${tableName}
  \`;

  if (rows.length === 0) {
    throw new Error(\`Schema de teste nao inicializado: tabela public.\${tableName} nao encontrada\`);
  }
} finally {
  await db.end();
}
`;

const verifyResult = spawnSync(
  process.execPath,
  ['--input-type=module', '--eval', verifySchemaCode],
  {
    cwd: resolve(rootDir, 'apps/api'),
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL_TEST: testDatabaseUrl,
      TEST_DATABASE_URL: testDatabaseUrl,
      TEST_SCHEMA_READY_TABLE: schemaReadyTable,
      NODE_ENV: 'test',
    },
  }
);

if (verifyResult.error) {
  console.error(verifyResult.error.message);
  process.exit(1);
}

if (verifyResult.status !== 0) {
  console.error(`Test database schema verification failed (${formatDatabaseTarget(testDatabaseUrl)}).`);
  process.exit(verifyResult.status ?? 1);
}

console.log(`Test database schema verified (${formatDatabaseTarget(testDatabaseUrl)}).`);
process.exit(0);
