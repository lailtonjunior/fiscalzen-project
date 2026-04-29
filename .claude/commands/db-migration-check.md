---
description: Revisa a migration Drizzle pendente ou recente — rollback, índices, impacto, multi-tenant
argument-hint: "[nome da migration ou path, opcional]"
---

Delegue ao subagent `contract-db-guardian`.

Escopo:
- Se **$ARGUMENTS** fornecido: resolver para `packages/database/migrations/<arquivo>`.
- Se vazio: pegar a migration mais recente por `ls -t packages/database/migrations/`.

O `contract-db-guardian` deve rodar o checklist de migration do seu system prompt, com ênfase extra em:

1. **`up` e `down` presentes e corretos.**
2. **Sem `DROP COLUMN` / `DROP TABLE` em tabela que ainda recebe escrita.** Se existir, exigir padrão em 2 deploys:
   - Deploy 1: parar de escrever na coluna/tabela (ciclo TDD anterior).
   - Deploy 2: DROP (este ciclo).
3. **Adição de coluna:** precisa de `default` **ou** `nullable` **ou** justificativa explícita (tabela comprovadamente vazia).
4. **Índices:**
   - Tabela multi-tenant: índice composto começando por `tenant_id`.
   - Colunas usadas em `where` de worker recorrente (ex.: `certificate_expiry`, `nsu_cursor`, `webhook_status`) precisam de índice.
   - Unique compostos: `(chave_acesso, tenant_id)`, `(webhook_id, event_id)`, etc.
5. **Foreign key + `onDelete`:** explicitar `cascade | restrict | set null`.
6. **Plano de execução estimado** em tabelas grandes: se a migration rodar `ALTER TABLE` com rewrite em tabela de produção, sinalizar como **alto risco** e exigir estratégia de rollout (`CREATE INDEX CONCURRENTLY` quando PostgreSQL, batch update, etc.).
7. **Rollback testado localmente:**
   ```bash
   pnpm --filter @fiscalzen/database db:migrate      # up
   pnpm --filter @fiscalzen/database db:migrate:down # down
   pnpm --filter @fiscalzen/database db:migrate      # up de novo
   ```
   Se qualquer passo falhar, **BLOQUEADO**.

Emitir parecer estruturado. Se BLOQUEADO, sugerir comando `/tdd-abrir` com título da correção.

Se estiver dentro de um ciclo TDD ativo, anexar parecer à seção REVIEW do ciclo.
