# CLAUDE TDD POLICY — FISCALZEN v2.0

> Política operacional permanente para desenvolvimento guiado por testes
> **Produto:** FiscalZen — SaaS multi-tenant de recepção e monitoramento de DF-e (NF-e, CT-e, MDF-e, NFS-e)
> **Stack:** Node.js 20 · TypeScript 5.3 · Fastify 4 · Next.js 14 · PostgreSQL 16 · Drizzle ORM · Redis/BullMQ · Meilisearch · MinIO/S3 · tsyringe · Vitest
> **Execução:** Claude Code CLI (subagents, slash commands, hooks, MCP, skills)

---

## 0. Diferenças da v2 em relação à v1

A v1 era **política de engenharia**. A v2 mantém a política e adiciona a **camada operacional do Claude Code** — ou seja, como o agente efetivamente executa cada fase sem conseguir atalho.

| Área | v1 | v2 |
|---|---|---|
| Ciclo TDD | CONTEXTO → RED → GREEN → VERIFY → REFACTOR → REVIEW → CLOSE | idem, com **gate automatizado por hook** |
| Atribuição | Claude genérico | **9 subagents especializados** com prompt próprio |
| Execução | prompt livre | **slash commands** por fase (`/tdd-red`, `/tdd-green`, …) |
| Governança | regras textuais | **hooks** (PreToolUse, PostToolUse, UserPromptSubmit, Stop) |
| Contexto | anexos manuais | **CLAUDE.md hierárquico** + MCP servers |
| Evidência | descritiva | **logs de ciclo versionados** em `.claude/cycles/` |
| Escopo | descrito | **permissões explícitas** por pasta (allow/deny) |

Se houver conflito entre a v1 e a v2, **a v2 prevalece**.

---

## 1. Identidade da política

Esta política não é sugestão. Ela define como **toda** mudança de comportamento deve ser concebida, testada, implementada, revisada e encerrada.

**CONTEXTO → RED → GREEN → VERIFY → REFACTOR → REVIEW → CLOSE**

- Sem RED válido, não existe TDD.
- Sem evidência reproduzível, não existe fechamento.
- Sem segurança, isolamento de tenant, rastreabilidade e rollback, o ciclo não está pronto.
- Sem registro em `.claude/cycles/<ID>.md`, o ciclo **não conta**.

---

## 2. Objetivo do Claude Code neste repositório

Claude Code deve atuar como engenheiro sênior executor de ciclos TDD pequenos, reversíveis e auditáveis — **nunca** como autor livre.

**Deve:**
- proteger comportamento de negócio antes de implementar;
- preservar isolamento multi-tenant;
- manter compatibilidade contratual da API e dos webhooks;
- impedir evolução descontrolada do monorepo;
- produzir mudanças vendáveis, operáveis e sustentáveis;
- **delegar** cada fase do ciclo ao subagent correto.

**Não deve:**
- improvisar design sem teste;
- expandir escopo no meio do ciclo;
- criar abstrações prematuras;
- alterar contratos sem ciclo explícito;
- afirmar aderência ao TDD sem evidência versionada;
- tocar `.env`, certificados `.pfx`, `packages/security/secrets/` ou qualquer chave criptográfica;
- usar `--dangerously-skip-permissions` para contornar gates.

---

## 3. Regra-mãe

Cada ciclo cobre **uma única intenção de negócio observável**.

**Válido:**
- "Ao receber XML NF-e válido, persistir bruto no storage e metadados no PostgreSQL."
- "Ao reenfileirar webhook já entregue com mesmo idempotency key, não duplicar envio."
- "Ao consultar dashboard de tenant sem permissão, retornar 403 sem vazar dados."

**Inválido:**
- "Melhorar módulo documents"
- "Refatorar integração com SEFAZ"
- "Deixar dashboard mais rápido"
- "Aproveitar e corrigir webhooks junto"

---

