# Guia operacional — Claude Code no FiscalZen

> Como usar este pacote no dia a dia. Complementa `docs/CLAUDE_TDD_FISCALZEN_v2.md` (política) e o `CLAUDE.md` raiz (memória).

---

## 1. Instalação do pacote no repositório

Na raiz do repositório FiscalZen, copie a estrutura:

```
CLAUDE.md
docs/CLAUDE_TDD_FISCALZEN_v2.md
.claude/
  agents/
    tdd-orchestrator.md
    red-writer.md
    green-implementer.md
    refactor-engineer.md
    security-auditor.md
    tenant-isolation-guard.md
    sefaz-xml-specialist.md
    contract-db-guardian.md
    performance-analyst.md
  commands/
    tdd-abrir.md tdd-red.md tdd-green.md tdd-verify.md
    tdd-refactor.md tdd-review.md tdd-close.md
    audit-tenant.md audit-security.md audit-contract.md
    db-migration-check.md perf-analyze.md sefaz-fixture.md
  hooks/
    pre-bash-guard.sh pre-edit-guard.sh post-edit-quality.sh
    tdd-reminder.sh session-start-context.sh stop-cycle-warning.sh
  settings.json
  cycles/              ← criada automaticamente no primeiro ciclo
```

**Tornar hooks executáveis** (uma vez):
```bash
chmod +x .claude/hooks/*.sh
```

**Dependência do sistema**: `jq` (os hooks usam). Se não estiver instalado:
```bash
# macOS
brew install jq
# Ubuntu/Debian
sudo apt-get install jq
```

**Versionar no git:**
```bash
git add CLAUDE.md docs/CLAUDE_TDD_FISCALZEN_v2.md .claude/
git commit -m "chore(claude): adota política TDD v2 e estrutura operacional Claude Code"
```

Inclua **todos** os arquivos, incluindo `.claude/cycles/`. Os ciclos são evidência de auditoria.

Em `.gitignore`, garanta **apenas**:
```
.claude/violations.log    # opcional: local por dev
```

---

## 2. Primeira execução

```bash
# Na raiz do repo
claude
```

Na sessão:

1. O hook `session-start-context.sh` imprime o contexto e lembra das regras absolutas.
2. Rode `/help` para confirmar que os comandos customizados aparecem.
3. Rode o primeiro ciclo piloto (sugestão na seção 5).

---

## 3. Modelo mental: quem faz o quê

```
  VOCÊ (humano)
      │
      │ digita: "/tdd-abrir Deduplicação de NF-e por chave+tenant"
      ▼
  Agente principal (Claude)
      │ lê CLAUDE.md + settings.json + hooks
      │ delega →
      ▼
  tdd-orchestrator (subagent, opus)
      │ cria .claude/cycles/2026-04-18-001.md
      │ guia preenchimento do CONTEXTO
      │ estado: CONTEXTO → RED_READY
      ▼
  VOCÊ: "/tdd-red"
      │
      ▼
  Agente principal → red-writer (sonnet)
      │ escreve tests/...deduplication.int.test.ts
      │ roda pnpm test, confirma falha pelo motivo certo
      │ registra na seção RED + hash do teste
      │ estado: RED_DONE
      ▼
  VOCÊ: "/tdd-green"
      │
      ▼
  Agente principal → green-implementer (sonnet)
      │ implementa mínimo; respeita hook pre-edit-guard
      │ post-edit-quality roda typecheck
      │ estado: GREEN_DONE
      ▼
  VOCÊ: "/tdd-verify"  →  tdd-orchestrator executa suíte
      │                   estado: VERIFY_DONE
      ▼
  VOCÊ: "/tdd-refactor" (opcional)  →  refactor-engineer
      │                                 estado: REFACTOR_DONE
      ▼
  VOCÊ: "/tdd-review"
      │
      ▼
  3 auditores em paralelo (opus):
   ├─ security-auditor       → PARECER SECURITY
   ├─ tenant-isolation-guard → PARECER TENANT
   └─ contract-db-guardian   → PARECER CONTRACT & DB
      │
      │ todos APROVADO?
      ▼
  VOCÊ: "/tdd-close"  →  valida DoD, grava rollback, sugere commit
                         estado: CLOSED
```

