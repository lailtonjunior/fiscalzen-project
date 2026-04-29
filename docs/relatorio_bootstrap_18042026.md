# RELATÓRIO DE BOOTSTRAP — 2026-04-18

## 1. Resumo executivo

- **Instalação da política:** OK — todos os 9 agents, 13 commands, 6 hooks e settings.json presentes e corretamente configurados.
- **Aderência atual estimada:** ~45%
- **Riscos críticos detectados:** 2 (webhook HMAC sem timingSafeEqual, idempotência de webhook ausente)
- **Primeiro ciclo recomendado:** "Verificar assinatura HMAC de webhook com timingSafeEqual"

---

## 2. Verificação da política (Fase 1)

### 1.1 Arquivos de política

- [x] `CLAUDE.md` na raiz — **EXISTE**. 3 regras não-negociáveis: (1) TDD obrigatório com ciclo completo, (2) Multi-tenancy com isolamento absoluto, (3) Segurança — nunca tocar .env, .pfx, .key, .pem; nunca logar XML completo/certificado/JWT.
- [x] `docs/CLAUDE_TDD_FISCALZEN_v2.md` — **EXISTE**. Artigo 17 (DoD) confirmado com 5 seções: A. Ciclo, B. Testes, C. Domínio, D. Dados/infra, E. Entrega.
- [x] `docs/GUIA_OPERACIONAL_CLAUDE_CODE.md` — **EXISTE**.

### 1.2 Subagents (`.claude/agents/`)

| Agent | Name OK? | Tools | Model |
|---|---|---|---|
| tdd-orchestrator | OK | Read, Grep, Glob, Write, Bash | opus |
| red-writer | OK | Read, Grep, Glob, Write, Bash | sonnet |
| green-implementer | OK | Read, Grep, Glob, Edit, Write, Bash | sonnet |
| refactor-engineer | OK | Read, Grep, Glob, Edit, Bash | sonnet |
| security-auditor | OK | Read, Grep, Glob, Bash | opus |
| tenant-isolation-guard | OK | Read, Grep, Glob, Bash | opus |
| sefaz-xml-specialist | OK | Read, Grep, Glob, Edit, Write, Bash | opus |
| contract-db-guardian | OK | Read, Grep, Glob, Bash | opus |
| performance-analyst | OK | Read, Grep, Glob, Bash | sonnet |

**9/9 OK.**

### 1.3 Slash commands (`.claude/commands/`)

Todos os 13 esperados presentes: `tdd-abrir`, `tdd-red`, `tdd-green`, `tdd-verify`, `tdd-refactor`, `tdd-review`, `tdd-close`, `audit-tenant`, `audit-security`, `audit-contract`, `db-migration-check`, `perf-analyze`, `sefaz-fixture`. **13/13 OK.**

### 1.4 Hooks (`.claude/hooks/`)

Todos os 6 esperados presentes com bit de execução (`rwxr-xr-x`): `pre-bash-guard.sh`, `pre-edit-guard.sh`, `post-edit-quality.sh`, `tdd-reminder.sh`, `session-start-context.sh`, `stop-cycle-warning.sh`. **6/6 OK.**

### 1.5 Configuração

- [x] `.claude/settings.json` — **EXISTE**, JSON válido.
- [x] `permissions.allow`: **45 entradas**.
- [x] `permissions.deny`: **35 entradas**.
- [x] `hooks`: 5 event types configurados (PreToolUse, PostToolUse, UserPromptSubmit, SessionStart, Stop).

### 1.6 Dependências do sistema

- [ ] `jq` — **NÃO INSTALADO** (necessário para hooks).
- [x] `node --version` — v24.12.0 (>= 20 OK).
- [x] `pnpm --version` — 9.15.0 OK.

### 1.7 Pasta de ciclos

- [x] `.claude/cycles/` — **EXISTE**, contém apenas `EXEMPLO-001.md` (estado esperado de repo novo).