## 4. Ciclo operacional no Claude Code CLI

### 4.1 Mapa de fases × subagents × comandos

| Fase | Subagent responsável | Slash command | Saída obrigatória |
|---|---|---|---|
| CONTEXTO | `tdd-orchestrator` | `/tdd-abrir` | `.claude/cycles/<ID>.md` com template preenchido |
| RED | `red-writer` | `/tdd-red` | teste(s) novo(s) + output de falha registrado |
| GREEN | `green-implementer` | `/tdd-green` | diff mínimo + teste passando |
| VERIFY | `tdd-orchestrator` | `/tdd-verify` | suíte relevante verde + sem regressão |
| REFACTOR | `refactor-engineer` | `/tdd-refactor` | diff sem mudança de comportamento |
| REVIEW | `security-auditor` + `tenant-isolation-guard` + `contract-db-guardian` (em paralelo) | `/tdd-review` | parecer de cada auditor |
| CLOSE | `tdd-orchestrator` | `/tdd-close` | DoD 100% + ciclo arquivado |

### 4.2 Fluxo padrão de uma sessão

```bash
# 1. Iniciar Claude Code na raiz do repo
claude

# 2. Abrir ciclo (vai invocar tdd-orchestrator)
/tdd-abrir "Deduplicação de NF-e por chave de acesso em reingestão"

# 3. Fase RED (vai delegar a red-writer)
/tdd-red

# 4. Fase GREEN (vai delegar a green-implementer)
/tdd-green

# 5. VERIFY
/tdd-verify

# 6. REFACTOR (se necessário)
/tdd-refactor

# 7. REVIEW em paralelo
/tdd-review

# 8. CLOSE
/tdd-close
```

Nenhuma fase pode ser pulada. Nenhuma fase pode ser executada sem o subagent correto.

### 4.3 Quando usar subagent × quando usar agente principal

- **Subagent**: fases do ciclo, auditorias especializadas, análise focada que precisa de contexto limpo (context-isolation).
- **Agente principal**: orquestração geral, decisões de produto, conversa com o desenvolvedor humano, leitura de CLAUDE.md hierárquico.

Se uma tarefa exige mais de 1 leitura de arquivo grande e os achados serão descartados (ex.: auditar segurança de um módulo), **use subagent** para não queimar contexto do agente principal.

---

## 5. Os 9 subagents obrigatórios

Os arquivos vivem em `.claude/agents/*.md`. Cada um tem system prompt próprio, `tools` restritas e `model` definido.

| Subagent | Papel | Ferramentas | Model |
|---|---|---|---|
| `tdd-orchestrator` | Abre, conduz e fecha o ciclo. Nunca escreve código de produção. | Read, Grep, Glob, Write (só em `.claude/cycles/**`), Bash (só `pnpm test`, `pnpm lint`) | opus |
| `red-writer` | Escreve o teste que falha pelo motivo certo. Nunca implementa. | Read, Grep, Glob, Write (só em `**/*.test.ts`, `**/*.spec.ts`, `tests/**`), Bash (`pnpm test`) | sonnet |
| `green-implementer` | Faz o teste passar com o menor diff possível. | Read, Grep, Glob, Edit, Write (proibido em `.env`, `docker/**`, `packages/security/secrets/**`), Bash (`pnpm test`, `pnpm typecheck`) | sonnet |
| `refactor-engineer` | Refatora sem alterar comportamento observável. | Read, Grep, Glob, Edit, Bash (`pnpm test`) | sonnet |
| `security-auditor` | Audita auth, JWT, certificados, HMAC, storage, logs sensíveis. Só lê. | Read, Grep, Glob, Bash (`git diff`) | opus |
| `tenant-isolation-guard` | Audita boundary multi-tenant em queries, jobs, webhooks, busca. Só lê. | Read, Grep, Glob, Bash (`git diff`) | opus |
| `sefaz-xml-specialist` | Domina SEFAZ, NSU, DistDFe, mTLS, parsing XML. Gera fixtures realistas. | Read, Grep, Glob, Write (só em `tests/fixtures/**`, `packages/sefaz-client/**`, `packages/xml-parser/**`) | opus |
| `contract-db-guardian` | Protege contratos REST, webhooks, tipos `@fiscalzen/shared`, migrations. | Read, Grep, Glob, Bash (`pnpm db:generate`, `git diff`) | opus |
| `performance-analyst` | Avalia event loop, queries, latência, throughput de fila. Só lê. | Read, Grep, Glob, Bash (`pnpm bench`) | sonnet |

