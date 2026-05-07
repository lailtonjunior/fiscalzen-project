import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index';

const connectionString = process.env.DATABASE_URL || 'postgresql://fiscalzen:fiscalzen@localhost:55432/fiscalzen';

export function createClient(url?: string) {
  const client = postgres(url || connectionString);
  return drizzle(client, { schema });
}

export const db = createClient();