---

## 3. Inventário do monorepo (Fase 2)

### 2.1 Topologia

- `pnpm-workspace.yaml`: packages `apps/*`, `packages/*`.
- `turbo.json`: configurado com tasks build, dev, lint, test, clean, db:generate.
- **Apps (2):** `api`, `web` — OK, sem divergências.
- **Packages (9):** `cli`, `database`, `nfse-client`, `pdf-generator`, `security`, `sefaz-client`, `shared`, `ui`, `xml-parser` — OK, sem divergências.

### 2.2 CLAUDE.md hierárquico

| Pacote | Status |
|---|---|
| apps/api/CLAUDE.md | **AUSENTE** |
| apps/web/CLAUDE.md | **AUSENTE** |
| packages/database/CLAUDE.md | **AUSENTE** |
| packages/sefaz-client/CLAUDE.md | **AUSENTE** |
| packages/xml-parser/CLAUDE.md | **AUSENTE** |
| packages/security/CLAUDE.md | **AUSENTE** |
| packages/shared/CLAUDE.md | **AUSENTE** |

**0/7 — Todos ausentes.**

### 2.3 Módulos da API

17 módulos em `apps/api/src/modules/`:

| Módulo | service | repo | routes | schema | unit | int |
|---|---|---|---|---|---|---|
| agents | 0 | 0 | 0 | 1 | 0 | 0 |
| alertas | 0 | 0 | 0 | 1 | 0 | 0 |
| certificates | 0 | 0 | 0 | 0 | 0 | 0 |
| comments | 0 | 0 | 0 | 1 | 0 | 0 |
| companies | 1 | 0 | 0 | 1 | 0 | 0 |
| dashboard | 0 | 0 | 0 | 1 | 0 | 0 |
| documents | 0 | 0 | 0 | 1 | 0 | 0 |
| downloads | 0 | 0 | 0 | 1 | 0 | 0 |
| events | 0 | 0 | 0 | 1 | 0 | 0 |
| jobs | 0 | 0 | 0 | 1 | 0 | 0 |
| manifestacao | 0 | 0 | 0 | 1 | 0 | 0 |
| nfse | 0 | 0 | 0 | 1 | 0 | 0 |
| nsu | 0 | 0 | 0 | 0 | 0 | 0 |
| pdf | 0 | 0 | 0 | 0 | 0 | 0 |
| relations | 0 | 0 | 0 | 1 | 0 | 0 |
| tags | 0 | 0 | 0 | 1 | 0 | 0 |
| webhooks | 0 | 0 | 0 | 0 | 0 | 0 |

**Nota:** Estrutura service/repo/routes não segue o padrão convencional — a maioria dos módulos tem apenas schema. A lógica de negócio está possivelmente centralizada em `app.ts` ou registrada de forma diferente.

### 2.4 Schema Drizzle

**11 arquivos de schema** em `packages/database/src/schema/`.

**Tenant isolation:** `tenant_id` presente em todas as tabelas críticas (agents, alerts, audit, comments, companies, document-relations, documents, events, tags, tenants, webhooks).

**Migrations:** 3 (0000, 0001, 0002).

**Índices — análise:**

| Índice esperado | Status |
|---|---|
| `(chave_acesso, tenant_id)` UNIQUE em documents | **AUSENTE** — existe `idx_documents_chave` mas sem composite com tenant_id |
| Índice em `certificate_expiry` | **AUSENTE** |
| Índice em `nsu_cursor` | **AUSENTE** |
| Índice em `webhook_delivery_status` | **AUSENTE** |

### 2.5 Fixtures SEFAZ

**6 fixtures encontrados** em `packages/sefaz-client/tests/fixtures/` e `packages/xml-parser/tests/fixtures/`:

- proc-nfe.xml, proc-evento-nfe.xml, res-nfe.xml, res-evento.xml, soap-response-distdfe.xml, soap-response-manifestacao.xml