**Regras transversais dos subagents:**
- Todos têm `model: sonnet` por padrão, exceto os que fazem auditoria profunda ou integração SEFAZ (opus).
- Nenhum subagent tem permissão para escrever em `.env`, `.env.*`, `*.pfx`, `*.key`, `*.pem`, `packages/security/secrets/**`, `/etc/**`, `~/.ssh/**`.
- Nenhum subagent pode rodar comandos destrutivos em banco (`DROP`, `TRUNCATE`, `DELETE FROM` sem WHERE).
- Nenhum subagent pode acessar URLs de produção (enforçado via hook PreToolUse).

---

## 6. Slash commands obrigatórios

Os comandos vivem em `.claude/commands/*.md`. Cada um é um prompt parametrizado que delega ao subagent correto.

| Comando | O que faz | Delega para |
|---|---|---|
| `/tdd-abrir <descrição>` | Cria `.claude/cycles/<ID>.md` com template de abertura preenchido | `tdd-orchestrator` |
| `/tdd-red` | Escreve o teste menor capaz de expressar o comportamento e confirma que falha pelo motivo certo | `red-writer` |
| `/tdd-green` | Implementa o mínimo para passar o RED, sem expandir escopo | `green-implementer` |
| `/tdd-verify` | Roda suíte do módulo + módulos afetados + checa regressão contratual e tenant isolation | `tdd-orchestrator` |
| `/tdd-refactor [escopo]` | Refatora sem alterar comportamento; aborta se testes ficarem vermelhos | `refactor-engineer` |
| `/tdd-review` | Chama os 3 auditores em paralelo e consolida o parecer | `security-auditor`, `tenant-isolation-guard`, `contract-db-guardian` |
| `/tdd-close` | Valida DoD completa, grava encerramento, imprime checklist de PR | `tdd-orchestrator` |
| `/audit-tenant <módulo>` | Auditoria stand-alone de multi-tenancy num módulo | `tenant-isolation-guard` |
| `/audit-security <path\|diff>` | Auditoria stand-alone de segurança | `security-auditor` |
| `/audit-contract` | Verifica se diff quebra contratos REST/webhook/tipos compartilhados | `contract-db-guardian` |
| `/db-migration-check` | Revisa migration Drizzle: rollback, índices, impacto, tenant-aware | `contract-db-guardian` |
| `/perf-analyze [arquivo/função]` | Analisa impacto em event loop, N+1, fan-out, parsing síncrono | `performance-analyst` |
| `/sefaz-fixture <tipo> <cenário>` | Gera fixture mínima de XML SEFAZ para uso em teste | `sefaz-xml-specialist` |

---

## 7. Hooks de governança

Os hooks vivem em `.claude/settings.json` e `.claude/hooks/`. São a cerca que garante que a política não seja contornada mesmo por prompt mal-intencionado.

### 7.1 PreToolUse
- **Bloquear escrita** em: `.env*`, `*.pfx`, `*.key`, `*.pem`, `*.p12`, `packages/security/secrets/**`, `~/.ssh/**`, `/etc/**`.
- **Bloquear Bash** contendo: `rm -rf /`, `DROP DATABASE`, `TRUNCATE`, conexões a hosts que contenham `prod`, `production`, `live`, `fiscalzen.com.br` (exceto subdomínios de docs).
- **Bloquear git push** para branches `main`, `master`, `production`, `release/*`.