Você **nunca** pula fase. O agente **nunca** decide sozinho avançar. Cada transição exige um comando seu.

---

## 4. Quando usar Opus vs Sonnet

| Tarefa | Modelo | Motivo |
|---|---|---|
| Orquestrar ciclo, conduzir DoD | **opus** | julgamento de conformidade, zero código |
| Escrever teste RED | **sonnet** | tarefa mecânica, rápida, boa em seguir padrão |
| Implementar GREEN | **sonnet** | mínimo, direto |
| Refactor | **sonnet** | transformação segura |
| Auditoria de segurança | **opus** | raciocínio sobre superfície de ataque, cruzamento de evidências |
| Auditoria de tenant | **opus** | crítico, mesmo argumento |
| Auditoria de contrato | **opus** | impacto sobre consumidores reais |
| SEFAZ / XML / A1 | **opus** | domínio fiscal denso |
| Performance | **sonnet** | análise rápida por heurística |

Se você está com orçamento apertado, pode baixar `tdd-orchestrator` e os auditores para `sonnet`. A **política** não muda. A **precisão do juízo** cai um pouco. Não recomendo em REVIEW.

---

## 5. Primeiro ciclo sugerido: offloading do XML parser

Este é o item #1 do backlog priorizado (artigo 20 da política v2) e o maior risco operacional do sistema segundo o RELATORIO_COMPLETO. Bom para calibrar o processo.

```
> /tdd-abrir "Parsing de XML NF-e > 512KB não bloqueia event loop da API"
```

Preencha o CONTEXTO assim:

- **Intenção:** Ao receber um XML NF-e com mais de 512KB no endpoint de ingestão manual, o parsing acontece fora do thread principal e o event loop mede lag < 50ms.
- **Módulo:** `xml-parser` + `apps/api/src/modules/documents`
- **Camada:** integration (com benchmark auxiliar)
- **Contratos afetados:** nenhum (a mudança é interna)
- **Risco de segurança:** nenhum novo
- **Risco de tenant isolation:** nenhum (não muda query)
- **Risco de performance:** **este é o ponto** — a mudança resolve bloqueio.
- **Migration:** não
- **Legado sem cobertura:** parser atual não tem benchmark.
- **Rollback:** `git revert <sha>` volta ao parser síncrono.

Próximos passos:
1. `/tdd-red` — vai criar teste de event-loop-lag usando `perf_hooks.monitorEventLoopDelay` com XML grande injetado.
2. `/tdd-green` — implementa Worker Thread pool em `packages/xml-parser`.
3. `/tdd-verify` — roda tudo que usa xml-parser.
4. `/tdd-refactor` — talvez extração de `WorkerPool` para util próprio.
5. `/tdd-review` — security (nenhum novo risco), tenant (ok), contract (ok).
6. `/tdd-close` — DoD, rollback documentado, commit sugerido.

---

## 6. Segundo ciclo sugerido: índices críticos

```
> /tdd-abrir "CertificateChecker usa índice em certificate_expiry e não faz full scan"
```

Este ciclo é pequeno e casa com o hook `post-edit-quality.sh` que lembra de rodar `/db-migration-check` ao tocar schema.

---

## 7. Terceiro ciclo sugerido: cache do dashboard

```
> /tdd-abrir "Summary do dashboard lê cache Redis com TTL 60s e invalida em novo documento"
```

Aqui o `tenant-isolation-guard` fica especialmente atento: key de cache **precisa** incluir `tenantId`.

---

## 8. MCP servers — wiring seguro

### 8.1 `postgres` MCP (read-only contra `fiscalzen_test`)

```bash
claude mcp add postgres \
  --transport stdio \
  --command "npx" \
  --args "-y" "@modelcontextprotocol/server-postgres" \
         "postgres://user:pass@localhost:5432/fiscalzen_test"
```

**Nunca** aponte para produção. Confira que `fiscalzen_test` existe e não tem dados reais.

### 8.2 `github` MCP

```bash
claude mcp add github \
  --transport stdio \
  --command "npx" \
  --args "-y" "@modelcontextprotocol/server-github" \
  --env GITHUB_TOKEN="ghp_<seu-token-com-permissão-só-a-este-repo>"
```

Token com escopo **mínimo**: `repo`, `read:org`, `pull_request`. Nunca `workflow` se você não for editar CI por aqui.

