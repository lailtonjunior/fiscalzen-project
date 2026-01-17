import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  // Database
  DATABASE_URL: z.string().url(),

  // Redis
  REDIS_URL: z.string().url().default('redis://localhost:6379'),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // S3/MinIO
  S3_ENDPOINT: z.string().url().default('http://localhost:9000'),
  S3_ACCESS_KEY: z.string(),
  S3_SECRET_KEY: z.string(),
  S3_BUCKET: z.string().default('fiscalzen'),
  S3_REGION: z.string().default('us-east-1'),

  // Meilisearch
  MEILISEARCH_URL: z.string().url().default('http://localhost:7700'),
  MEILISEARCH_API_KEY: z.string().optional(),

  // Rate Limiting
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  // SEFAZ
  SEFAZ_AMBIENTE: z.enum(['producao', 'homologacao']).default('homologacao'),

  // ===========================================
  // Certificate encryption (A1 PFX)
  // 32 bytes key required (base64 -> 32 bytes OR hex 64 chars)
  // ===========================================
  CERT_ENCRYPTION_KEY: z
    .string()
    .min(1, 'CERT_ENCRYPTION_KEY é obrigatório')
    .refine((v) => {
      // Accept HEX(64) or BASE64(32 bytes)
      const isHex = /^[0-9a-fA-F]{64}$/.test(v);
      if (isHex) return true;
      try {
        const buf = Buffer.from(v, 'base64');
        return buf.length === 32;
      } catch {
        return false;
      }
    }, 'CERT_ENCRYPTION_KEY deve ser 32 bytes (base64) ou 64 chars hex'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:');
  console.error(parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;

export type Env = z.infer<typeof envSchema>;
