#!/usr/bin/env bash
# .claude/hooks/session-start-context.sh
#
# SessionStart hook.
# Informa o agente sobre ciclos ativos e relembra regras absolutas.
# stdout JSON com additional_context.

set -euo pipefail

ACTIVE_LIST=""
if [[ -d ".claude/cycles" ]]; then
  while IFS= read -r f; do
    estado=$(grep -m1 '^estado:' "$f" 2>/dev/null | awk '{print $2}' || echo "?")
    if [[ "$estado" != "CLOSED" && -n "$estado" ]]; then
      titulo=$(grep -m1 '^titulo:' "$f" 2>/dev/null | sed 's/^titulo:[[:space:]]*//')
      id=$(grep -m1 '^id:' "$f" 2>/dev/null | awk '{print $2}')
      ACTIVE_LIST+="- $id [$estado]: $titulo"$'\n'
    fi
  done < <(ls -t .claude/cycles/*.md 2>/dev/null || true)
fi

if [[ -z "$ACTIVE_LIST" ]]; then
  ACTIVE_SECTION="Nenhum ciclo TDD aberto."
else
  ACTIVE_SECTION="Ciclos TDD abertos:
$ACTIVE_LIST"
fi

# Produz JSON
jq -n --arg body "
== FISCALZEN / CLAUDE CODE — Sessão iniciada ==

Política permanente: docs/CLAUDE_TDD_FISCALZEN_v2.md
Memória: CLAUDE.md (raiz) e CLAUDE.md por pacote.

$ACTIVE_SECTION

Regras absolutas (relembrando):
1. TDD obrigatório. Use /tdd-abrir antes de codificar mudança de comportamento.
2. Multi-tenancy absoluto. Toda query filtra tenantId.
3. Proibido tocar .env, *.pfx, *.key, *.pem, packages/security/secrets/**.
4. Proibido push para main/master/production e push --force.
5. Proibido logar XML completo, JWT, certificado, senha, CPF em produção.
6. Proibido URL/host de produção em qualquer código ou config.
7. console.log em produção é proibido (use Pino).

Comandos principais: /tdd-abrir /tdd-red /tdd-green /tdd-verify /tdd-refactor /tdd-review /tdd-close
Auditorias: /audit-tenant /audit-security /audit-contract /db-migration-check /perf-analyze
Ferramental: /sefaz-fixture
" '{ additional_context: $body, continue: true }'
