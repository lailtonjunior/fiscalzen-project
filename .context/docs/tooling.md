---
status: filled
generated: 2026-01-18
---

# Tooling & Productivity Guide

Scripts, automação e configurações para desenvolvimento eficiente no FiscalZen.

## Required Tooling

### Runtime & Package Manager

| Ferramenta | Versão | Instalação |
|------------|--------|------------|
| Node.js | 20+ | [nodejs.org](https://nodejs.org) ou `nvm install 20` |
| pnpm | 9+ | `npm install -g pnpm` |
| Docker | 24+ | [docker.com](https://docker.com) |

### Verificar Instalação

```bash
node --version    # v20.x.x
pnpm --version    # 9.x.x
docker --version  # 24.x.x
```

## Monorepo Tools

### Turborepo

Gerenciador de builds para monorepo. Configurado em [turbo.json](turbo.json).

```bash
# Comandos via turbo (executados pelo pnpm)
pnpm build      # Build de todos os pacotes
pnpm dev        # Dev mode de todos os apps
pnpm lint       # Lint de todos os pacotes
pnpm test       # Testes de todos os pacotes
```

### Workspace Filters

```bash
# Executar comando em pacote específico
pnpm --filter @fiscalzen/api dev
pnpm --filter @fiscalzen/web build
pnpm --filter @fiscalzen/database db:push

# Executar em múltiplos pacotes
pnpm --filter "./packages/*" build
```

## Scripts Úteis

### Utilitários na Raiz

| Script | Propósito | Uso |
|--------|-----------|-----|
| [kill-port.mjs](kill-port.mjs) | Mata processo em porta | `node kill-port.mjs 3000` |
| [clean-web-next-cache.mjs](clean-web-next-cache.mjs) | Limpa cache Next.js | `node clean-web-next-cache.mjs` |
| [apply-next-dev-cache-fix.mjs](apply-next-dev-cache-fix.mjs) | Fix de cache dev | `node apply-next-dev-cache-fix.mjs` |

### Scripts do package.json

```json
{
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "test": "turbo test",
    "clean": "turbo clean && rm -rf node_modules"
  }
}
```

## Database Tools

### Drizzle ORM

```bash
# Aplicar schema ao banco
pnpm --filter @fiscalzen/database db:push

# Gerar migrations
pnpm --filter @fiscalzen/database db:generate

# Abrir Drizzle Studio (GUI)
pnpm --filter @fiscalzen/database db:studio
```

### PostgreSQL CLI

```bash
# Conectar ao banco local
psql postgresql://fiscalzen:fiscalzen_dev@localhost:5432/fiscalzen

# Backup
pg_dump -h localhost -U fiscalzen fiscalzen > backup.sql

# Restore
psql -h localhost -U fiscalzen fiscalzen < backup.sql
```

## Docker Development

### Comandos Básicos

```bash
# Subir infraestrutura
docker compose -f docker/docker-compose.yml up -d

# Ver logs
docker compose -f docker/docker-compose.yml logs -f

# Parar
docker compose -f docker/docker-compose.yml down

# Reset completo (apaga dados)
docker compose -f docker/docker-compose.yml down -v
docker compose -f docker/docker-compose.yml up -d
```

### Serviços Locais

| Serviço | Porta | Acesso |
|---------|-------|--------|
| PostgreSQL | 5432 | `psql -h localhost -U fiscalzen` |
| Redis | 6379 | `redis-cli` |
| Meilisearch | 7700 | http://localhost:7700 |
| MinIO Console | 9001 | http://localhost:9001 |
| MinIO API | 9000 | S3 endpoint |

## IDE / Editor Setup

### VSCode Extensions (Recomendadas)

```json
// .vscode/extensions.json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    "ms-azuretools.vscode-docker",
    "mikestead.dotenv",
    "yoavbls.pretty-ts-errors"
  ]
}
```

### VSCode Settings

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.updateImportsOnFileMove.enabled": "always"
}
```

### Snippets Úteis

```json
// .vscode/fiscalzen.code-snippets
{
  "Fastify Route": {
    "prefix": "froute",
    "body": [
      "fastify.${1:get}('/${2:path}', {",
      "  schema: {",
      "    ${3:querystring}: ${4:schema},",
      "  },",
      "}, async (request, reply) => {",
      "  const tenantId = getTenantId(request);",
      "  $0",
      "  return sendSuccess(reply, data);",
      "});"
    ]
  },
  "Zod Schema": {
    "prefix": "zschema",
    "body": [
      "export const ${1:name}Schema = z.object({",
      "  ${2:field}: z.string(),",
      "});",
      "",
      "export type ${1:name} = z.infer<typeof ${1:name}Schema>;"
    ]
  }
}
```

## Linting & Formatting

### ESLint

```bash
# Lint todos os pacotes
pnpm lint

# Lint com fix automático
pnpm lint -- --fix

# Lint de pacote específico
pnpm --filter @fiscalzen/api lint
```

### Prettier

```bash
# Formatar todos os arquivos
pnpm exec prettier --write "**/*.{ts,tsx,json,md}"

# Verificar formatação
pnpm exec prettier --check "**/*.{ts,tsx,json,md}"
```

## Testing

### Vitest

```bash
# Rodar todos os testes
pnpm test

# Modo watch
pnpm test -- --watch

# Com coverage
pnpm test -- --coverage

# Testes de pacote específico
pnpm --filter @fiscalzen/xml-parser test
```

### Debug de Testes

```bash
# Rodar teste específico
pnpm --filter @fiscalzen/api test -- --testNamePattern="error handling"

# Verbose output
pnpm test -- --reporter=verbose
```

## Productivity Tips

### Aliases de Terminal

```bash
# ~/.bashrc ou ~/.zshrc
alias fz="cd ~/projects/fiscalzen"
alias fzdev="cd ~/projects/fiscalzen && pnpm dev"
alias fzapi="pnpm --filter @fiscalzen/api"
alias fzweb="pnpm --filter @fiscalzen/web"
alias fzdb="pnpm --filter @fiscalzen/database"
alias dcup="docker compose -f docker/docker-compose.yml up -d"
alias dcdown="docker compose -f docker/docker-compose.yml down"
alias dclogs="docker compose -f docker/docker-compose.yml logs -f"
```

### Git Hooks (Husky)

Se configurado, hooks rodam automaticamente:

```bash
# pre-commit
pnpm lint-staged

# commit-msg
# Valida formato de commit message
```

### Desenvolvimento Local

```bash
# Setup inicial (uma vez)
git clone <repo>
cd fiscalzen
pnpm install
cp .env.example .env
docker compose -f docker/docker-compose.yml up -d
pnpm --filter @fiscalzen/database db:push

# Dia a dia
docker compose -f docker/docker-compose.yml up -d  # Se não estiver rodando
pnpm dev
```

### Troubleshooting

```bash
# Limpar tudo e recomeçar
pnpm clean
rm -rf node_modules
pnpm install

# Problemas com Next.js cache
node clean-web-next-cache.mjs

# Porta em uso
node kill-port.mjs 3000
node kill-port.mjs 3001

# Reset do banco
docker compose -f docker/docker-compose.yml down -v
docker compose -f docker/docker-compose.yml up -d
pnpm --filter @fiscalzen/database db:push
```

## CI/CD

### GitHub Actions

Workflows em [.github/workflows/](.github/workflows/):

| Workflow | Trigger | Jobs |
|----------|---------|------|
| `ci.yml` | push, PR | lint, build, test, typecheck |

### Verificar Localmente (Pré-Push)

```bash
# Rodar todos os checks do CI localmente
pnpm build && pnpm lint && pnpm test --run
```
