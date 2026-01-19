---
status: filled
generated: 2026-01-18
---

# Security & Compliance Notes

Políticas e práticas de segurança do FiscalZen.

## Authentication & Authorization

### JWT Authentication

O sistema utiliza JSON Web Tokens (JWT) para autenticação stateless.

**Configuração**:
```env
JWT_SECRET=<min-32-caracteres>
JWT_EXPIRES_IN=1d
```

**Payload do Token**:
```typescript
interface JwtPayload {
  userId: string;
  tenantId: string;
  email: string;
  iat: number;  // Issued at
  exp: number;  // Expiration
}
```

**Fluxo de Autenticação**:
1. Usuário envia credenciais para `/api/auth/login`
2. API valida credenciais contra banco de dados
3. Se válido, gera JWT com payload acima
4. Cliente armazena token e envia no header `Authorization: Bearer <token>`
5. Middleware `fastify.authenticate` valida token em cada request

### Authorization Model

**Multi-tenancy**:
- Todo dado é isolado por `tenant_id`
- Token JWT inclui `tenantId` do usuário
- Todas as queries filtram por `tenant_id`

**Extração do Tenant**:
```typescript
// apps/api/src/plugins/auth.ts
export function getTenantId(request: FastifyRequest): string {
  return (request.user as JwtPayload).tenantId;
}
```

**Verificação de Acesso**:
```typescript
// Verifica se company pertence ao tenant do usuário
async function verifyCompanyAccess(tenantId: string, companyId: string) {
  const company = await db.query.companies.findFirst({
    where: and(
      eq(companies.id, companyId),
      eq(companies.tenantId, tenantId)
    ),
  });
  if (!company) throw new NotFoundError('Company not found');
  return company;
}
```

### Route Protection

Todas as rotas da API (exceto `/health` e `/api/auth/*`) requerem autenticação:

```typescript
// apps/api/src/modules/*/routes.ts
export async function companiesRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.authenticate);
  // ... routes
}
```

## Secrets & Sensitive Data

### Variáveis de Ambiente Sensíveis

| Variável | Propósito | Requisitos |
|----------|-----------|------------|
| `JWT_SECRET` | Assinatura de tokens | Mínimo 32 caracteres, aleatório |
| `CERT_ENCRYPTION_KEY` | Criptografia de certificados | 64 caracteres hex (32 bytes) |
| `DATABASE_URL` | Conexão PostgreSQL | Contém credenciais |
| `S3_SECRET_KEY` | Acesso ao storage | Credencial MinIO/S3 |

### Criptografia de Certificados A1

Certificados digitais são criptografados em repouso usando AES-256-GCM.

**Implementação** ([apps/api/src/services/certificate.ts](apps/api/src/services/certificate.ts)):

```typescript
// Criptografia
function encryptCertificate(pfxBuffer: Buffer, password: string): string {
  const key = Buffer.from(process.env.CERT_ENCRYPTION_KEY!, 'hex');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const encrypted = Buffer.concat([
    cipher.update(pfxBuffer),
    cipher.final()
  ]);
  const authTag = cipher.getAuthTag();

  // Formato: iv:authTag:encrypted (base64)
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;
}

// Descriptografia (apenas quando necessário)
function decryptCertificate(encryptedData: string): Buffer {
  const [ivB64, authTagB64, encryptedB64] = encryptedData.split(':');
  const key = Buffer.from(process.env.CERT_ENCRYPTION_KEY!, 'hex');
  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(authTagB64, 'base64');
  const encrypted = Buffer.from(encryptedB64, 'base64');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ]);
}
```

**Armazenamento**:
- Certificado criptografado no campo `certificate` da tabela `companies`
- Senha do certificado nunca é armazenada (informada pelo usuário quando necessário)

### Classificação de Dados

| Classificação | Exemplos | Tratamento |
|---------------|----------|------------|
| **Confidencial** | Certificados A1, senhas | Criptografado, acesso restrito |
| **Sensível** | CNPJ, dados fiscais | Isolamento por tenant |
| **Interno** | Logs, métricas | Sem PII em logs |
| **Público** | Documentação API | Pode ser exposto |

## Data Protection

### Isolamento Multi-tenant

```sql
-- Toda query inclui filtro de tenant
SELECT * FROM documents
WHERE tenant_id = $1    -- Sempre filtrado
AND company_id = $2;

-- Índices compostos para performance
CREATE INDEX idx_documents_tenant_company
ON documents(tenant_id, company_id);
```

### Validação de Input

Todas as entradas são validadas usando Zod:

```typescript
// apps/api/src/modules/companies/schemas.ts
export const createCompanySchema = z.object({
  cnpj: z.string().regex(/^\d{14}$/, 'CNPJ inválido'),
  razaoSocial: z.string().min(3).max(200),
  // ...
});
```

### SQL Injection Prevention

- Uso exclusivo de Drizzle ORM com queries parametrizadas
- Nenhuma concatenação de strings em SQL

### XSS Prevention

- React escapa automaticamente outputs
- Content-Type headers definidos corretamente
- CSP headers configurados no Next.js

## Compliance

### Requisitos Fiscais Brasileiros

| Requisito | Implementação |
|-----------|---------------|
| Armazenamento de XML por 5 anos | Storage S3 com retenção |
| Manifestação em até 180 dias | Dashboard com alertas |
| Certificado A1 válido | Verificação de expiração |

### LGPD (Lei Geral de Proteção de Dados)

- **Minimização**: Apenas dados necessários são coletados
- **Finalidade**: Dados usados apenas para gestão fiscal
- **Segurança**: Criptografia em trânsito (HTTPS) e em repouso
- **Acesso**: Isolamento por tenant

### Auditoria

Tabela `audit_logs` registra ações sensíveis:

```typescript
// packages/database/src/schema/audit.ts
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey(),
  tenantId: uuid('tenant_id').notNull(),
  userId: uuid('user_id'),
  action: varchar('action', { length: 50 }).notNull(),
  entityType: varchar('entity_type', { length: 50 }),
  entityId: uuid('entity_id'),
  details: jsonb('details'),
  ipAddress: varchar('ip_address', { length: 45 }),
  createdAt: timestamp('created_at').defaultNow(),
});
```

## Security Headers

Configurados no Next.js (`next.config.js`):

```javascript
const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
];
```

## Rate Limiting

### API Rate Limits

```typescript
// apps/api/src/plugins/rate-limit.ts
fastify.register(rateLimitPlugin, {
  max: 100,           // requests
  timeWindow: 60000,  // per minute
});
```

### SEFAZ Rate Limits

- DistDFe: Máximo 20 consultas/hora por CNPJ
- Controlado via `syncStatus: 'rate_limited'` na tabela `nsu_control`

## Incident Response

### Contatos

| Papel | Responsabilidade |
|-------|------------------|
| Dev Lead | Primeira resposta técnica |
| DBA | Problemas de banco de dados |
| Security | Incidentes de segurança |

### Procedimentos

1. **Detecção**: Monitoramento de logs e métricas
2. **Contenção**: Isolar sistema afetado
3. **Erradicação**: Corrigir vulnerabilidade
4. **Recuperação**: Restaurar serviço normal
5. **Post-mortem**: Documentar e prevenir recorrência

### Logs de Segurança

```typescript
// Exemplo de log de evento de segurança
logger.warn({
  event: 'auth_failure',
  ip: request.ip,
  email: body.email,
  reason: 'invalid_credentials'
}, 'Authentication failed');
```
