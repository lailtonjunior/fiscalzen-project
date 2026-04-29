#!/usr/bin/env bash
# .claude/hooks/post-edit-quality.sh
#
# PostToolUse para Write|Edit|MultiEdit.
# Roda typecheck e lint rápidos no pacote afetado. Avisa (não bloqueia) se falhar,
# para o agente poder corrigir no próximo turno.

set -euo pipefail

INPUT=$(cat)
PATHS=$(echo "$INPUT" | jq -r '
  .tool_input
  | ( .file_path // .path // (.edits[]?.file_path // empty) )
' 2>/dev/null || echo "")

if [[ -z "$PATHS" ]]; then
  exit 0
fi

# Detecta pacote raiz no monorepo a partir do path
detect_package() {
  local p="$1"
  if [[ "$p" == apps/api/* ]]; then echo "@fiscalzen/api"; return; fi
  if [[ "$p" == apps/web/* ]]; then echo "@fiscalzen/web"; return; fi
  if [[ "$p" == packages/* ]]; then
    # pega o nome da pasta
    local pkg=$(echo "$p" | awk -F/ '{print $2}')
    echo "@fiscalzen/$pkg"
    return
  fi
  echo ""
}

declare -A SEEN

while IFS= read -r P; do
  [[ -z "$P" ]] && continue
  # Só nos importamos com TS/TSX
  case "$P" in
    *.ts|*.tsx) ;;
    *) continue ;;
  esac

  PKG=$(detect_package "$P")
  [[ -z "$PKG" ]] && continue
  [[ -n "${SEEN[$PKG]:-}" ]] && continue
  SEEN[$PKG]=1

  echo "[post-edit-quality] typecheck em $PKG…"
  if ! pnpm --filter "$PKG" typecheck > /tmp/fz-typecheck.log 2>&1; then
    echo "⚠️  typecheck falhou em $PKG. Veja /tmp/fz-typecheck.log." >&2
  fi

  # Migrations pedem lembrete
  case "$P" in
    packages/database/schema/*|packages/database/migrations/*)
      echo "ℹ️  schema/migration alterado. Rode '/db-migration-check' antes de fechar o ciclo." >&2
      ;;
  esac

done <<< "$PATHS"

exit 0
