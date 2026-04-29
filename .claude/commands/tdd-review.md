---
description: Executa a fase REVIEW — chama em paralelo os três auditores (security, tenant, contract) e consolida parecer
---

Pré-condições:
- Ciclo em `estado: VERIFY_DONE` ou `REFACTOR_DONE`.

Invoque **em paralelo** (uma única mensagem com 3 chamadas de ferramenta):

1. **`security-auditor`** — passe como entrada o `git diff` do ciclo e o ID do ciclo. Produz "PARECER SECURITY".
2. **`tenant-isolation-guard`** — passe o mesmo diff. Produz "PARECER TENANT ISOLATION".
3. **`contract-db-guardian`** — passe o mesmo diff. Produz "PARECER CONTRACT & DB".

Execução em paralelo é obrigatória (reduz tempo e mantém independência analítica).

Após receber os 3 pareceres, o agente principal deve:
- Concatenar os três na seção REVIEW do ciclo.
- Se qualquer um emitir **BLOQUEADO**, setar `estado` para `REVIEW_BLOCKED` e parar.
- Se os três estiverem **APROVADO** ou **APROVADO COM RESSALVAS**, setar `estado` para `REVIEW_DONE` e liberar `/tdd-close`.
- Ressalvas viram itens para o próximo ciclo (registradas em `## Backlog do ciclo` no final do arquivo).

Fim do turno.
