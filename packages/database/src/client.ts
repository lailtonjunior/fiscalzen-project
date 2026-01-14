import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index.js';

const connectionString = process.env.DATABASE_URL || 'postgresql://fiscalzen:fiscalzen_dev@localhost:5432/fiscalzen';

export function createClient(url?: string) {
  const client = postgres(url || connectionString);
  return drizzle(client, { schema });
}

export const db = createClient();