### 7.2 PostToolUse
- Após `Edit`/`Write` em `*.ts`/`*.tsx`: rodar `pnpm typecheck --filter` do pacote afetado e `pnpm lint --fix` no arquivo.
- Após `Edit` em `packages/database/schema/**`: lembrar o agente de rodar `/db-migration-check` antes de fechar o ciclo.

### 7.3 UserPromptSubmit
- Se o prompt contiver "implementar", "adicionar feature", "corrigir bug" **sem** menção a RED/teste/ciclo **e** não houver ciclo aberto em `.claude/cycles/`, injetar um lembrete:
  > "Nenhum ciclo TDD aberto detectado. Use `/tdd-abrir <descrição>` antes de codificar. Se esta for uma tarefa não-TDD (docs, config), declare explicitamente."

### 7.4 SessionStart
- Carregar o último ciclo aberto (se houver) e mostrar seu estado.
- Imprimir lembrete das regras absolutas de segurança.

### 7.5 Stop
- Se houver ciclo aberto em estado diferente de `CLOSED`, avisar que a sessão está encerrando com ciclo pendente.

---

## 8. Permissões (`.claude/settings.json`)

### 8.1 Permissões globais
```json
{
  "permissions": {
    "allow": [
      "Bash(pnpm test*)",
      "Bash(pnpm lint*)",
      "Bash(pnpm typecheck*)",
      "Bash(pnpm build*)",
      "Bash(pnpm db:generate*)",
      "Bash(pnpm db:push*)",
      "Bash(git status)",
      "Bash(git diff*)",
      "Bash(git log*)",
      "Bash(git add*)",
      "Bash(git commit*)",
      "Bash(git branch*)",
      "Bash(git checkout -b *)",
      "Read(**)",
      "Edit(apps/**)",
      "Edit(packages/**)",
      "Edit(tests/**)",
      "Edit(docs/**)",
      "Edit(.claude/cycles/**)"
    ],
    "deny": [
      "Bash(rm -rf /*)",
      "Bash(*DROP DATABASE*)",
      "Bash(*TRUNCATE*)",
      "Bash(git push origin main*)",
      "Bash(git push origin master*)",
      "Bash(git push origin production*)",
      "Bash(curl *prod*)",
      "Bash(curl *production*)",
      "Edit(.env)",
      "Edit(.env.*)",
      "Edit(**/*.pfx)",
      "Edit(**/*.key)",
      "Edit(**/*.pem)",
      "Edit(**/*.p12)",
      "Edit(packages/security/secrets/**)",
      "Write(/etc/**)",
      "Read(~/.ssh/**)"
    ]
  }
}
```

### 8.2 Cultura "Ask-first"
Para qualquer comando não listado em `allow`, Claude Code pergunta antes de executar. **Nunca** use `--dangerously-skip-permissions` em sessões deste repo.

---

## 9. MCP servers recomendados

| MCP | Finalidade | Quando conectar |
|---|---|---|
| `postgres` (Anthropic) | Inspecionar schema, rodar queries read-only contra `fiscalzen_test` | Fase VERIFY, `/db-migration-check`, `performance-analyst` |
| `github` (Anthropic) | Abrir PRs, ler issues, comentar revisões | Fase CLOSE |
| `filesystem` (nativo) | Já vem no Claude Code | sempre |
| `sentry` | Correlacionar mudança com erros de staging | REVIEW |
| Custom `sefaz-mock` | Proxy local para fixtures SEFAZ sem tocar produção | `sefaz-xml-specialist` |

**Regra absoluta:** todos os MCP apontam para ambientes de **teste/staging**. Nenhum MCP neste projeto deve ter credencial de produção. Credenciais vivem em `~/.config/claude/*` fora do repo.

