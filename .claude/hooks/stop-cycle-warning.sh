#!/usr/bin/env bash
# .claude/hooks/stop-cycle-warning.sh
#
# Stop hook: executa quando a sessão vai encerrar.
# Se houver ciclo não-fechado, avisa.

set -euo pipefail

PENDING=""
if [[ -d ".claude/cycles" ]]; then
  while IFS= read -r f; do
    estado=$(grep -m1 '^estado:' "$f" 2>/dev/null | awk '{print $2}' || echo "?")
    if [[ "$estado" != "CLOSED" && -n "$estado" && "$estado" != "?" ]]; then
      id=$(grep -m1 '^id:' "$f" 2>/dev/null | awk '{print $2}')
      PENDING+="  - $id [$estado]"$'\n'
    fi
  done < <(ls -t .claude/cycles/*.md 2>/dev/null || true)
fi

if [[ -n "$PENDING" ]]; then
  echo "⚠️  Encerrando sessão com ciclos TDD pendentes:" >&2
  echo -e "$PENDING" >&2
  echo "    Não comite nem abra PR enquanto um ciclo não estiver CLOSED." >&2
fi

exit 0
