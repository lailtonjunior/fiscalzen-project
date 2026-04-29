---
description: Executa a fase VERIFY — roda a suíte relevante, verifica regressão, contratos e tenant isolation
---

Delegue ao subagent `tdd-orchestrator`.

Pré-condições:
- Ciclo em `estado: GREEN_DONE`.

O `tdd-orchestrator` deve:
1. Rodar `pnpm test --filter=<pacote-do-módulo>` e `pnpm typecheck --filter=<pacote-do-módulo>`.
2. Identificar módulos adjacentes impactados (ex.: mudança em `documents` → checar `webhooks`, `dashboard`, `nsu`). Rodar testes desses pacotes também.
3. Rodar `git diff` e verificar:
   - o arquivo do teste RED **não** foi alterado (hash bate com o registrado);
   - nenhuma mudança silenciosa em `@fiscalzen/shared` — se houver, bloqueia e delega ao `contract-db-guardian`;
   - nenhuma query Drizzle nova sem filtro `tenantId` — se houver, bloqueia e delega ao `tenant-isolation-guard`.
4. Registrar na seção VERIFY:
   - comando executado + resultado;
   - módulos verdes;
   - módulos adjacentes rodados;
   - ausência de regressão contratual;
   - ausência de violação de tenant;
   - observações.
5. Atualizar `estado` para `VERIFY_DONE`.

Se qualquer verificação falhar, reverter estado para `GREEN_DONE` e reportar o problema — o ciclo volta ao green-implementer.

Fim do turno. Próxima fase: `/tdd-refactor` (se houver oportunidade) ou `/tdd-review` (direto).
