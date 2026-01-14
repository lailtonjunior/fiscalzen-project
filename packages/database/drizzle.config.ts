import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://fiscalzen:fiscalzen_dev@localhost:5432/fiscalzen',
  },
  verbose: true,
  strict: true,
});
