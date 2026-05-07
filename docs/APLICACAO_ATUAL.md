# FiscalZen - Documentacao da Aplicacao Atual

Atualizado em: 2026-05-06

## Objetivo do Produto

FiscalZen e uma aplicacao web para operacao fiscal de empresas, com foco em:

- cadastro e acompanhamento de empresas;
- ingestao e consulta de documentos fiscais XML;
- armazenamento seguro de XML, PDF operacional e pacotes ZIP;
- manifestacao do destinatario;
- acompanhamento de jobs, downloads e historico operacional;
- alertas, webhooks e trilhas de auditoria;
- integracao com infraestrutura fiscal e servicos externos como SEFAZ, storage S3/MinIO, Redis, Meilisearch e PostgreSQL.

O estado atual e de MVP endurecido para PR e demo controlada. A aplicacao ja possui fluxos operacionais centrais, mas alguns pontos dependem de validacao manual em ambiente real, principalmente SEFAZ, certificado, workers e storage.

## Arquitetura Geral

O repositorio e um monorepo `pnpm` com Turborepo.

```text
apps/
  api/        API Fastify, jobs e modulos de negocio
  web/        Frontend Next.js App Router
packages/
  database/   Drizzle schema, migrations e cliente de banco
  shared/     Tipos/utilitarios compartilhados
  ui/         Componentes UI compartilhados
  sefaz-client/
  nfse-client/
  xml-parser/
  pdf-generator/
  security/
  cli/
docker/
  docker-compose.yml        Stack local de desenvolvimento
  docker-compose.test.yml   Stack isolada de integracao
docs/
  Documentacao operacional, testes e fechamento de MVP
```

### Fluxo de Dados Principal

1. O usuario acessa o frontend em Next.js.
2. O frontend chama a API em `/api/v1`.
3. A API valida autenticacao/tenant, aplica regras de negocio e persiste no PostgreSQL.
4. Arquivos fiscais ficam em MinIO/S3.
5. Jobs e downloads em lote usam Redis/BullMQ.
6. Busca textual pode usar Meilisearch.
7. Eventos operacionais alimentam historico/timeline.

## Stack Tecnica

### Frontend

- Next.js 15 App Router
- React 19
- TypeScript
- Tailwind CSS
- Radix UI e componentes internos `@fiscalzen/ui`
- TanStack Query e TanStack Table
- Clerk para autenticacao nas telas de auth
- Lucide React para icones

### Backend

- Fastify
- TypeScript ESM
- Zod para validacao auxiliar
- Drizzle ORM
- PostgreSQL
- Redis/BullMQ
- MinIO/S3 via AWS SDK
- Meilisearch
- pdfmake para PDF operacional
- OpenTelemetry/Jaeger opcional
- Pino para logs

### Banco de Dados

O pacote `@fiscalzen/database` exporta schemas Drizzle para:

- `tenants`
- `companies`
- `documents`
- `document_history`
- `events`
- `agents`
- `audit_logs`
- `nsu_control`
- `nfse_configs`
- `document_relations`
- `tags`
- `comments`
- `alerts`
- `webhooks`
- `download_registry`

## Aplicacoes

## Web (`apps/web`)

### Layout

As telas autenticadas usam layout de dashboard com:

- sidebar desktop recolhivel;
- menu mobile;
- navegacao principal;
- conteudo central por rota.

Navegacao principal atual:

- Dashboard
- Empresas
- Documentos
- Downloads
- Manifestacao
- Upload
- Agentes
- Configuracoes

Observacao: a navegacao aponta para `/agentes`, mas nao ha pagina `page.tsx` implementada para essa rota no estado atual.

### Telas Publicas/Auth

| Rota | Estado | Funcao |
| --- | --- | --- |
| `/` | Implementada | Entrada/root da aplicacao. |
| `/login` | Implementada | Tela de login. |
| `/register` | Implementada | Tela de cadastro. |
| `/sign-in/[[...sign-in]]` | Implementada | Fluxo Clerk de sign-in. |
| `/sign-up/[[...sign-up]]` | Implementada | Fluxo Clerk de sign-up. |

### Telas do Dashboard

