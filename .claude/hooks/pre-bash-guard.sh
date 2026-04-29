#!/usr/bin/env bash
# .claude/hooks/pre-bash-guard.sh
#
# PreToolUse hook para matcher "Bash".
# Recebe JSON no stdin com { tool_input: { command: "..." } } e decide se o comando pode rodar.
# Exit 0 = OK. Exit 2 = BLOQUEIA (stderr volta para o Claude). Qualquer outro exit = erro do hook.

set -euo pipefail

INPUT=$(cat)
CMD=$(echo "$INPUT" | jq -r '.tool_input.command // ""')

if [[ -z "$CMD" ]]; then
  exit 0
fi

# Função para bloquear com motivo
block() {
  echo "BLOQUEADO pelo hook pre-bash-guard: $1" >&2
  echo "Comando tentado: $CMD" >&2
  exit 2
}

# 1. Destruição de filesystem
echo "$CMD" | grep -qE 'rm[[:space:]]+-rf[[:space:]]+(/|~|\.git|\*|\$)' && block "rm -rf em caminho crítico."

# 2. Banco destrutivo
echo "$CMD" | grep -qiE 'DROP[[:space:]]+DATABASE|DROP[[:space:]]+TABLE|TRUNCATE[[:space:]]+TABLE' && block "comando SQL destrutivo."

# 3. Push para branches protegidas
echo "$CMD" | grep -qE '^git[[:space:]]+push[[:space:]]+.*(main|master|production|release/)' && block "push para branch protegida. Use feature branch."
echo "$CMD" | grep -qE '^git[[:space:]]+push[[:space:]]+.*(--force|-f)([[:space:]]|$)' && block "git push --force é proibido."

# 4. Acesso a produção via rede
echo "$CMD" | grep -qiE '(curl|wget|http)[^|;]*(prod|production)\.' && block "request a ambiente de produção."
echo "$CMD" | grep -qiE 'nfe\.fazenda\.gov\.br|fazenda\.sp\.gov\.br' && block "URL de SEFAZ produção detectada. Use homologação."
echo "$CMD" | grep -qiE 'fiscalzen\.com(\.br)?(/|[[:space:]]|$)' && block "URL de produção FiscalZen detectada."

# 5. Leitura de segredos
echo "$CMD" | grep -qE '(cat|less|more|head|tail|bat)[[:space:]]+.*\.env' && block "leitura de arquivo .env proibida."
echo "$CMD" | grep -qE '(cat|less|more|head|tail|bat)[[:space:]]+.*\.(pfx|key|pem|p12)' && block "leitura de material criptográfico proibida."
echo "$CMD" | grep -qE '(cat|less|more|head|tail|bat)[[:space:]]+~/\.(ssh|aws|gnupg)' && block "leitura de credenciais de usuário proibida."
echo "$CMD" | grep -qE '^printenv|^env($|[[:space:]])' && block "dump de variáveis de ambiente proibido."

# 6. Exfiltração
echo "$CMD" | grep -qE 'curl[[:space:]].*-[a-zA-Z]*[FT][a-zA-Z]*[[:space:]].*@' && block "upload via curl com @ (possível exfiltração de arquivo)."
echo "$CMD" | grep -qE '\|.*curl|\|.*wget' && block "pipe para curl/wget (possível exfiltração). Se legítimo, rode em duas etapas."

# 7. SSH/SCP
echo "$CMD" | grep -qE '^(ssh|scp)[[:space:]]' && block "conexões SSH/SCP não são permitidas deste repositório."

# 8. Publicação em registry
echo "$CMD" | grep -qE '^(npm|pnpm|yarn)[[:space:]]+publish' && block "publicação em registry proibida neste repo."

exit 0
