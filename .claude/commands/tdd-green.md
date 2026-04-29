---
description: Executa a fase GREEN do ciclo TDD atual — implementação mínima para passar o RED
---

Delegue ao subagent `green-implementer`.

Pré-condições:
1. Leia o ciclo ativo em `.claude/cycles/`. Confirme `estado: RED_DONE` e seção RED preenchida.
2. Se o ciclo estiver em outro estado, bloqueie: _"RED ainda não foi concluído. Use `/tdd-red`."_
3. Recupere o hash do teste armazenado no RED. Antes de começar, compare com o hash atual do arquivo de teste. Se diferente, bloqueie: _"Teste RED foi alterado. Isso invalida o ciclo."_

O `green-implementer` deve:
- Ler o teste RED.
- Implementar o mínimo para fazê-lo passar.
- Não exceder **60 linhas líquidas** sem justificativa no ciclo.
- Rodar `pnpm test --filter=<pacote>` e `pnpm typecheck --filter=<pacote>`.
- Se algum teste de outro módulo quebrar, parar e reportar.
- Registrar na seção GREEN: arquivos tocados (lista), diff size, output final do teste, "nenhuma abstração nova?".
- Atualizar `estado` do frontmatter para `GREEN_DONE`.

Se a implementação natural exigir:
- mudança de schema Drizzle → devolver e instruir uso de `/db-migration-check`;
- mudança em contrato compartilhado → devolver ao `contract-db-guardian` via `/audit-contract`;
- trabalho em SEFAZ/XML → delegar ao `sefaz-xml-specialist`.

Fim do turno após a fase GREEN. Não avance ao VERIFY automaticamente.
