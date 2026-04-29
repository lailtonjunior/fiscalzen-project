#!/usr/bin/env bash
# .claude/hooks/tdd-reminder.sh
#
# UserPromptSubmit hook.
# Se o prompt indica intenção de implementar/corrigir sem mencionar TDD,
# e não há ciclo ativo em .claude/cycles/, injeta lembrete via additional_context.
#
# stdout JSON: { "additional_context": "...", "continue": true }

set -euo pipefail

INPUT=$(cat)
PROMPT=$(echo "$INPUT" | jq -r '.prompt // ""')

if [[ -z "$PROMPT" ]]; then
  exit 0
fi

# Normaliza
LP=$(echo "$PROMPT" | tr '[:upper:]' '[:lower:]')

# Intenção de mudança de comportamento?
INTENT_RE='implementa|adiciona|adicione|criar feature|nova feature|corrig[ei]|fix |bug|refator|melhora|otimiz|remov[ei]'

if ! echo "$LP" | grep -qE "$INTENT_RE"; then
  exit 0
fi

# Já menciona TDD/ciclo/teste?
if echo "$LP" | grep -qE 'tdd|ciclo|red |green |verify|refactor|teste primeiro|test first|/tdd-'; then
  exit 0
fi

# Não-TDD legítimo (docs, config puro)?
if echo "$LP" | grep -qE 'documenta|readme|comentário|typo|rename arquivo'; then
  exit 0
fi

# Há ciclo ativo (não CLOSED)?
ACTIVE=""
if [[ -d ".claude/cycles" ]]; then
  for f in $(ls -t .claude/cycles/*.md 2>/dev/null); do
    if grep -qE '^estado:[[:space:]]+(CONTEXTO|RED_.*|GREEN_.*|VERIFY_.*|REFACTOR_.*|REVIEW_.*)' "$f" 2>/dev/null; then
      ACTIVE="$f"
      break
    fi
  done
fi

if [[ -n "$ACTIVE" ]]; then
  # Há ciclo — não injetar; o próprio Claude vai consultá-lo.
  exit 0
fi

# Injeta lembrete
cat <<'JSON'
{
  "additional_context": "AVISO DA POLÍTICA TDD: Esta solicitação parece pedir mudança de comportamento sem ciclo TDD ativo. Antes de codificar, abra um ciclo com `/tdd-abrir \"<intenção de negócio observável>\"`. Se esta tarefa é não-TDD (documentação, rename, config sem efeito comportamental), declare explicitamente na sua resposta antes de proceder.",
  "continue": true
}
JSON
