---
description: Abre um novo ciclo TDD registrando o CONTEXTO em .claude/cycles/<ID>.md
argument-hint: "<descrição curta da intenção de negócio observável>"
---

Você é um coordenador de processo. Delegue **imediatamente** ao subagent `tdd-orchestrator` a tarefa de:

1. Gerar `ID = YYYY-MM-DD-NNN` (NNN = ordinal do dia, lendo `.claude/cycles/`).
2. Criar `.claude/cycles/<ID>.md` com o frontmatter e template definido no system prompt do `tdd-orchestrator`.
3. Preencher o campo `titulo` com: **$ARGUMENTS**.
4. Guiar o usuário a preencher cada item da seção CONTEXTO **antes** de liberar a fase RED:
   - Intenção de negócio observável
   - Módulo
   - Camada principal do teste (unit/integration/contract/e2e)
   - Contratos afetados
   - Risco de segurança
   - Risco de tenant isolation
   - Risco de performance
   - Migration/schema afetado
   - Legado sem cobertura?
   - Estratégia de rollback

5. Se qualquer item ficar "TBD" ou vago, bloqueie com: _"CONTEXTO incompleto. Não posso avançar ao RED."_

Não execute fases além de CONTEXTO. Só grave em `.claude/cycles/**`.
