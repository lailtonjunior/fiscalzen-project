---
description: Executa a fase RED do ciclo TDD atual — escreve o teste menor que falha pelo motivo certo
argument-hint: "[caminho sugerido para o arquivo de teste, opcional]"
---

Delegue ao subagent `red-writer`.

Contexto obrigatório:
1. Identifique o ciclo ativo lendo o arquivo mais recente em `.claude/cycles/` com `estado: CONTEXTO` ou `estado: RED_STARTED`.
2. Se não houver ciclo ativo, bloqueie: _"Nenhum ciclo aberto. Use `/tdd-abrir <descrição>`."_

Passe ao `red-writer`:
- O conteúdo completo da seção CONTEXTO.
- A camada declarada.
- A sugestão de caminho: **$ARGUMENTS** (opcional).

O `red-writer` deve:
- Escrever **um** teste no caminho correto.
- Rodar o teste filtrado.
- Confirmar falha pelo motivo certo (asserção, não import/env/fixture).
- Registrar na seção RED do ciclo: caminho, nome do `it`, output da falha (primeiras 20 linhas), hash SHA-256 dos primeiros 500 chars do teste.
- Atualizar `estado` do frontmatter para `RED_DONE`.

Se o teste passar na primeira execução, devolver como inválido (_"Falso RED"_).

Fim do turno após a fase RED. Não avance ao GREEN automaticamente.