### 8.3 `filesystem` é nativo
Já vem no Claude Code. Nada a fazer.

### 8.4 SEFAZ mock local (opcional)

Se você já tem um `sefaz-mock` interno (ex.: `nock` server ou um proxy), adicione como MCP personalizado apenas se quiser que o agente interaja com ele em teste. Caso contrário, fixtures bastam.

---

## 9. Skills locais (opcional)

As "skills" que recomendei — `tdd-cycle-runner`, `sefaz-fixture-builder`, `tenant-isolation-tester`, `drizzle-migration-reviewer`, `pino-log-migrator` — na prática já vivem **embutidas** nos subagents e commands que você acabou de instalar.

Se mais tarde você quiser extraí-las como skills reutilizáveis em outros projetos (ou compartilhar com time), crie `.claude/skills/<nome>/SKILL.md` usando o skill-creator. Para o FiscalZen neste estágio, **não é necessário**.

---

## 10. Boas práticas de sessão

- **Uma sessão por ciclo.** Ao fechar um ciclo, encerre a sessão. Comece outra limpa para o próximo. Contexto fresco reduz desvio.
- **Nunca** use `claude --dangerously-skip-permissions`. O hook `pre-bash-guard.sh` só protege o que `deny` não cobre; pular permissões desliga a primeira camada.
- **Se o agente propuser algo fora do ciclo**, responda: _"Fora de escopo. Vira novo ciclo?"_ — e deixe ele registrar no backlog.
- **Revise cada `git diff`** antes de commitar. O agente é rigoroso, mas você é o responsável final.
- **Assine commits** com chave GPG/Sigstore se o repo exigir. Isso é humano, não delegável.
- **Nunca** comite `.claude/violations.log` se ele contiver dado sensível acidental.

---

## 11. Integração com CI

Adicione um job de CI que valide:
- Nenhum `console.log` em `apps/**/src/**` (exceto `*.test.ts`).
- Nenhum arquivo em `.claude/cycles/` com `estado: !== CLOSED` nos últimos 7 dias (aviso, não bloqueio).
- `pnpm test`, `pnpm typecheck`, `pnpm lint` verdes.
- `grep -rE '\.env|\.pfx|\.key|\.pem' .` falha se encontrar conteúdo comitado por engano.

Essa camada é **complementar** — a principal ainda é o ciclo TDD.

---

## 12. Solução de problemas

| Sintoma | Causa provável | Ação |
|---|---|---|
| Hook não dispara | Falta `chmod +x` | `chmod +x .claude/hooks/*.sh` |
| Hook falha com `jq: not found` | jq ausente | instale jq |
| `/tdd-abrir` não aparece em `/help` | `.claude/commands/` fora da raiz do repo | mover para raiz |
| Subagent não é invocado | Nome do subagent no slash command errado | conferir `.claude/agents/<nome>.md` vs delegação |
| Agente quer rodar comando bloqueado | funcionando como esperado | siga a mensagem do hook; se legítimo, relaxe temporariamente no settings.json e **documente** a exceção |
| Ciclo abre mas não fecha | DoD incompleta | o `tdd-close` vai listar o que falta — preencha item a item |

---

## 13. Evolução da política

Mudanças em `docs/CLAUDE_TDD_FISCALZEN_v2.md` exigem:
- ciclo TDD próprio (sim, a política se autoavalia);
- registro em `packages/shared/CHANGELOG.md` (seção "Política");
- PR revisado por ao menos 2 engenheiros sêniores;
- aviso em canal do time.

A política não é estática, mas **não muda sem rastro**.

---

## 14. Resumo de uma página

1. `claude` na raiz.
2. `/tdd-abrir "<intenção>"` → preencha CONTEXTO.
3. `/tdd-red` → teste que falha certo.
4. `/tdd-green` → mínimo para passar.
5. `/tdd-verify` → suíte + regressão.
6. `/tdd-refactor` → se houver oportunidade.
7. `/tdd-review` → 3 auditores em paralelo.
8. `/tdd-close` → DoD + rollback + commit sugerido.
9. Você comita, cria branch, abre PR.
10. Próximo ciclo.

**Se qualquer fase bloquear, o agente te dirá a frase canônica da política. Não contorne. Resolva ou abra ciclo filho.**
