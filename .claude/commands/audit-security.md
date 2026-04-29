---
description: Auditoria stand-alone de segurança em um path, módulo ou diff
argument-hint: "<path ou 'diff' para analisar git diff atual>"
---

Delegue ao subagent `security-auditor`.

Escopo: **$ARGUMENTS**

Regras:
- Se o argumento for `diff` ou vazio: escopo é `git diff HEAD` (working tree) + `git diff --cached` (staged).
- Se for um path: ler todos os arquivos relevantes desse path.
- Se for um nome de módulo (ex: `webhooks`): resolver para `apps/api/src/modules/<módulo>` e `packages/<módulo>` se existir.

O `security-auditor` deve:
1. Passar por todos os 12 itens da superfície de ataque do seu system prompt.
2. Para cada item, marcar aplicável/não/investigar e anexar evidência (arquivo:linha).
3. Emitir parecer estruturado com achados por severidade (Crítico / Alto / Médio / Baixo).

Se encontrar bloqueio imediato (log com segredo, `.env` tocado, rota sem auth, HMAC sem timing-safe compare, etc.), responder com **BLOQUEADO** e instruir:
- Abrir ciclo de correção imediato com `/tdd-abrir "<descrição da correção>"`.
- Se for vazamento já comitado, alertar para rotação imediata de segredo afetado.

O parecer **não grava em ciclo** automaticamente — auditoria avulsa.
