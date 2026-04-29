---
description: Auditoria stand-alone de isolamento multi-tenant em um módulo ou caminho
argument-hint: "<módulo ou path, ex: 'documents' ou 'apps/api/src/modules/webhooks'>"
---

Delegue ao subagent `tenant-isolation-guard`.

Escopo: **$ARGUMENTS**

Se nenhum argumento for passado, usar `git diff --name-only HEAD~1..HEAD` como escopo (diff recente).

O `tenant-isolation-guard` deve:
1. Inventariar queries, rotas, jobs, webhooks, keys de cache e índices de busca tocados.
2. Rodar os 8 pontos de verificação do seu system prompt.
3. Emitir parecer estruturado (APROVADO / APROVADO COM RESSALVAS / BLOQUEADO).
4. Listar, se houver, testes cross-tenant que faltam no módulo.

O parecer **não é gravado automaticamente** em ciclo — este é um comando de auditoria avulsa. O humano decide se transforma os achados em ciclos TDD novos.

Se encontrar violação crítica (query sem tenantId, cache key sem tenant, job sem tenantId no payload, rota sem ownership check), responder com **BLOQUEADO** e sugerir comando `/tdd-abrir` com título já formulado para cada violação.
