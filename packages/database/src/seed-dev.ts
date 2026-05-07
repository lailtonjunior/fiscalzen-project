import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { tenants } from './schema/index';

const DEFAULT_DEV_TENANT_ID = '00000000-0000-0000-0000-000000000000';
const DEFAULT_DEV_USER_ID = '00000000-0000-0000-0000-000000000001';
const DEFAULT_DEV_USER_EMAIL = 'dev@local.test';

function hasExplicitDevPermission() {
  return (
    process.env.NODE_ENV === 'development' ||
    process.env.ALLOW_DEV_SEED === 'true' ||
    process.argv.includes('--allow-dev')
  );
}

function assertSafeDevDatabaseUrl(databaseUrl: string) {
  const parsedUrl = new URL(databaseUrl);
  const databaseName = parsedUrl.pathname.replace(/^\/+/, '');
  const isLocalHost =
    parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1';
  const isTestDatabase = /(^|[_-])test([_-]|$)/i.test(databaseName);
  const isTestPort = parsedUrl.port === '55434';
  const looksProduction =
    /prod|production/i.test(databaseName) ||
    /prod|production/i.test(parsedUrl.hostname);

  if (!isLocalHost || isTestDatabase || isTestPort || looksProduction) {
    throw new Error(
      [
        'Refusing to seed an unsafe development database URL.',
        'Expected a local development PostgreSQL database, not production or test.',
        `Resolved target: host=${parsedUrl.hostname} port=${parsedUrl.port || '(default)'} database=${databaseName}`,
      ].join(' ')
    );
  }
}

async function seedDev() {
  if (!hasExplicitDevPermission()) {
    throw new Error(
      'Refusing to run dev seed without NODE_ENV=development, ALLOW_DEV_SEED=true, or --allow-dev.'
    );
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required for seed:dev.');
  }

  assertSafeDevDatabaseUrl(databaseUrl);

  const devTenantId = process.env.DEV_TENANT_ID ?? DEFAULT_DEV_TENANT_ID;
  const devUserId = process.env.DEV_USER_ID ?? DEFAULT_DEV_USER_ID;
  const devUserEmail = process.env.DEV_USER_EMAIL ?? DEFAULT_DEV_USER_EMAIL;

  const client = postgres(databaseUrl, { max: 1 });
  const db = drizzle(client);

  try {
    const [tenant] = await db
      .insert(tenants)
      .values({
        id: devTenantId,
        name: 'FiscalZen Demo',
        cnpj: null,
        plan: 'development',
        active: true,
        settings: {
          environment: 'development',
          seededBy: 'pnpm seed:dev',
          disableAuthTenant: true,
          devUserId,
          devUserEmail,
        },
      })
      .onConflictDoUpdate({
        target: tenants.id,
        set: {
          name: 'FiscalZen Demo',
          plan: 'development',
          active: true,
          updatedAt: new Date(),
          settings: {
            environment: 'development',
            seededBy: 'pnpm seed:dev',
            disableAuthTenant: true,
            devUserId,
            devUserEmail,
          },
        },
      })
      .returning();

    console.log('Development seed completed.');
    console.log(`tenant_id=${tenant.id}`);
    console.log(`tenant_name=${tenant.name}`);
    console.log(`dev_user_id=${devUserId}`);
    console.log(`dev_user_email=${devUserEmail}`);
  } finally {
    await client.end();
  }
}

seedDev().catch((err) => {
  console.error('Development seed failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
