---
description: Executa a fase REFACTOR — limpa sem mudar comportamento, com testes verdes como rede de segurança
argument-hint: "[escopo sugerido, opcional — ex: 'extrair DedupePolicy']"
---

Delegue ao subagent `refactor-engineer`.

Pré-condições:
- Ciclo em `estado: VERIFY_DONE`.
- Todos os testes relevantes estão verdes (confirmar novamente antes de começar).

Escopo sugerido: **$ARGUMENTS** (ou proposto pelo refactor-engineer se vazio).

O `refactor-engineer` deve:
1. Rodar baseline: `pnpm test --filter=<pacote>`.
2. Listar no ciclo as **no máximo 3** oportunidades escolhidas (o resto vira novo ciclo).
3. Aplicar **uma** alteração por vez; rodar testes após cada uma; reverter qualquer alteração que deixar vermelho.
4. Registrar na seção REFACTOR:
   - oportunidades executadas;
   - oportunidades adiadas para novo ciclo;
   - diff size;
   - testes no final: verdes.
5. Atualizar `estado` para `REFACTOR_DONE`.

Se não houver oportunidade de refactor segura, registre "REFACTOR_DONE: nenhuma oportunidade aplicável neste ciclo" e siga em frente.

Fim do turno. Próxima fase: `/tdd-review`.