| Rota | Estado | Funcao |
| --- | --- | --- |
| `/dashboard` | Implementada | Visao principal com indicadores e acesso aos fluxos operacionais. |
| `/empresas` | Implementada | Lista empresas cadastradas. |
| `/empresas/nova` | Implementada | Cadastro de nova empresa. |
| `/empresas/[id]` | Implementada | Detalhe de empresa, status NSU, certificado, erros e acoes operacionais. |
| `/empresas/[id]/nfse` | Implementada | Configuracao/visao de NFS-e por empresa. |
| `/documentos` | Implementada | Inbox fiscal com busca, filtros, cards de resumo, tabela paginada e selecao em lote. |
| `/documentos/[id]` | Implementada | Detalhe do documento, anexos fiscais, XML/PDF, historico/timeline e acoes. |
| `/downloads` | Implementada | Centro de downloads em lote com polling, progresso, status, erros e link de ZIP. |
| `/manifestacao` | Implementada | Lista pendentes, aguardando finalizacao, historico e acao de manifestacao. |
| `/upload` | Implementada | Upload manual de XMLs por drag-and-drop ou seletor de arquivos. |
| `/certificados` | Placeholder | Pagina existe, mas informa que gestao de certificados A1 esta em desenvolvimento. |
| `/configuracoes` | Placeholder | Pagina existe para ajustes/preferencias, ainda simples. |
| `/webhooks` | Placeholder | Pagina existe para webhooks, ainda simples. |
| `/alerts` | Implementada | Central de notificacoes/alertas. |

### Funcionalidades Visiveis no Frontend

- Listagem e cadastro de empresas.
- Acompanhamento de status NSU por empresa.
- Upload de XMLs.
- Listagem de documentos com filtros por empresa, tipo, situacao e periodo.
- Selecao de documentos para pacote em lote.
- Download individual de XML.
- Geração/download de PDF operacional para tipos suportados.
- Listagem de anexos fiscais publicos sem expor chaves internas.
- Timeline/historico do documento.
- Manifestacao do destinatario em documentos elegiveis.
- Centro de downloads com progresso e estados terminais.
- Alertas e notificacoes.

## API (`apps/api`)

### Base

- Health:
  - `GET /health/live`
  - `GET /health/ready`
  - `GET /health`
- API versionada:
  - prefixo global: `/api/v1`

### Plugins e Guard Rails

A API registra:

- metricas;
- CORS;
- Helmet;
- rate limiting;
- logger com correlation/request id;
- autenticacao;
- Swagger;
- multipart com limite de 10 MB;
- error handler global com envelope padronizado.

### Modulos e Prefixos

| Modulo | Prefixo | Responsabilidade |
| --- | --- | --- |
| `companies` | `/api/v1/companies` | CRUD de empresas, certificado, status operacional e NSU. |
| `documents` | `/api/v1/documents` | Upload/listagem/detalhe de documentos, XML, PDF operacional, anexos. |
| `relations` | `/api/v1/documents` | Relacoes entre documentos fiscais, como CTe e NFe. |
| `events` | `/api/v1/documents` | Eventos fiscais ligados a documentos. |
| `history` | `/api/v1/documents` | Timeline consolidada por documento. |
| `tags` | `/api/v1/tags` | Tags e associacao com documentos. |
| `comments` | `/api/v1/comments` | Comentarios em entidades/documentos. |
| `alerts` | `/api/v1/alerts` | Alertas, resumo, leitura individual e marcar todos como lidos. |
| `webhooks` | `/api/v1/webhooks` | Cadastro, teste, logs, regeneracao de segredo e metadata de eventos. |
| `downloads` | `/api/v1/downloads` | Downloads individuais e pacotes em lote. |
| `dashboard` | `/api/v1/dashboard` | Dados agregados para dashboard. |
| `manifestacao` | `/api/v1/manifestacao` | Manifestacao do destinatario, pendentes, historico e aguardando finalizacao. |
| `agents` | `/api/v1/agents` | Agentes locais/operacionais. |
| `jobs` | `/api/v1/jobs` | Status e comandos de jobs, como sync-all. |
| `nfse` | `/api/v1/nfse` | Recursos globais de NFS-e, como municipios. |
| `companyNfse` | `/api/v1/companies/:companyId/nfse` | Configuracoes NFS-e por empresa. |

### Contrato de Resposta

As rotas versionadas ativas seguem envelope padronizado, em geral:

```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```

Erros passam por envelope com `success: false` e objeto `error`. Existe teste de contrato para evitar retorno cru em rotas ativas.

## Funcionalidades por Dominio

### Empresas

- cadastro/listagem/detalhe;
- configuracao fiscal basica;
- certificado A1;
- status de sincronizacao NSU;
- exibicao de erros, rate limit, ultima/proxima sync e progresso por tipo.

### Documentos

