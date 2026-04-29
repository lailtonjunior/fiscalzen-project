# DAILY START — Abertura de sessão Claude Code (pós-bootstrap)

> Use este prompt no início de cada sessão depois que o bootstrap já foi feito e aprovado. É uma reorientação curta, não um diagnóstico completo.
>
> Se você não rodou o `BOOTSTRAP_PROMPT.md` ainda, rode aquele primeiro.

---

## Prompt a colar

```
Sessão de trabalho no FiscalZen. Antes de qualquer ação:

1. Leia CLAUDE.md na raiz e os CLAUDE.md dos pacotes que eu mencionar nesta sessão.
2. Leia docs/CLAUDE_TDD_FISCALZEN_v2.md se ainda não tiver lido no contexto.
3. Verifique .claude/cycles/ — liste ciclos com estado != CLOSED e me diga qual é o mais recente.
4. Confirme no stdout:
   - ciclo ativo (se houver) e qual fase está pendente
   - ou "nenhum ciclo ativo, aguardando /tdd-abrir"
5. Aguarde minha próxima instrução.

Regras absolutas desta sessão (lembrando):
- TDD obrigatório. Toda mudança de comportamento passa por /tdd-abrir → /tdd-red → /tdd-green → /tdd-verify → /tdd-refactor → /tdd-review → /tdd-close.
- Multi-tenancy: toda query filtra tenantId.
- Proibido tocar .env, *.pfx, *.key, *.pem, packages/security/secrets/**.
- Proibido URL/host de produção em qualquer código ou config.
- Proibido console.log em produção.
- Proibido git push para main/master/production.

Se eu pedir mudança de comportamento sem mencionar TDD, me lembre: "Ciclo não aberto. Use /tdd-abrir \"<intenção>\"."

Ao delegar para subagents, respeite as fronteiras:
- tdd-orchestrator: orquestra, nunca codifica
- red-writer: só testes
- green-implementer: só implementação mínima
- refactor-engineer: só refactor sem mudança de comportamento
- security-auditor, tenant-isolation-guard, contract-db-guardian, performance-analyst: só leem e emitem parecer
- sefaz-xml-specialist: SEFAZ/XML/fixtures

Comece pelo passo 1.
```

---

## Variantes por situação

### Retomando ciclo em andamento
Se você sabe exatamente onde parou, pode ser mais direto:

```
Retomando ciclo <ID>. Leia .claude/cycles/<ID>.md e me diga qual é a próxima fase.
Depois execute /tdd-<fase-pendente>.
```

### Sessão só de auditoria (sem ciclo)
```
Sessão de auditoria read-only. Não abra ciclo.

Rode em sequência e me dê o consolidado:
1. /audit-security
2. /audit-tenant <módulo que vou te dizer>
3. /audit-contract

Se algum emitir BLOQUEADO, pare e me avise antes de seguir para o próximo.
```

### Sessão de exploração (entender código, sem alterar)
```
Sessão exploratória read-only. Não abra ciclo, não edite nada.

Me explique como funciona <feature/módulo> hoje:
- arquivos envolvidos
- fluxo principal
- pontos de extensão
- riscos conhecidos (cruze com docs/CLAUDE_TDD_FISCALZEN_v2.md § 20 Backlog)

Ao fim, proponha 1-3 ciclos TDD possíveis — só a lista, sem abrir.
```
