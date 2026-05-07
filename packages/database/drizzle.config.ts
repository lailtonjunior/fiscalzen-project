import 'dotenv/config';
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://fiscalzen:fiscalzen@localhost:55432/fiscalzen',
  },
  verbose: true,
  strict: true,
} satisfies Config;
