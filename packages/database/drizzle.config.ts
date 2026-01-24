import 'dotenv/config';
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/schema/index.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL || 'postgresql://fiscalzen:fiscalzen_dev@localhost:5432/fiscalzen',
  },
  verbose: true,
  strict: true,
} satisfies Config;