---

## 10. Skills aplicáveis

Skills são pacotes de instrução reutilizável (`SKILL.md`). Para este projeto, recomendamos as seguintes **skills locais** em `.claude/skills/` (ou nível user):

| Skill | Propósito |
|---|---|
| `tdd-cycle-runner` | Encapsula o protocolo do ciclo (templates de abertura/encerramento, critérios de gate). Carregada automaticamente quando qualquer comando `/tdd-*` roda. |
| `sefaz-fixture-builder` | Gera fixtures mínimas e sanitizadas de NF-e/CT-e/MDF-e a partir de cenários (autorizado, cancelado, com desacordo, resumo). |
| `tenant-isolation-tester` | Gera conjunto-padrão de testes de boundary multi-tenant para qualquer endpoint novo. |
| `drizzle-migration-reviewer` | Lista checagens obrigatórias para migrations (rollback, índice, constraint, tenant column). |
| `pino-log-migrator` | Converte `console.log` em log estruturado Pino com correlação request/job. |

**Não** use skills de criação de documento (`docx`, `pptx`, `pdf`) no caminho de engenharia — elas são para entregáveis de usuário, não para código.

---

## 11. CLAUDE.md hierárquico

A "memória" do Claude Code é um conjunto de arquivos `CLAUDE.md` em vários níveis. Cada nível filtra o que o agente vê.

```
/ (repo root)
├── CLAUDE.md                        ← visão geral, stack, convenções do monorepo
├── apps/
│   ├── api/CLAUDE.md                ← convenções Fastify, estrutura de módulos, DI
│   └── web/CLAUDE.md                ← convenções Next.js 14 App Router, UI
└── packages/
    ├── database/CLAUDE.md           ← regras Drizzle, nomenclatura, migrations
    ├── sefaz-client/CLAUDE.md       ← SEFAZ SOAP, mTLS, NSU, timeouts, retry
    ├── xml-parser/CLAUDE.md         ← pipeline, GZIP, workers, limites
    ├── security/CLAUDE.md           ← A1, HMAC, JWT, segredos, logs proibidos
    └── shared/CLAUDE.md             ← zod schemas, tipos contratuais
```

Regra prática: o CLAUDE.md da raiz é **enxuto** e aponta para os específicos. Evite duplicar regras.

---

## 12. Registro de ciclo (`.claude/cycles/<ID>.md`)

Todo ciclo vira um arquivo versionado com frontmatter. Exemplo:

```markdown
---
id: 2026-04-18-001
titulo: Deduplicação de NF-e por chave de acesso em reingestão
modulo: documents
camada: integration
estado: CLOSED
abertura: 2026-04-18T09:10:00-03:00
encerramento: 2026-04-18T12:47:00-03:00
---

## CONTEXTO
...

## RED
- Teste: apps/api/src/modules/documents/tests/deduplication.int.test.ts
- Falha registrada: "expected 1 document, got 2"
- Motivo: reingestão não checa unique(chaveAcesso, tenantId)

## GREEN
- Diff: +18 -2 linhas em documents.repository.ts e migration add-unique-chave-tenant.ts
- Testes do módulo: 42/42 verdes

## VERIFY
- Módulo documents: verde
- Módulo webhooks (afetado por relação): verde
- Regressão contratual: nenhuma
- Tenant isolation: preservado (teste com 2 tenants)

## REFACTOR
- Extração de DedupePolicy em documents/policies/dedupe.ts
- Sem mudança de comportamento

## REVIEW
- security-auditor: OK
- tenant-isolation-guard: OK (conferido índice composto com tenant_id)
- contract-db-guardian: OK (migration reversível, rollback documentado)

## CLOSE — DoD
[x] Ciclo único
[x] RED registrado
[x] GREEN mínimo
[x] VERIFY executado
[x] REFACTOR seguro
[x] Tenant isolation
[x] Contratos preservados
[x] Idempotência preservada
[x] Segurança preservada
[x] Observabilidade preservada
[x] Schema avaliado
[x] Índice criado e avaliado
[x] Rollback definido
[x] Nenhum vazamento
[x] Diff pequeno
[x] Riscos residuais documentados
[x] Sistema potencialmente entregável

## Rollback
- Reverter migration `drop index unique_chave_tenant;`
- Reverter commit único `git revert <sha>`
```

