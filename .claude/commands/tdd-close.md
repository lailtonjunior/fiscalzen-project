---
description: Fecha o ciclo TDD — valida DoD completa, grava encerramento e imprime checklist de PR
---

Delegue ao subagent `tdd-orchestrator`.

Pré-condições:
- Ciclo em `estado: REVIEW_DONE`.
- Os três pareceres (security, tenant, contract) estão como APROVADO ou APROVADO COM RESSALVAS.

O `tdd-orchestrator` deve:

1. **Validar DoD completa** (artigo 17 da política v2). Para cada item do checklist A-E, confirmar com evidência no ciclo:
   - A. Ciclo: intenção única, RED, GREEN, VERIFY, REFACTOR
   - B. Testes: teste novo antes, falha correta, módulo verde, sem flaky, camada correta
   - C. Domínio: tenant, contratos, idempotência, segurança, observabilidade
   - D. Dados/infra: schema avaliado, índices avaliados, rollback definido, sem vazamento
   - E. Entrega: diff pequeno, riscos documentados, sistema entregável

2. Se **qualquer** item não puder ser marcado com evidência: bloquear com _"DoD incompleta. Faltando: <itens>."_

3. **Preencher seção Rollback** com comandos executáveis (não descrição textual), por exemplo:
   ```bash
   git revert <sha>
   pnpm --filter @fiscalzen/database db:migrate:down -- <migration-id>
   ```

4. Atualizar frontmatter: `estado: CLOSED`, `encerramento: <ISO timestamp>`.

5. **Gerar mensagem de commit e corpo de PR** sugeridos, no formato:

   ```
   <type>(<módulo>): <título curto>
   
   Ciclo TDD: <ID>
   Camada: <camada>
   Diff: +X / -Y linhas
   
   Comportamento protegido:
   - <intenção>
   
   Testes:
   - <arquivo>::<nome do it>
   
   Riscos residuais:
   - <se houver>
   
   Rollback:
   - <comandos>
   
   Refs: .claude/cycles/<ID>.md
   ```

6. **Imprimir resumo final** na conversa:
   - ID do ciclo
   - estado final: CLOSED
   - sugestão de comando `git add` + `git commit` (sem executar — o humano aprova)
   - lembrete: `git push` para `main`/`master`/`production` está bloqueado por hook; criar branch com `git checkout -b feat/cycle-<ID>` se ainda não estiver.

Fim do turno. Não execute `git push`. Não abra PR automaticamente (deixe para o humano via `gh pr create` ou MCP do GitHub, com aprovação explícita).
