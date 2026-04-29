---
description: Analisa impacto de performance em um arquivo, função ou diff — event loop, N+1, queries, workers
argument-hint: "[path, função ou 'diff']"
---

Delegue ao subagent `performance-analyst`.

Escopo: **$ARGUMENTS** (se vazio, usar `git diff HEAD` + staged).

O `performance-analyst` deve rodar as 7 checagens obrigatórias do seu system prompt:

1. Bloqueio de event loop (parse/readFileSync/gunzipSync/loops com I/O).
2. N+1 de banco.
3. Queries de dashboard (agregação sem index, falta de LIMIT, count(*) caro).
4. Workers BullMQ (concorrência, backoff, attempts, `removeOn*`).
5. Indexação Meilisearch (síncrona no fluxo? reindex sem rate limit?).
6. Fan-out de webhook (entrega síncrona no request?).
7. Serialização (`preSerialization`, streaming de ZIP).

Emitir parecer estruturado. Para cada risco:
- **arquivo:linha**
- categoria
- impacto estimado (qualitativo se não houver benchmark; com número se houver)
- mitigação proposta
- sugestão de ciclo TDD novo com título formulado

Se o escopo incluir código em caminho crítico sem **benchmark** correspondente (`tests/bench/**`), sinalizar ausência e sugerir ciclo de criação de benchmark antes do ciclo de otimização.

Regra: **nunca otimizar sem medir primeiro**. Se a medição não existe, o primeiro ciclo é para criar o benchmark.