Esses arquivos **fazem parte do histórico do projeto** e são fonte primária de auditoria.

---

## 13. Princípios obrigatórios (herança v1, mantidos)

1. Teste antes do código.
2. O RED deve falhar pelo motivo certo.
3. O GREEN deve ser mínimo.
4. O REFACTOR não pode alterar comportamento observável.
5. Segurança, multi-tenancy, idempotência e auditabilidade fazem parte do comportamento correto.
6. Todo ciclo deve terminar com o sistema em estado potencialmente entregável.
7. Código CPU-bound não pode degradar o event loop sem evidência e sem mitigação.
8. Workers, filas e integrações externas exigem testes específicos de resiliência e concorrência.
9. Console improvisado não é observabilidade.
10. Cobertura sem efetividade não vale como evidência.

---

## 14. Camadas de teste (herança v1, mantidos)

### 14.1 Unitário
Validação de payload, normalização, cálculo, política de authz, deduplicação, classificação de eventos, mapeamento XML → modelo, idempotência, HMAC, parsing de datas/chaves/CNPJ.

### 14.2 Integração
`documents`+banco+storage, `manifestacao`+eventos, `certificates`+banco+scheduler, `dashboard`+queries+cache, `webhooks`+assinatura+fila, `nsu` cursor, `downloads` lote, `jobs` enfileiramento, `relations`/`comments`/`tags` com tenant.

### 14.3 Contrato
Endpoints consumidos pelo Next.js, payloads de webhook, paginação, erros padronizados, eventos internos, adapters SEFAZ/NFS-e.

### 14.4 E2E (curtos, críticos)
1. auth → tenant → listagem segura;
2. ingestão DF-e → persistência → indexação → dashboard;
3. manifestação → evento → atualização;
4. webhook cadastrado → evento → entrega assinada;
5. upload cert → alerta futuro.

---

## 15. Regras de domínio FiscalZen (resumo; completo na v1)

| Área | Regra-chave |
|---|---|
| Multi-tenancy | Isolamento absoluto em leitura, escrita, jobs, webhooks, busca. Violação = falha crítica. |
| Documentos | XML bruto + metadados consistentes, deduplicação por chave+tenant, sem órfãos. |
| NSU/SEFAZ | Nunca avançar NSU sem confirmação do lote; idempotência em reconsulta. |
| Parsing XML | Proteger descompressão, tipo detectado, XML inválido, offloading quando CPU-bound. |
| Certificados A1 | Alertas 30/15/7/1 dias, adapter LCR/OCSP desacoplado, **zero** conteúdo sensível em log. |
| Webhooks | HMAC correto, retry seguro, idempotência, isolamento, payload versionado. |
| Dashboard/cache | Coerência cache↔banco, TTL, invalidação, sem cross-tenant. |
| Jobs/BullMQ | Enfileiramento, backoff, retry, idempotência de consumo, isolamento. |
| Busca | Indexa só tenant correto, nunca é fonte de authz. |
| Observabilidade | Pino estruturado, correlação request/job, sem segredo, sem XML completo em log. |

---

## 16. Segurança obrigatória

Tratar como risco crítico: JWT, authz, tenant selection, A1, webhooks assinados, downloads, storage, env vars, SEFAZ/NFS-e, serialização de erros, conteúdo do cliente.

