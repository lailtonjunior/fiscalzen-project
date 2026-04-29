#!/usr/bin/env bash
# .claude/hooks/pre-edit-guard.sh
#
# PreToolUse hook para Write|Edit|MultiEdit.
# Bloqueia escrita em arquivos sensíveis mesmo que por engano a permissão allow tenha matching amplo.

set -euo pipefail

INPUT=$(cat)
PATHS=$(echo "$INPUT" | jq -r '
  .tool_input
  | ( .file_path // .path // (.edits[]?.file_path // empty) )
' 2>/dev/null || echo "")

if [[ -z "$PATHS" ]]; then
  exit 0
fi

block() {
  echo "BLOQUEADO pelo hook pre-edit-guard: $1" >&2
  echo "Path tentado: $2" >&2
  exit 2
}

while IFS= read -r P; do
  [[ -z "$P" ]] && continue

  # Segredos / ambiente
  case "$P" in
    *.env|*.env.*|*/.env|*/.env.*)
      block "edição de .env proibida." "$P"
      ;;
    *.pfx|*.key|*.pem|*.p12)
      block "edição de material criptográfico proibida." "$P"
      ;;
    */secrets/*|*/packages/security/secrets/*)
      block "edição em diretório de segredos proibida." "$P"
      ;;
    /etc/*|*~/.ssh/*|*~/.aws/*|*~/.gnupg/*)
      block "edição fora do repositório proibida." "$P"
      ;;
  esac

  # Workflows de CI (exige ciclo explícito)
  case "$P" in
    .github/workflows/*|.gitlab-ci.yml)
      # Verifica se há ciclo ativo mencionando "ci" na intenção
      if [[ -d ".claude/cycles" ]]; then
        ACTIVE=$(ls -t .claude/cycles/*.md 2>/dev/null | head -1 || true)
        if [[ -n "$ACTIVE" ]] && grep -qiE '(ci|pipeline|workflow|github actions)' "$ACTIVE"; then
          :
        else
          block "edição em workflow de CI exige ciclo TDD explícito declarando impacto em CI." "$P"
        fi
      else
        block "edição em workflow de CI exige ciclo TDD ativo." "$P"
      fi
      ;;
  esac

done <<< "$PATHS"

exit 0
