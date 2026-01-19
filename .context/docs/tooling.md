# Tooling & Productivity Guide

Este guia detalha as ferramentas, scripts e configurações recomendadas para desenvolver no ecossistema FiscalZen de forma eficiente.

## Requisitos de Sistema

Para garantir a compatibilidade entre todos os pacotes do monorepo, utilize as seguintes versões:

| Ferramenta | Versão Recomendada | Instalação |
| :--- | :--- | :--- |
| **Node.js** | `v20.x` (LTS) | [nodejs.org](https://nodejs.org) ou `nvm install 20` |
| **pnpm** | `v9.x` | `npm install -g pnpm` |
| **Docker** | `v24.x`+ | [Docker Desktop](https://www.docker.com/products/docker-desktop/) |
| **PostgreSQL** | `v16.x` | Via Docker Compose |

---

## Monorepo Management (Turborepo)

O FiscalZen utiliza [Turborepo](https://turbo.build/repo) para gerenciar o pipeline de build e execução.

### Comandos Globais
Executados na raiz do projeto:

```bash
# Iniciar ambiente de desenvolvimento (API + Web + Workers)
pnpm dev

# Gerar build de produção de todos os pacotes
pnpm build

# Executar lint em todo o repositório
pnpm lint

# Executar todos os testes unitários e de integração
pnpm test
```

### Filtros de Workspace
Para focar em um projeto específico e economizar recursos:

```bash
# Apenas a API
pnpm --filter @fiscalzen/api dev

# Apenas o Frontend Web
pnpm --filter @fiscalzen/web dev

# Rodar testes apenas do parser de XML
pnpm --filter @fiscalzen/xml-parser test
```

---

## Banco de Dados & Drizzle

O projeto utiliza **Drizzle ORM** para manipulação do PostgreSQL.

### Scripts de Banco (na raiz ou em `packages/database`)

```bash
# Sincronizar schema com o banco local (sem migrations)
pnpm db:push

# Gerar nova migration baseada em mudanças no schema.ts
pnpm db:generate

# Abrir interface gráfica (Studio) para visualizar dados
pnpm db:studio
```

### Conexão Local
Por padrão, o Docker expõe o banco em:
- **Host:** `localhost:5432`
- **User:** `fiscalzen`
- **Pass:** `fiscalzen_dev`
- **DB:** `fiscalzen`

---

## Infraestrutura Local (Docker)

O arquivo `docker/docker-compose.yml` contém todos os serviços necessários para rodar a aplicação localmente.

### Gerenciamento de Serviços

```bash
# Subir infra (Postgres, Redis, Meilisearch, MinIO)
docker compose -f docker/docker-compose.yml up -d

# Visualizar logs de um serviço específico
docker compose -f docker/docker-compose.yml logs -f postgres

# Resetar volumes (Limpar banco e filas)
docker compose -f docker/docker-compose.yml down -v && docker compose -f docker/docker-compose.yml up -d
```

### Dashboard de Serviços

| Serviço | Porta | URL de Acesso |
| :--- | :--- | :--- |
| **Meilisearch** | 7700 | `http://localhost:7700` |
| **MinIO (Console)** | 9001 | `http://localhost:9001` (User: `minioadmin` / Pass: `minioadmin`) |
| **Redis (BullMQ)** | 6379 | `redis://localhost:6379` |

---

## Scripts Utilitários

Existem utilitários na raiz para resolver problemas comuns de ambiente:

| Script | Descrição | Uso |
| :--- | :--- | :--- |
| `kill-port.mjs` | Finaliza processos travados em portas específicas. | `node kill-port.mjs 3000` |
| `clean-web-next-cache.mjs` | Limpa o cache `.next` que pode causar erros de build. | `node clean-web-next-cache.mjs` |
| `apply-next-dev-cache-fix.mjs` | Aplica patches em problemas conhecidos de HMR do Next.js. | `node apply-next-dev-cache-fix.mjs` |

---

## Configuração do VS Code

Para uma melhor experiência de desenvolvimento, instale as extensões recomendadas em `.vscode/extensions.json`:

1. **ESLint & Prettier**: Formatação automática ao salvar.
2. **Tailwind CSS IntelliSense**: Autocomplete para estilos no pacote `web`.
3. **Drizzle-specific highlighter**: Melhora a leitura de queries SQL in TS.
4. **Vitest**: Integração de testes diretamente no editor.

### Settings Recomendados
Adicione ao seu `settings.json` para garantir consistência:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

---

## Troubleshooting de Desenvolvimento

### Erros de "Module not found" após trocar de branch
Sempre que mudar de branch ou atualizar o repositório:
```bash
pnpm install
pnpm build --filter "@fiscalzen/*" # Garante que as dependências internas estejam compiladas
```

### Portas em conflito
Se a porta 3000 ou 4000 estiver ocupada:
```bash
node kill-port.mjs 3000
node kill-port.mjs 4000
```

### Reset de Cache do Turborepo
Se os builds estiverem inconsistentes:
```bash
rm -rf .turbo
pnpm clean
pnpm install
```

---

## Fluxo de CI/CD Local
Antes de realizar um `git push`, é recomendável rodar o check completo que o GitHub Actions executará:

```bash
# Check rápido
pnpm lint && pnpm test

# Check completo (inclui builds de produção)
pnpm build && pnpm lint && pnpm test
```