**Cenários ausentes vs os 9 mínimos:**

| Cenário | Status |
|---|---|
| NFe autorizada | EXISTE |
| NFe cancelada | **AUSENTE** |
| NFe carta-correção | **AUSENTE** |
| NFe resumo | EXISTE (res-nfe.xml) |
| CTe autorizado | **AUSENTE** |
| CTe desacordo | **AUSENTE** |
| MDFe autorizado | **AUSENTE** |
| NFSe ABRASF | **AUSENTE** |
| Inválidos/erros | **AUSENTE** |

### 2.6 Testes

| Tipo | Contagem |
|---|---|
| Unit (`*.test.ts`) | 26 |
| Integration (`*.int.test.ts` / `*.integration.test.ts`) | 7 |
| Contract (`tests/contract/`) | 0 (dir não existe) |
| E2E (`tests/e2e/`) | 0 (dir não existe) |
| Benchmark (`*.bench.ts`) | 0 |

### 2.7 Observabilidade

- `console.log` em produção: **13 arquivos** com ocorrências.
- Pino/logger referências: **30 arquivos** — infraestrutura de logging estruturado presente.

### 2.8 Segurança — varredura rápida

**Nenhum resultado crítico encontrado.**

- Padrões `BEGIN PRIVATE KEY` / `BEGIN CERT` encontrados apenas em lógica de parsing em `packages/sefaz-client/src/certificate.ts` e `signature.ts` (string replacements, não chaves reais).
- Nenhuma connection string de produção exposta.
- Referências a `fiscalzen.com.br` são apenas em config swagger e test helpers (esperado).

---

## 4. Conformidade (Fase 3)

| # | Regra | Veredito | Detalhe |
|---|---|---|---|
| 3.1 | Multi-tenancy | **OK** | Todas as queries passam tenantId; schema com tenant_id em todas as tabelas |
| 3.2 | Auth/Autorização | **OK** | 15/15 módulos com preHandler authenticate ou onRequest hook |
| 3.3 | Validação Zod | **OK** | Todas as rotas usam schemas Zod via zodToFastify() |
| 3.4 | Idempotência webhook | **AUSENTE** | Nenhum mecanismo de idempotency encontrado |
| 3.5 | HMAC | **PARCIAL** | createHmac presente no webhook service; timingSafeEqual existe em envelope-encryption mas **NÃO** usado na verificação de webhook |
| 3.6 | NSU | **OK** | nsuControl table, sync status tracking, 5 arquivos de teste |
| 3.7 | XML Offloading | **OK** | BullMQ workers para processamento assíncrono |
| 3.8 | Cache Dashboard | **OK** | Redis/ioredis configurado com cache wrapper |
| 3.9 | Certificados | **OK** | certificate-checker.ts com job de 24h |
| 3.10 | Contratos compartilhados | **PARCIAL** | Exports OK (types, validators, formatters, constants, logger); CHANGELOG.md ausente |

---

## 5. Gap analysis (Fase 4)

| # | Gap | Categoria | Severidade | Tipo de ação |
|---|---|---|---|---|
| 1 | Webhook HMAC sem timingSafeEqual na verificação | Segurança | **Crítica** | Ciclo TDD urgente |
| 2 | Webhook sem idempotência (Idempotency-Key) | Segurança | **Crítica** | Ciclo TDD urgente |
| 3 | Índice UNIQUE (chave_acesso, tenant_id) ausente em documents | DB | **Alta** | Ciclo TDD |
| 4 | Índice em certificate_expiry ausente | DB | **Alta** | Ciclo TDD |
| 5 | Índice em nsu_cursor ausente | DB | **Alta** | Ciclo TDD |
| 6 | Índice em webhook_delivery_status ausente | DB | **Alta** | Ciclo TDD |
| 7 | 13 arquivos com console.log em produção | Observabilidade | **Média** | Ciclo TDD (Pino) |
| 8 | CLAUDE.md ausente em 7 pacotes | Documentação | **Média** | Tarefa config |
| 9 | Fixtures SEFAZ: 7 cenários ausentes (cancelada, CCe, CTe, MDFe, NFSe, inválidos) | Testes | **Média** | Ciclo TDD |
| 10 | 0 testes de contrato | Testes | **Média** | Ciclo TDD |
| 11 | 0 testes E2E | Testes | **Média** | Ciclo TDD |
| 12 | 0 benchmarks | Performance | **Média** | Ciclo TDD |
| 13 | CHANGELOG.md ausente em packages/shared | Contrato | **Baixa** | Tarefa config |
| 14 | jq não instalado (necessário para hooks) | Infra | **Alta** | Tarefa config |
| 15 | Módulo webhooks sem .service.ts/.repository.ts/.routes.ts estruturados | Testes | **Média** | Investigação adicional |

