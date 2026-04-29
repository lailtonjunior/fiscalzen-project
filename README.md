# FiscalZen — Pacote Claude Code (TDD v2)

Este pacote contém a política de desenvolvimento do FiscalZen alinhada ao Claude Code CLI, pronta para ser colada na raiz do repositório.

## Conteúdo

| Arquivo | O que é |
|---|---|
| `CLAUDE.md` | Memória raiz carregada automaticamente pelo Claude Code em toda sessão |
| `docs/CLAUDE_TDD_FISCALZEN_v2.md` | **Política permanente** — TDD refinado com camada operacional Claude Code |
| `docs/GUIA_OPERACIONAL_CLAUDE_CODE.md` | Como usar no dia a dia, wiring MCP, primeiros ciclos sugeridos |
| `.claude/settings.json` | Permissões `allow`/`deny` + hooks |
| `.claude/agents/*.md` | 9 subagents especializados |
| `.claude/commands/*.md` | 13 slash commands (`/tdd-*`, `/audit-*`, `/db-migration-check`, `/perf-analyze`, `/sefaz-fixture`) |
| `.claude/hooks/*.sh` | 5 hooks de governança |
| `.claude/cycles/EXEMPLO-001.md` | Exemplo completo de ciclo fechado, para referência do time |

## Instalação rápida

```bash
# Na raiz do seu repositório FiscalZen:
cp -R <este-pacote>/CLAUDE.md ./
cp -R <este-pacote>/docs/* ./docs/
cp -R <este-pacote>/.claude ./
chmod +x .claude/hooks/*.sh
git add CLAUDE.md docs/ .claude/
git commit -m "chore(claude): adota política TDD v2 + estrutura Claude Code"
```

## Pré-requisitos do sistema

- Claude Code CLI instalado (`claude --version`)
- `jq` instalado (os hooks usam)
- Node.js 20+, pnpm, Docker Compose (já exigidos pelo FiscalZen)

## Uso

Leia na ordem:

1. `CLAUDE.md` (3 minutos — é enxuto).
2. `docs/GUIA_OPERACIONAL_CLAUDE_CODE.md` (15 minutos — operação prática).
3. `docs/CLAUDE_TDD_FISCALZEN_v2.md` (30 minutos — política completa; consulta).
4. `.claude/cycles/EXEMPLO-001.md` (5 minutos — veja como um ciclo fica quando bem feito).

Depois:

```bash
claude
> /tdd-abrir "Parsing de XML NF-e > 512KB não bloqueia event loop"
```

## Filosofia em uma frase

> **Ciclos pequenos, testados antes, sem escopo oculto, com evidência versionada.** Claude Code executa; você decide.
