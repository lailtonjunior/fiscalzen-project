import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

// ============================================
// Environment Variables Schema
// ============================================

const envSchema = z.object({
  // ===========================================
  // Server Configuration
  // ===========================================
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  // ===========================================
  // Database
  // ===========================================
  DATABASE_URL: z.string().url('DATABASE_URL deve ser uma URL válida'),

  // ===========================================
  // Redis
  // ===========================================
  REDIS_URL: z.string().url().default('redis://localhost:6379'),

  // ===========================================
  // JWT / Authentication
  // ===========================================
  JWT_SECRET: z.string().min(32, 'JWT_SECRET deve ter pelo menos 32 caracteres'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // ===========================================
  // S3/MinIO Storage
  // ===========================================
  S3_ENDPOINT: z.string().url().default('http://localhost:9000'),
  S3_ACCESS_KEY: z.string().min(1, 'S3_ACCESS_KEY é obrigatório'),
  S3_SECRET_KEY: z.string().min(1, 'S3_SECRET_KEY é obrigatório'),
  S3_BUCKET: z.string().default('fiscalzen-docs'),
  S3_REGION: z.string().default('us-east-1'),

  // ===========================================
  // Meilisearch
  // ===========================================
  MEILISEARCH_URL: z.preprocess(
    (value) => value || process.env.MEILISEARCH_HOST || 'http://localhost:7700',
    z.string().url()
  ),
  MEILISEARCH_HOST: z.string().url().optional(),
  MEILISEARCH_API_KEY: z.preprocess(
    (value) => value === '' ? undefined : value,
    z.string().optional()
  ),

  // ===========================================
  // Rate Limiting
  // ===========================================
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),

  // ===========================================
  // CORS
  // ===========================================
  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  // ===========================================
  // SEFAZ Configuration
  // ===========================================
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

  // ===========================================
  // Feature Flags
  // ===========================================
  ENABLE_NFSE_RPA: z
    .string()
    .transform((v) => v === 'true' || v === '1')
    .default('false'),
  ENABLE_SEFAZ_MONITOR: z
    .string()
    .transform((v) => v === 'true' || v === '1')
    .default('true'),
  ENABLE_SWAGGER: z
    .string()
    .transform((v) => v === 'true' || v === '1')
    .default('false'),
  ENABLE_TRACING: z
    .string()
    .transform((v) => v === 'true' || v === '1')
    .default('false'),
  JAEGER_ENDPOINT: z.preprocess(
    (value) => value === '' ? undefined : value,
    z.string().url().optional()
  ),
  DISABLE_AUTH: z
    .string()
    .transform((v) => v === 'true' || v === '1')
    .default('false'),
  DEV_TENANT_ID: z
    .string()
    .uuid()
    .default('00000000-0000-0000-0000-000000000000'),
  DEV_USER_ID: z
    .string()
    .uuid()
    .default('00000000-0000-0000-0000-000000000001'),
  DEV_USER_EMAIL: z
    .string()
    .email()
    .default('dev@local.test'),

  // ===========================================
  // Agent WebSocket (opcional)
  // ===========================================
  AGENT_WS_PORT: z.coerce.number().optional(),
  AGENT_TOKEN_SECRET: z.string().optional(),
});

// ============================================
// Parse and Validate
// ============================================

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('\n❌ Variáveis de ambiente inválidas:\n');

  const errors = parsed.error.flatten().fieldErrors;

  Object.entries(errors).forEach(([field, messages]) => {
    console.error(`  ${field}:`);
    messages?.forEach((msg) => console.error(`    - ${msg}`));
  });

  console.error('\n💡 Dica: Copie apps/api/.env.example para apps/api/.env');
  console.error('   e preencha os valores necessários.\n');
  console.error('   Para gerar secrets: node scripts/generate-secrets.js\n');

  process.exit(1);
}

export const env = parsed.data;

export type Env = z.infer<typeof envSchema>;
