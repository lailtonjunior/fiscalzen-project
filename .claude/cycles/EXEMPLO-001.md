---
id: EXEMPLO-001
titulo: (EXEMPLO) Deduplicação de NF-e por chave+tenant em reingestão
modulo: documents
camada: integration
estado: CLOSED
abertura: 2026-04-18T09:10:00-03:00
encerramento: 2026-04-18T12:47:00-03:00
---

> Este arquivo é um **exemplo** didático de ciclo TDD totalmente preenchido, para referência do time.
> Não é um ciclo real. Pode ser deletado ou mantido como template.

## CONTEXTO

- **Intenção de negócio observável:** Ao ingerir um XML NF-e cuja chave de acesso já exista para o mesmo tenant, o sistema não cria um segundo registro e retorna idempotentemente o documento existente com status 200 (não 201).
- **Módulo:** `documents`
- **Camada principal do teste:** integration (persistência real em Postgres de teste)
- **Contratos afetados:** `POST /api/v1/documents` — muda status de 201 para 200 em caso de reingestão. Consumidor (frontend `apps/web`) trata ambos como sucesso; confirmado via grep.
- **Risco de segurança:** baixo. Não altera authz.
- **Risco de tenant isolation:** médio — deduplicação **não** pode ignorar tenant. Tenant A e B podem ter a mesma chave teoricamente (cenário raro: ambos são destinatários). Índice unique deve ser composto.
- **Risco de performance:** baixo, mas vamos adicionar índice composto que melhora consulta por chave.
- **Migration/schema afetado:** sim — `documents` ganha `UNIQUE (chave_acesso, tenant_id)` + índice.
- **Há legado sem cobertura:** sim — não há teste atual de reingestão.
- **Estratégia de rollback:** `git revert <sha>`; migration reversível (`DROP INDEX unique_chave_tenant`).

---

## RED

- **Arquivo de teste criado:** `apps/api/src/modules/documents/tests/ingestion-deduplication.int.test.ts`
- **Nome do it:** `deve_retornar_documento_existente_quando_chave_ja_existir_no_mesmo_tenant`
- **Hash SHA-256 dos primeiros 500 chars do teste:** `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` (exemplo)
- **Output da falha:**

```
FAIL  apps/api/src/modules/documents/tests/ingestion-deduplication.int.test.ts
  × deve_retornar_documento_existente_quando_chave_ja_existir_no_mesmo_tenant

  AssertionError: expected 1 document in database, got 2

    at ingestion-deduplication.int.test.ts:48:11

  Expected: 1
  Received: 2
```

Falha pelo motivo certo (asserção de comportamento, não de fixture/env).

Também adicionado teste de não-vazamento cross-tenant:
- `deve_permitir_mesma_chave_em_tenants_diferentes` — esse **passou** ao escrever (cenário não cobre o bug), e deve continuar passando após GREEN.

---

## GREEN

- **Arquivos tocados:**
  - `apps/api/src/modules/documents/documents.repository.ts` (+12 / -1)
  - `apps/api/src/modules/documents/documents.service.ts` (+6 / -2)
  - `packages/database/schema/documents.ts` (+3 / 0)
  - `packages/database/migrations/0042_unique_chave_tenant.sql` (+8 / 0 — novo)

- **Diff size:** +29 / -3 líquidas.
- **Abstração nova:** nenhuma.
- **Output final do teste:**

```
PASS  apps/api/src/modules/documents/tests/ingestion-deduplication.int.test.ts
  ✓ deve_retornar_documento_existente_quando_chave_ja_existir_no_mesmo_tenant (142ms)
  ✓ deve_permitir_mesma_chave_em_tenants_diferentes (138ms)
```

---

## VERIFY

- Módulo `documents`: 47/47 testes verdes.
- Módulo `webhooks` (afetado — webhook é disparado em criação): 31/31 verdes, **sem** webhook duplicado em reingestão (confirmado).
- Módulo `nsu`: 18/18 verdes.
- `pnpm typecheck` em `@fiscalzen/api` e `@fiscalzen/database`: OK.
- `git diff` em `@fiscalzen/shared`: nenhuma alteração.
- Grep por `.where(` novo: todos com `eq(x.tenantId, ...)`. OK.
- Teste RED não foi alterado (hash confere).

