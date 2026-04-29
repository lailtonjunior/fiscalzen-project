# CLAUDE.md — FiscalZen (raiz)

> Este arquivo é carregado automaticamente pelo Claude Code em toda sessão deste repositório.
> Política permanente em `docs/CLAUDE_TDD_FISCALZEN_v2.md`. Leia-a antes de codificar.

---

## Identidade

**FiscalZen** — SaaS multi-tenant de recepção e monitoramento de DF-e brasileiros (NF-e, CT-e, MDF-e, NFS-e).
**Não emite** documentos fiscais. **Não calcula** impostos. **Recebe, processa, monitora e integra.**

## Stack

Node.js 20 · TypeScript 5.3 · Fastify 4 · Next.js 14 · PostgreSQL 16 · Drizzle ORM · Redis/BullMQ · Meilisearch · MinIO/S3 · tsyringe · Vitest · Turborepo · pnpm.

## Estrutura

```
apps/api          Fastify + Workers BullMQ
apps/web          Next.js 14 (App Router)
packages/database sefaz-client xml-parser pdf-generator security shared ui cli nfse-client
docker/           scripts/           .claude/
```

## Regras não-negociáveis

1. **TDD obrigatório**: toda mudança de comportamento segue CONTEXTO → RED → GREEN → VERIFY → REFACTOR → REVIEW → CLOSE. Use os comandos `/tdd-*`.
2. **Multi-tenancy**: isolamento absoluto. Toda query tem filtro de tenant. Violação = crítico.
3. **Segurança**: nunca toque `.env*`, `*.pfx`, `*.key`, `*.pem`, `packages/security/secrets/**`. Nunca logue XML completo, certificado, JWT, senha.
4. **Contratos**: não quebre contratos REST ou de webhook sem ciclo explícito.
5. **Produção**: proibido. Nenhum comando, request ou MCP pode apontar para produção.
6. **Console.log**: proibido em fluxo de produção. Use Pino estruturado.
7. **Migrations**: toda migration precisa de rollback documentado e índices avaliados.

## Como abrir um ciclo

```
/tdd-abrir "<intenção de negócio observável, ex: 'Rejeitar download de XML de outro tenant com 403'>"
```

## Subagents disponíveis

`tdd-orchestrator` · `red-writer` · `green-implementer` · `refactor-engineer` · `security-auditor` · `tenant-isolation-guard` · `sefaz-xml-specialist` · `contract-db-guardian` · `performance-analyst`

Detalhes em `.claude/agents/*.md`.

## Convenções de código

- **DI**: `tsyringe` com `@injectable()` e interfaces em `*.types.ts`.
- **Erros**: sempre classes em `errors/`, serializadas pelo error handler central do Fastify.
- **Testes**: Vitest. Unit em `*.test.ts` junto ao arquivo; integração em `*.int.test.ts` em `tests/integration/`; contrato em `tests/contract/`; E2E em `tests/e2e/`.
- **Naming**: `deve_<resultado>_quando_<contexto>` ou `should_<result>_when_<context>`.
- **Imports**: sempre path aliases do monorepo (`@fiscalzen/shared`, `@fiscalzen/database`, …).
- **Commits**: Conventional Commits. Scope é o módulo (`feat(documents):`, `fix(webhooks):`).

## Scripts pnpm principais

```
pnpm dev              # sobe API + Web
pnpm test             # roda tudo
pnpm test --filter=@fiscalzen/api
pnpm typecheck
pnpm lint
pnpm db:generate      # gera migration Drizzle
pnpm db:push          # aplica em ambiente de dev
```

## Infra local

`docker compose -f docker/docker-compose.yml up -d` sobe Postgres (5432), Redis (6379), Meilisearch (7700), MinIO (9001).

## Quando você (Claude) não souber

- Regras fiscais específicas → consulte `packages/shared/CLAUDE.md` e `.context/docs/glossary.md`.
- SEFAZ/NSU/mTLS → delegue ao `sefaz-xml-specialist`.
- Decisão de contrato → delegue ao `contract-db-guardian`.
- Performance → delegue ao `performance-analyst`.
- Se ainda assim não estiver claro: **pare e pergunte**. Não invente.

## Fora do escopo (anti-scope)

❌ Emissão de documentos fiscais  ❌ Cálculo de impostos  ❌ Integração genérica com ERPs  ❌ Múltiplas empresas num certificado  ❌ Chave de produção  ❌ Qualquer coisa que "pareça útil pro futuro" mas não cabe no ciclo atual.