---

## 6. Plano de adoção (Fase 5)

### Ciclo proposto 1 — Verificar assinatura HMAC de webhook com timingSafeEqual

- **Intenção de negócio observável:** Garantir que a verificação de assinatura HMAC de webhook usa comparação em tempo constante, prevenindo timing attacks
- **Módulo:** webhooks
- **Camada:** unit
- **Gaps cobertos:** #1
- **Risco estimado:** baixo
- **Depende de:** nada
- **Comando:** `/tdd-abrir "Verificar assinatura HMAC de webhook com timingSafeEqual"`

### Ciclo proposto 2 — Implementar idempotência de webhook via Idempotency-Key

- **Intenção de negócio observável:** Rejeitar reprocessamento de webhook já entregue, retornando resultado anterior
- **Módulo:** webhooks
- **Camada:** unit + integration
- **Gaps cobertos:** #2
- **Risco estimado:** médio
- **Depende de:** Ciclo 1
- **Comando:** `/tdd-abrir "Rejeitar webhook duplicado via Idempotency-Key com cache Redis"`

### Ciclo proposto 3 — Índice UNIQUE (chave_acesso, tenant_id) em documents

- **Intenção de negócio observável:** Impedir inserção de documento duplicado no mesmo tenant com erro claro de unicidade
- **Módulo:** database
- **Camada:** integration
- **Gaps cobertos:** #3
- **Risco estimado:** médio (migration em tabela existente)
- **Depende de:** nada
- **Comando:** `/tdd-abrir "Criar índice UNIQUE (chave_acesso, tenant_id) em documents"`

### Ciclo proposto 4 — Índices ausentes: certificate_expiry, nsu_cursor, webhook_delivery_status

- **Intenção de negócio observável:** Queries de monitoramento de certificados, NSU e webhook devem usar índice
- **Módulo:** database
- **Camada:** integration
- **Gaps cobertos:** #4, #5, #6
- **Risco estimado:** baixo
- **Depende de:** nada
- **Comando:** `/tdd-abrir "Adicionar índices em certificate_expiry, nsu_cursor e webhook_delivery_status"`

### Ciclo proposto 5 — Substituir console.log por Pino estruturado

- **Intenção de negócio observável:** Nenhum console.log em fluxo de produção; todos os logs devem usar Pino com contexto estruturado
- **Módulo:** apps/api (transversal)
- **Camada:** unit
- **Gaps cobertos:** #7
- **Risco estimado:** baixo
- **Depende de:** nada
- **Comando:** `/tdd-abrir "Substituir console.log restantes por Pino estruturado"`

### Ciclo proposto 6 — CLAUDE.md hierárquico para pacotes-chave

- **Intenção de negócio observável:** Cada pacote deve ter CLAUDE.md declarando invariantes e convenções específicas
- **Módulo:** todos os 7 pacotes
- **Camada:** n/a (configuração)
- **Gaps cobertos:** #8
- **Risco estimado:** baixo
- **Depende de:** nada
- **Comando:** Tarefa config (não é ciclo TDD)