---

## REFACTOR

- Oportunidade aplicada: extração de `findByKeyAndTenant` no repository para eliminar duplicação com `findByKey`. Mantido comportamento.
- Oportunidade adiada para novo ciclo: unificação de erros de documento em `DocumentError` hierárquico (escopo maior).
- Diff adicional: +4 / -6.
- Testes: continuam verdes.

---

## REVIEW

### PARECER SECURITY
**APROVADO.** Nenhuma alteração em auth, authz, storage, ou logging. Migration não expõe dados. `console.log` ausente.

### PARECER TENANT ISOLATION
**APROVADO.**
- Query `findByKeyAndTenant` filtra por tenant.
- Unique constraint **composta** com `tenant_id` — correto.
- Teste cross-tenant presente e passando.
- Webhook de "documento criado" não dispara em reingestão (conferido no módulo webhooks).

### PARECER CONTRACT & DB
**APROVADO COM RESSALVAS.**
- Mudança de status code 201→200 em reingestão é **semanticamente correta** e documentada; frontend Next já trata como sucesso.
- Migration `0042_unique_chave_tenant.sql` revisada:
  - [x] up/down presentes
  - [x] sem DROP inseguro
  - [x] índice composto `(chave_acesso, tenant_id)`
  - [x] unique composto
  - [x] rollback testado localmente
  - [ ] Ressalva: documentar em `packages/database/CHANGELOG.md` que a constraint é nova — **já feito**.

---

## CLOSE — DoD

### A. Ciclo
- [x] Intenção única
- [x] RED registrado
- [x] GREEN mínimo
- [x] VERIFY executado
- [x] REFACTOR seguro

### B. Testes
- [x] Teste novo antes da implementação
- [x] Falha pelo motivo certo
- [x] Módulo verde
- [x] Sem flaky (rodei 10x local)
- [x] Camada correta (integration)

### C. Domínio FiscalZen
- [x] Tenant isolation preservado (teste cross-tenant)
- [x] Contratos preservados (mudança de status declarada)
- [x] Idempotência preservada (é o próprio objeto do ciclo)
- [x] Segurança preservada
- [x] Observabilidade preservada (log estruturado Pino na reingestão)

### D. Dados e infraestrutura
- [x] Schema avaliado
- [x] Índices avaliados
- [x] Rollback definido
- [x] Nenhum vazamento de segredo

### E. Entrega
- [x] Diff pequeno (< 40 linhas líquidas)
- [x] Riscos residuais documentados
- [x] Sistema potencialmente entregável

---

## Rollback

```bash
# Reverter código
git revert <sha-do-merge>

# Reverter migration
pnpm --filter @fiscalzen/database db:migrate:down -- 0042_unique_chave_tenant

# Em produção, após apply do revert em código:
# PostgreSQL:
#   DROP INDEX IF EXISTS documents_chave_tenant_unique;
```

---

## Backlog do ciclo (oportunidades adiadas)

- Novo ciclo: "Unificar erros de documento em DocumentError hierárquico".
- Novo ciclo: "Emitir evento `document.deduplicated` (novo tipo) via webhook para ERPs que queiram contabilizar tentativas de reingestão".

---

## Mensagem de commit sugerida

```
feat(documents): dedupe reingestão por chave+tenant (idempotente)

Ciclo TDD: EXEMPLO-001
Camada: integration
Diff: +33 / -9 linhas

Comportamento protegido:
- Reingestão de XML NF-e com mesma chave+tenant retorna documento existente (200).
- Permanece permitido para tenants distintos.

Testes:
- documents/tests/ingestion-deduplication.int.test.ts::deve_retornar_documento_existente_quando_chave_ja_existir_no_mesmo_tenant
- documents/tests/ingestion-deduplication.int.test.ts::deve_permitir_mesma_chave_em_tenants_diferentes

Riscos residuais:
- nenhum

Rollback:
- git revert <sha>
- pnpm --filter @fiscalzen/database db:migrate:down -- 0042_unique_chave_tenant

Refs: .claude/cycles/EXEMPLO-001.md
```
