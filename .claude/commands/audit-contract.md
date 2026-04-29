---
description: Verifica se o diff atual quebra contratos REST, webhook ou tipos compartilhados
---

Delegue ao subagent `contract-db-guardian`.

Escopo: `git diff origin/main...HEAD` — ou seja, **tudo** que mudou desde a branch principal.

Se o repositório estiver num commit de `main`/`master`, usar `git diff HEAD` + staged.

O `contract-db-guardian` deve:
1. Identificar arquivos tocados em:
   - `apps/api/src/modules/**/routes.ts`
   - `apps/api/src/modules/**/*.schema.ts`
   - `packages/shared/src/**`
   - `packages/database/schema/**`
   - `packages/database/migrations/**`
   - qualquer tipo ou schema com `export` reutilizado.
2. Para cada rota: comparar request/response schema antes/depois. Detectar breaking (campo removido, tipo alterado, obrigatório novo, status code diferente, formato de erro diferente).
3. Para cada evento de webhook: confirmar versão, retrocompat, schema `.strict()`.
4. Para cada símbolo alterado em `@fiscalzen/shared`: grep por uso em `apps/api` e `apps/web`; se consumidor não foi atualizado no mesmo diff, bloquear.
5. Para migrations: rodar o checklist de 7 itens (up/down, sem DROP inseguro, índices, tenant, onDelete, unique, rollback).

Emitir parecer estruturado.

Se houver **breaking change não declarado**, responder **BLOQUEADO** e exigir:
- declaração explícita no ciclo TDD que originou a mudança;
- atualização coordenada dos consumidores no mesmo diff;
- entrada em `packages/shared/CHANGELOG.md` com data e descrição.