### Ciclo proposto 7 — Fixture SEFAZ: NFe cancelada e carta-correção

- **Intenção de negócio observável:** Parser deve identificar corretamente NFe cancelada e CCe, extraindo campos específicos
- **Módulo:** xml-parser
- **Camada:** unit
- **Gaps cobertos:** #9 (parcial)
- **Risco estimado:** baixo
- **Depende de:** nada
- **Comando:** `/tdd-abrir "Parser de NFe cancelada e carta-correção com fixtures válidos"`

### Ciclo proposto 8 — Fixture SEFAZ: CTe autorizado e desacordo

- **Intenção de negócio observável:** Parser deve processar CTe autorizado e registrar desacordo com campos corretos
- **Módulo:** xml-parser
- **Camada:** unit
- **Gaps cobertos:** #9 (parcial)
- **Risco estimado:** baixo
- **Depende de:** Ciclo 7 (mesmo padrão de fixture)
- **Comando:** `/tdd-abrir "Parser de CTe autorizado e registro de desacordo com fixtures"`

### Ciclo proposto 9 — Testes de contrato para packages/shared

- **Intenção de negócio observável:** Garantir que mudanças em packages/shared não quebrem consumidores
- **Módulo:** shared
- **Camada:** contract
- **Gaps cobertos:** #10, #13
- **Risco estimado:** baixo
- **Depende de:** Ciclo 6 (CLAUDE.md do shared para invariantes)
- **Comando:** `/tdd-abrir "Testes de contrato para exports de packages/shared"`

### Ciclo proposto 10 — Benchmark baseline para xml-parser

- **Intenção de negócio observável:** Estabelecer baseline de performance do parser para detectar regressões
- **Módulo:** xml-parser
- **Camada:** benchmark
- **Gaps cobertos:** #12
- **Risco estimado:** baixo
- **Depende de:** Ciclo 7 (fixtures disponíveis)
- **Comando:** `/tdd-abrir "Criar benchmark baseline para xml-parser com NFe, CTe e MDFe"`

---

## 7. Perguntas ao humano (Fase 6)

1. **jq não está instalado** — os hooks que dependem de jq estão falhando silenciosamente? Deseja instalar (`choco install jq` ou `scoop install jq`) antes de iniciar ciclos?
2. **Estrutura de módulos da API** — a maioria dos módulos tem apenas `schemas.ts`, sem `service.ts`, `repository.ts` ou `routes.ts` separados. A lógica está centralizada em `app.ts` ou em outro padrão (ex: rotas inline)? Isso afeta como os ciclos TDD devem ser planejados.
3. **`suporte@fiscalzen.com.br` e `api.fiscalzen.com.br`** foram encontrados em swagger config e test helpers. São URLs de staging/teste ou produção real? Se produção, precisam ser parametrizados via env var.
4. **`packages/cli`** existe no repo mas não consta no `PROJECT_INFO.md` esperado. É ferramenta interna ativa ou legado?
5. **Módulos `certificates`, `nsu`, `pdf`, `webhooks`** não têm schema.ts. Estão em estado inicial de desenvolvimento ou usam schemas de outros módulos?
6. **Referências a `agents/heartbeat`** usam API key em vez de JWT. Isso é intencional (agents são serviços internos com autenticação diferente)?
7. **BullMQ workers** substituem o padrão `worker_threads/piscina` mencionado no backlog. A decisão de usar BullMQ para offloading de XML é definitiva ou o backlog de worker_threads ainda é desejado para parsing CPU-bound?

---

## 8. Próximo passo único

**Ação imediata recomendada:** Instalar `jq` (dependência dos hooks) e, após responder as perguntas acima, aprovar o plano e executar:

```
/tdd-abrir "Verificar assinatura HMAC de webhook com timingSafeEqual"
```

---

*Fim do relatório. Aguardando decisão humana.*