**Absolutas (enforçadas por hook):**
- Não tocar `.env`, `*.pfx`, `*.key`, `*.pem`.
- Não tocar produção.
- Não enfraquecer auth para passar teste.
- Não abrir endpoint sem autenticação.
- Não confiar em filtro do frontend para segurança.
- Não expor ID previsível.

---

## 17. Definition of Done (sem mudança)

Idêntica à v1. O `/tdd-close` só fecha se **todos** os itens estiverem marcados.

### A. Ciclo
- [ ] Intenção única
- [ ] RED registrado
- [ ] GREEN mínimo
- [ ] VERIFY executado
- [ ] REFACTOR quando necessário

### B. Testes
- [ ] Teste novo antes da implementação
- [ ] Falha pelo motivo certo
- [ ] Módulo verde
- [ ] Sem flaky
- [ ] Camada correta

### C. Domínio
- [ ] Tenant isolation
- [ ] Contratos
- [ ] Idempotência
- [ ] Segurança
- [ ] Observabilidade

### D. Dados/infra
- [ ] Schema avaliado
- [ ] Índices avaliados
- [ ] Rollback definido
- [ ] Sem vazamento

### E. Entrega
- [ ] Diff pequeno
- [ ] Riscos documentados
- [ ] Sistema entregável

---

## 18. Gates de avanço (agora com enforcement)

| De → Para | Evidência mínima | Enforcer |
|---|---|---|
| CONTEXTO → RED | template preenchido em `.claude/cycles/<ID>.md` | `tdd-orchestrator` |
| RED → GREEN | teste novo, falha correta, output registrado | `/tdd-red` grava output |
| GREEN → VERIFY | diff mínimo, teste intacto, módulo verde | `/tdd-green` roda testes |
| VERIFY → REFACTOR | suíte relevante verde | `/tdd-verify` |
| REFACTOR → REVIEW | refactor pequeno, testes verdes | hook PostToolUse |
| REVIEW → CLOSE | 3 pareceres OK | `/tdd-review` agrega |

---

## 19. Violações e consequências (sem mudança)

Idênticas à v1. Qualquer violação crítica invalida o ciclo e é logada em `.claude/violations.log`.

---

## 20. Backlog TDD priorizado (alinhado ao RELATORIO_COMPLETO)

1. **Offloading do XML parser** para Worker Threads + testes de throughput e não-bloqueio (`xml-parser`).
2. **Índices PostgreSQL** faltantes: `certificateExpiry`, `nsuCursor`, `chaveAcesso+tenantId`, `webhook_delivery_status`.
3. **Cache Redis do Dashboard** com TTL e invalidação testados.
4. **Adapter LCR/OCSP** desacoplado com testes de erro transitório e bloqueio seguro.
5. **Pino estruturado** substituindo `console.log` em todo fluxo de produção.
6. **Povoamento de `.context/`** por módulo.
7. **Testes explícitos de idempotência** em webhooks, jobs, ingestão, NSU.
8. **Contratos estáveis** entre API e frontend (shared zod schemas).
9. **Boundary multi-tenant** em todos os endpoints críticos.
10. **Suite de regressão vendável** para demonstração.

Cada item do backlog deve virar **uma issue** e **um ou mais ciclos TDD** — nunca um PR "guarda-chuva".

---

## 21. Regras finais do Claude

Se faltar evidência suficiente:
> **"Não é possível concluir com segurança que este gate foi satisfeito."**

Se o RED falhar pelo motivo errado:
> **"Fluxo bloqueado na fase RED: a falha não representa o comportamento esperado."**

Se houver risco crítico de segurança, tenant isolation, contrato, schema ou dados:
> **"Fluxo bloqueado por risco crítico não resolvido."**

Se o usuário tentar pular fase:
> **"Esta fase não pode ser pulada. Use `/tdd-<fase>` ou declare explicitamente a exceção em `.claude/cycles/<ID>.md`."**

---

**Fim da política. Toda interação com este repositório via Claude Code CLI está vinculada a este documento.**
