# FiscalZen

**Plataforma para gestão automatizada de documentos fiscais eletrônicos brasileiros (DF-e)**

[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)]()
[![Next.js](https://img.shields.io/badge/Next.js-14-black)]()
[![Fastify](https://img.shields.io/badge/Fastify-4-white)]()

---

## Visão Geral

FiscalZen é uma plataforma distribuída para automatizar o ciclo de vida de documentos fiscais eletrônicos brasileiros:

- **NFe** - Nota Fiscal Eletrônica (Modelo 55)
- **CTe** - Conhecimento de Transporte (Modelo 57)
- **MDFe** - Manifesto de Documentos (Modelo 58)
- **NFSe** - Nota Fiscal de Serviço (Municipal)

### Funcionalidades

- ✅ **Sincronização Automática** - Polling periódico do DistDFe SEFAZ
- ✅ **Monitoramento de Eventos** - Detecção de cancelamentos, correções e desacordos em tempo real
- ✅ **Alertas Inteligentes** - Notificações críticas sobre documentos
- ✅ **Webhooks & Integração** - Notificação ativa para ERPs via Webhooks seguros (HMAC)
- ✅ **Geração de PDF** - DACTE (CTe) e DANFE (NFe) com suporte a download em lote
- ✅ **Colaboração** - Tags, Comentários e Menções em documentos
- ✅ **Manifestação & Desacordo** - Ciência, Confirmação, Desconhecimento e Desacordo de CTe
- ✅ **Dashboard Web** - Visualização e gestão de documentos
- ✅ **Busca Full-Text** - Pesquisa rápida via Meilisearch
- ✅ **Multi-tenant** - Isolamento de dados por organização
- ✅ **API REST** - Integração com sistemas externos

---

## Stack Tecnológica

| Camada | Tecnologia |
|--------|------------|
| **Runtime** | Node.js 20+ |
| **Linguagem** | TypeScript |
| **Backend** | Fastify |
| **Frontend** | Next.js 14 (App Router) |
| **Banco de Dados** | PostgreSQL 16 + Drizzle ORM |
| **Filas** | Redis + BullMQ |
| **Busca** | Meilisearch |
| **Storage** | MinIO / S3 |
| **Autenticação** | Clerk |
| **Monorepo** | Turborepo + pnpm |

---

## Estrutura do Projeto

```
fiscalzen-project/
├── apps/
│   ├── api/              # Fastify REST API + Workers
│   └── web/              # Next.js Dashboard
├── packages/
│   ├── database/         # Schema Drizzle (PostgreSQL)
│   ├── sefaz-client/     # Cliente SOAP SEFAZ (mTLS, A1)
│   ├── nfse-client/      # Cliente NFSe (ABRASF + RPA)
│   ├── xml-parser/       # Parser XML fiscal brasileiro
│   ├── shared/           # Tipos e schemas Zod
│   └── ui/               # Componentes React (shadcn/ui)
├── docker/               # Docker Compose + configs
└── scripts/              # Utilitários de desenvolvimento
```

---

## Quick Start

### Pré-requisitos

- Node.js 20+
- pnpm 9+
- Docker e Docker Compose

### 1. Clone e Instale

```bash
git clone https://github.com/seu-usuario/fiscalzen-project.git
cd fiscalzen-project
pnpm install
```

### 2. Configure o Ambiente

```bash
# Copie o arquivo de exemplo
cp apps/api/.env.example apps/api/.env

# Gere secrets seguros
node scripts/generate-secrets.js
# Copie a saída para apps/api/.env
```

### 3. Inicie a Infraestrutura

```bash
docker compose -f docker/docker-compose.yml up -d
```

Serviços disponíveis:
| Serviço | Porta | URL |
|---------|-------|-----|
| PostgreSQL | 5432 | - |
| Redis | 6379 | - |
| Meilisearch | 7700 | http://localhost:7700 |
| MinIO Console | 9001 | http://localhost:9001 |

### 4. Configure o Banco de Dados

```bash
pnpm --filter @fiscalzen/database db:push
```

### 5. Inicie o Desenvolvimento

```bash
pnpm dev
```

- **API**: http://localhost:3001
- **Web**: http://localhost:3000

---

## Comandos Úteis

```bash
# Desenvolvimento
pnpm dev                    # Inicia API + Web
pnpm build                  # Build de produção
pnpm lint                   # Lint completo
pnpm test                   # Testes

# Filtros de workspace
pnpm --filter @fiscalzen/api dev       # Apenas API
pnpm --filter @fiscalzen/web dev       # Apenas Web
pnpm --filter @fiscalzen/database db:studio  # GUI do banco

# Docker
docker compose -f docker/docker-compose.yml up -d      # Infra
docker compose -f docker/docker-compose.yml logs -f    # Logs
docker compose -f docker/docker-compose.yml down -v    # Reset
```

---

## Documentação

| Documento | Descrição |
|-----------|-----------|
| [.context/docs/architecture.md](.context/docs/architecture.md) | Arquitetura do sistema |
| [.context/docs/data-flow.md](.context/docs/data-flow.md) | Fluxo de dados |
| [.context/docs/development-workflow.md](.context/docs/development-workflow.md) | Workflow de desenvolvimento |
| [.context/docs/security.md](.context/docs/security.md) | Segurança e compliance |
| [.context/docs/glossary.md](.context/docs/glossary.md) | Glossário fiscal |

---

## API Endpoints

### Health Check

```bash
curl http://localhost:3001/health
```

### Principais Rotas

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/v1/companies` | Listar empresas |
| GET | `/api/v1/documents` | Listar documentos |
| GET | `/api/v1/documents/:id/pdf` | Download PDF (DACTE/DANFE) |
| POST | `/api/v1/documents/batch-download` | Download em lote (ZIP) |
| POST | `/api/v1/manifestacao` | Enviar manifestação |
| POST | `/api/v1/manifestacao/desacordo` | Registrar desacordo de CTe |
| GET | `/api/v1/alerts` | Listar alertas |
| POST | `/api/v1/webhooks` | Gerenciar webhooks |
| GET | `/api/v1/dashboard/timeline` | Timeline de eventos |

---

## Variáveis de Ambiente

Veja [`apps/api/.env.example`](apps/api/.env.example) para a lista completa.

Variáveis críticas:

```bash
DATABASE_URL=postgresql://fiscalzen:fiscalzen_dev@localhost:5432/fiscalzen
REDIS_URL=redis://localhost:6379
JWT_SECRET=<gerar com scripts/generate-secrets.js>
CERT_ENCRYPTION_KEY=<gerar com scripts/generate-secrets.js>
```

---

## Licença

MIT

---

## Avisos

> ⚠️ **Documentos fiscais têm implicações legais**
> 
> - Consulte um contador antes de usar em produção
> - A SEFAZ pode alterar Web Services sem aviso
> - Guarde backups dos certificados A1