- upload de XML;
- parsing e persistencia de metadados;
- armazenamento do XML em S3/MinIO;
- busca/listagem paginada;
- filtros por empresa, tipo, situacao e data;
- detalhe com anexos e historico;
- download XML autenticado;
- PDF operacional para NFe/NFCe e CTe suportados;
- anexos publicos sem vazamento de `storageKey`.

### Downloads

- criacao de pacote em lote;
- suporte a XML ou pacote completo;
- persistencia em `download_registry`;
- polling de status no frontend;
- progresso, sucesso e falha;
- ZIP acessado por rota autenticada;
- eventos registrados na timeline.

### Historico e Auditabilidade

- `document_history` registra eventos operacionais;
- timeline consolida historico local e eventos fiscais;
- eventos cobrem PDF, download, manifestacao e outras transicoes relevantes;
- detalhes sensiveis de storage sao sanitizados.

### Manifestacao

- rota canonica por documento;
- listagem de pendentes;
- documentos aguardando finalizacao;
- historico recente;
- bloqueio de duplicidade quando documento ja esta em estado final;
- retry quando houve falha;
- protocolo real quando a SEFAZ retornar protocolo.

### Alertas

- listagem de alertas;
- resumo de totais;
- marcar alerta como lido;
- marcar todos como lidos;
- central visual em `/alerts`.

### Webhooks

- cadastro/listagem/detalhe;
- atualizacao e remocao;
- teste;
- logs por webhook;
- regeneracao de segredo;
- metadata de eventos.

### NFS-e

- modulo global de NFS-e;
- configuracao por empresa;
- recurso de municipios;
- RPA/controladores dependem de feature flags e ambiente.

### Jobs e Filas

- Redis/BullMQ para jobs;
- status de jobs;
- sync-all;
- worker de downloads em lote;
- workers de sync/NSU e alertas conforme configuracao do ambiente.

## Configuracao Local

### Portas Dev

`pnpm docker:up` sobe a stack dev em portas dedicadas:

| Servico | Host | Container |
| --- | --- | --- |
| PostgreSQL dev | `localhost:55432` | `5432` |
| Redis dev | `localhost:56379` | `6379` |
| MinIO dev | `localhost:59000` | `9000` |
| MinIO console dev | `localhost:59001` | `9001` |
| Meilisearch dev | `localhost:7700` | `7700` |

Variaveis dev recomendadas:

```text
DATABASE_URL=postgresql://fiscalzen:fiscalzen@localhost:55432/fiscalzen
REDIS_URL=redis://localhost:56379
S3_ENDPOINT=http://localhost:59000
S3_ACCESS_KEY=fiscalzen
S3_SECRET_KEY=fiscalzen_minio_dev
S3_BUCKET=fiscalzen-docs
S3_REGION=us-east-1
MEILISEARCH_URL=http://localhost:7700
MEILISEARCH_HOST=http://localhost:7700
MEILISEARCH_API_KEY=fiscalzen_meilisearch_dev_key
NEXT_PUBLIC_API_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000
```

### Portas de Integracao

`pnpm test:integration:up` sobe uma stack separada:

| Servico | Host |
| --- | --- |
| PostgreSQL test | `localhost:55434` |
| Redis test | `localhost:56380` |

Banco de teste:

```text
DATABASE_URL_TEST=postgresql://fiscalzen_test:fiscalzen_test@localhost:55434/fiscalzen_test
```

Nao usar `DATABASE_URL_TEST` no desenvolvimento local (`pnpm dev`/`turbo run dev`).

### Variaveis Obrigatorias da API

De acordo com `apps/api/src/config/env.ts`:

- `DATABASE_URL`
- `JWT_SECRET` com pelo menos 32 caracteres
- `S3_ACCESS_KEY`
- `S3_SECRET_KEY`
- `CERT_ENCRYPTION_KEY` com 32 bytes em base64 ou 64 caracteres hex

Variaveis com default:

- `NODE_ENV`
- `PORT`
- `HOST`
- `LOG_LEVEL`
- `REDIS_URL`
- `JWT_EXPIRES_IN`
- `S3_ENDPOINT`
- `S3_BUCKET`
- `S3_REGION`
- `MEILISEARCH_URL`
- `RATE_LIMIT_MAX`
- `RATE_LIMIT_WINDOW_MS`
- `CORS_ORIGIN`
- `SEFAZ_AMBIENTE`
- feature flags

## Docker

### Desenvolvimento

```powershell
pnpm docker:up
pnpm docker:logs
pnpm docker:down
```

`pnpm docker:up` usa `docker/docker-compose.yml`.

Servicos dev:

- `fiscalzen-postgres`
- `fiscalzen-redis`
- `fiscalzen-minio`
- `fiscalzen-minio-init`
- `fiscalzen-meilisearch`

Perfis opcionais do compose:

- `api`
- `web`
- `prometheus`
- `grafana`
- `jaeger`

### Integracao

```powershell
pnpm test:integration:up
pnpm db:push:test
pnpm --filter @fiscalzen/api test:integration
pnpm test:integration:down
```

A stack de teste nao deve ser misturada com a stack dev.

## Comandos Principais

### Workspace

```powershell
pnpm dev
pnpm build
pnpm test
pnpm format:check
pnpm format
```

### Banco

```powershell
pnpm db:generate
pnpm db:migrate
pnpm db:push
pnpm db:push:test
pnpm db:studio
pnpm db:seed
pnpm db:test
```

### Builds por Pacote

```powershell
pnpm --filter @fiscalzen/database build
pnpm --filter @fiscalzen/api build
pnpm --filter @fiscalzen/web build
```

### Testes Leves Validados

```powershell
pnpm --filter @fiscalzen/api test:run tests/api-contract.test.ts
pnpm --filter @fiscalzen/api test:run tests/documents.public-document.test.ts tests/downloads.public-result.test.ts tests/pdf.helpers.test.ts tests/manifestacao.schemas.test.ts
pnpm --filter @fiscalzen/web test:run
```

### Testes de Integracao Validados

Com Docker ativo, a suite de integracao da API foi validada verde com `10` arquivos e `44` testes:

```powershell
pnpm test:integration:up
pnpm db:push:test
pnpm --filter @fiscalzen/api test:integration
```

## Estado Atual de Validacao

Validacoes recentes registradas:

- `pnpm test:integration:up` verde com Docker ativo;
- `pnpm db:push:test` verde;
- `pnpm --filter @fiscalzen/api test:integration` verde com `10` arquivos / `44` testes;
- `pnpm --filter @fiscalzen/api test:run tests/api-contract.test.ts` verde com `1` arquivo / `1` teste;
- `pnpm --filter @fiscalzen/api test:run tests/documents.public-document.test.ts tests/downloads.public-result.test.ts tests/pdf.helpers.test.ts tests/manifestacao.schemas.test.ts` verde com `4` arquivos / `9` testes;
- `pnpm --filter @fiscalzen/api build` verde;
- `pnpm --filter @fiscalzen/web build` verde;
- stack dev Docker sobe com portas dedicadas sem conflitar com a stack de integracao.

## Limitacoes Conhecidas

- SEFAZ real depende de ambiente fiscal, certificado valido e cenario compativel.
- Manifestacao real depende de retorno efetivo da SEFAZ; o sistema nao deve fabricar protocolo.
- PDF atual e operacional, baseado em XML armazenado e layout/parser existente; nao deve ser declarado DANFE/DACTE juridicamente validado em todos os cenarios.
- Fluxos com storage/worker devem ser conferidos manualmente no ambiente de demo.
- MinIO/S3, Redis e workers precisam estar ativos para ZIP em lote, leitura de arquivos e processos assincronos.
- Meilisearch melhora busca textual; sem ele, a experiencia de busca pode ficar limitada.
- `/certificados`, `/configuracoes` e `/webhooks` existem como paginas simples/placeholder.
- `/agentes` aparece na navegacao, mas a pagina correspondente nao esta implementada no App Router atual.
- O endpoint legado `apps/api/src/modules/pdf/routes.ts` permanece isolado/desativado no registro principal; PDF ativo esta em `documentsRoutes`.

## Checklist para Demo Controlada

1. Subir stack dev ou ambiente equivalente.
2. Confirmar variaveis de ambiente da API e web.
3. Rodar builds principais.
4. Validar login/autenticacao.
5. Cadastrar ou abrir empresa.
6. Confirmar certificado/estado NSU quando aplicavel.
7. Enviar XML.
8. Abrir inbox `/documentos`.
9. Abrir detalhe de documento.
10. Baixar XML.
11. Gerar/baixar PDF operacional em tipo suportado.
12. Criar pacote ZIP em lote.
13. Acompanhar em `/downloads`.
14. Conferir timeline.
15. Executar manifestacao em documento elegivel, se houver certificado/ambiente fiscal compativel.

## Documentos Relacionados

- `docs/TESTING.md`
- `docs/MVP_DEMO_CHECKLIST.md`
- `docs/PR_SUMMARY_MVP_HARDENING.md`
- `EPICOS_PROGRESSAO.md`
- `MVP_PROGRESS_REPORT.md`
