# FiscalZen Config Skill

Skill especializada para correção e padronização de configurações no projeto FiscalZen.

## Contexto

O FiscalZen é um monorepo com múltiplos pacotes e aplicações que requer consistência rigorosa nas configurações.

## Onde Mexer

```
fiscalzen-project/
├── docker/docker-compose.yml       # Infraestrutura local
├── docker/docker-compose.test.yml  # Infraestrutura de testes
├── apps/api/.env.example           # Variáveis da API
├── apps/web/.env.example           # Variáveis do Web
├── package.json                    # Scripts do monorepo
└── scripts/                        # Scripts utilitários
```

## Gates Obrigatórios

Antes de qualquer alteração de configuração:

1. **Verificar consistência de portas**
   - PostgreSQL: 5432 (padrão)
   - Redis: 6379
   - Meilisearch: 7700
   - MinIO API: 9000
   - MinIO Console: 9001
   - API: 3001
   - Web: 3000

2. **Verificar variáveis de ambiente**
   - Todas as envs devem ter valor padrão em .env.example
   - Secrets nunca devem ter valores reais nos exemplos
   - Documentar dependências entre envs

3. **Validar scripts**
   - Scripts devem funcionar em Linux, macOS e Windows (WSL)
   - Usar caminhos relativos quando possível
   - Adicionar verificações de erro

## Templates

### Correção de Portas

```typescript
// scripts/verify-ports.mjs
const expectedPorts = {
  postgres: 5432,
  redis: 6379,
  meilisearch: 7700,
  minio: { api: 9000, console: 9001 },
  api: 3001,
  web: 3000,
}

// Verificar docker-compose.yml
// Verificar .env.example
// Verificar README.md
```

### Script de Verificação de Config

```typescript
// scripts/verify-config.mjs
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

const requiredFiles = [
  'docker/secrets/postgres_password.txt',
  'docker/secrets/redis_password.txt',
  'docker/secrets/jwt_secret.txt',
  'docker/secrets/cert_encryption_key.txt',
]

const requiredEnvs = [
  'DATABASE_URL',
  'REDIS_URL',
  'JWT_SECRET',
  'CERT_ENCRYPTION_KEY',
]

export function verifyConfig() {
  const errors = []
  
  // Verificar arquivos de secrets
  for (const file of requiredFiles) {
    if (!existsSync(file)) {
      errors.push(`Arquivo não encontrado: ${file}`)
    }
  }
  
  // Verificar variáveis de ambiente
  for (const env of requiredEnvs) {
    if (!process.env[env]) {
      errors.push(`Variável não definida: ${env}`)
    }
  }
  
  if (errors.length > 0) {
    console.error('❌ Erros de configuração:')
    errors.forEach(e => console.error(`  - ${e}`))
    process.exit(1)
  }
  
  console.log('✅ Configuração válida')
}

verifyConfig()
```

## Comandos de Verificação

```bash
# Verificar consistência de portas
grep -r "5433" --include="*.yml" --include="*.yaml" --include="*.env*" .

# Verificar scripts depreciados
grep -r "generate:pg" --include="*.json" .

# Verificar dependências desatualizadas
pnpm outdated

# Verificar build
pnpm build

# Verificar testes
pnpm test
```

## Checklist de Correção

- [ ] Portas padronizadas
- [ ] Scripts atualizados
- [ ] Dependências atualizadas
- [ ] Script verify-config criado
- [ ] Documentação atualizada
- [ ] Testes passando
