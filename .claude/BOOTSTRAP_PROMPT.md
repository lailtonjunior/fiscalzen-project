# BOOTSTRAP — Primeira sessão Claude Code no FiscalZen

> **Cole este prompt inteiro como primeira mensagem de uma sessão `claude` nova, na raiz do repositório FiscalZen, imediatamente após instalar o pacote TDD v2.**
>
> Esta sessão é **read-only**. O agente não escreve código, não abre ciclo, não commita. Ele inventaria, diagnostica gaps, e propõe um plano. Você aprova.

---

## Quem você é nesta sessão

Você é o agente principal do **Claude Code** operando no repositório **FiscalZen** — SaaS multi-tenant de recepção de documentos fiscais eletrônicos brasileiros (DF-e).

Este repositório adota a política **TDD v2** documentada em `docs/CLAUDE_TDD_FISCALZEN_v2.md`. Você deve considerá-la vinculante a partir de agora. Cada ciclo de desenvolvimento segue o fluxo `CONTEXTO → RED → GREEN → VERIFY → REFACTOR → REVIEW → CLOSE`, delegado a subagents especializados e sustentado por hooks de governança.

Nesta primeira sessão, seu trabalho é **fazer o mapeamento completo do estado atual** e produzir um **plano de adoção** — nada além.

---

## Regras absolutas desta sessão (não-negociáveis)

1. **Nenhum `Edit`, `Write`, `MultiEdit`.** Apenas `Read`, `Grep`, `Glob`, e `Bash` com comandos read-only.
2. **Nenhum `git commit`, `git add`, `git checkout -b`.** Sessão inteiramente observacional.
3. **Não abra ciclo TDD.** Nada de `/tdd-abrir`. Ciclos só começam depois que o humano aprovar o plano.
4. **Não delegue a subagents.** Neste bootstrap, você mesmo executa o diagnóstico — a ideia é você confirmar que conhece a estrutura.
5. **Não invente.** Se algo não for encontrado, registre como "AUSENTE" ou "NÃO VERIFICÁVEL NESTA SESSÃO". Nunca preencha com suposição.
6. **Se um hook bloquear algum comando**, isso é sinal de que o hook funciona — registre e siga.
7. **Se encontrar violação de segurança já comitada** (segredo exposto, URL de produção em código, etc.), **pare imediatamente** e reporte ao humano antes de continuar o mapeamento.

Ao final, apresente o **relatório estruturado** no formato especificado na seção 7 e **aguarde decisão humana**.

---

## Fase 1 — Verificação da instalação da política

Confirme, com evidência, que cada item abaixo existe e está íntegro:

### 1.1 Arquivos de política
- [ ] `CLAUDE.md` na raiz — leia e resuma em 3 bullets as regras não-negociáveis declaradas.
- [ ] `docs/CLAUDE_TDD_FISCALZEN_v2.md` — confirme que o artigo 17 (DoD) existe e liste as 5 seções (A-E).
- [ ] `docs/GUIA_OPERACIONAL_CLAUDE_CODE.md` — confirme presença.

### 1.2 Subagents (`.claude/agents/`)
Liste os arquivos presentes. Os 9 esperados são:
`tdd-orchestrator`, `red-writer`, `green-implementer`, `refactor-engineer`, `security-auditor`, `tenant-isolation-guard`, `sefaz-xml-specialist`, `contract-db-guardian`, `performance-analyst`.

Para cada um, confirme: nome do frontmatter, `tools` declaradas, `model`. Marque "OK" ou "AUSENTE" ou "FRONTMATTER INCOMPLETO".

### 1.3 Slash commands (`.claude/commands/`)
Liste os arquivos. Os 13 esperados:
`tdd-abrir`, `tdd-red`, `tdd-green`, `tdd-verify`, `tdd-refactor`, `tdd-review`, `tdd-close`, `audit-tenant`, `audit-security`, `audit-contract`, `db-migration-check`, `perf-analyze`, `sefaz-fixture`.

### 1.4 Hooks (`.claude/hooks/`)
Confirme presença e bit de execução:
```bash
ls -la .claude/hooks/
```
Os 6 esperados: `pre-bash-guard.sh`, `pre-edit-guard.sh`, `post-edit-quality.sh`, `tdd-reminder.sh`, `session-start-context.sh`, `stop-cycle-warning.sh`. Todos devem ter `x` no bit.

### 1.5 Configuração
- [ ] `.claude/settings.json` — confirme que existe e tem as seções `permissions.allow`, `permissions.deny`, `hooks`.
- [ ] Validar sintaxe JSON (`cat .claude/settings.json | jq . > /dev/null`).
- [ ] Contar entradas em `allow` e `deny`.

### 1.6 Dependências do sistema
- [ ] `jq --version` — necessário para os hooks.
- [ ] `node --version` — deve ser ≥ 20.
- [ ] `pnpm --version` — deve estar instalado.

### 1.7 Pasta de ciclos
- [ ] `.claude/cycles/` existe.
- [ ] Liste o que há dentro. Se só houver `EXEMPLO-001.md`, é o estado esperado de repo novo.

---

## Fase 2 — Inventário do monorepo

### 2.1 Topologia
- Rode `cat pnpm-workspace.yaml` e `cat turbo.json` (ou `turbo.jsonc`).
- Liste todos os `apps/*` e `packages/*` existentes.
- Compare com o esperado pelo `PROJECT_INFO.md`:
  - `apps/api`, `apps/web`
  - `packages/database`, `sefaz-client`, `nfse-client`, `xml-parser`, `pdf-generator`, `security`, `shared`, `ui`, `cli`
- Reporte divergências (faltando, extras, renomeados).

### 2.2 CLAUDE.md hierárquico
A política v2 (artigo 11) exige `CLAUDE.md` por pacote-chave. Para cada um dos seguintes, marque **EXISTE / AUSENTE**:
- `apps/api/CLAUDE.md`
- `apps/web/CLAUDE.md`
- `packages/database/CLAUDE.md`
- `packages/sefaz-client/CLAUDE.md`
- `packages/xml-parser/CLAUDE.md`
- `packages/security/CLAUDE.md`
- `packages/shared/CLAUDE.md`

Todo "AUSENTE" vira item do plano (seção 5).

### 2.3 Módulos da API
Liste `apps/api/src/modules/*/` e para cada módulo conte:
- quantidade de arquivos `.service.ts`, `.repository.ts`, `.routes.ts`, `.schema.ts`
- quantidade de arquivos de teste: `*.test.ts` (unit) e `*.int.test.ts` (integration)

Formato:
```
módulo          | service | repo | routes | schema | unit | int
documents       |    1    |  1   |   1    |   1    |  3   |  2
manifestacao    |    1    |  1   |   1    |   0    |  0   |  0   ← schema ausente, sem testes
...
```

### 2.4 Schema Drizzle
- Liste `packages/database/schema/*.ts`.
- Para cada tabela, confirme presença da coluna `tenant_id` quando esperado.
- Liste `packages/database/migrations/*` e conte.
- Grep por `UNIQUE` e `INDEX` nas migrations — reporte ausências conhecidas (do roadmap):
  - `(chave_acesso, tenant_id)` em documentos
  - índice em `certificate_expiry`
  - índice em `nsu_cursor`
  - índice em `webhook_delivery_status` (ou equivalente)

### 2.5 Fixtures SEFAZ
- Liste `tests/fixtures/sefaz/**/*.xml` (ou caminho equivalente).
- Compare com os 9 cenários mínimos exigidos pelo comando `/sefaz-fixture` (nfe autorizada/cancelada/carta-correcao/resumo, cte autorizado/desacordo, mdfe autorizado, nfse abrasf, inválidos).
- Cenários ausentes viram ciclos de `/sefaz-fixture`.

### 2.6 Testes
Rode (read-only, só contar):
```bash
find apps packages -name "*.test.ts" -not -path "*/node_modules/*" | wc -l
find apps packages -name "*.int.test.ts" -not -path "*/node_modules/*" | wc -l
find tests/contract -name "*.ts" 2>/dev/null | wc -l
find tests/e2e -name "*.ts" 2>/dev/null | wc -l
find tests/bench -name "*.bench.ts" 2>/dev/null | wc -l
```
Reporte os 5 números. Compare com o mínimo da política (artigo 12 da v1, herdado pela v2).

### 2.7 Observabilidade
Rode:
```bash
grep -rn "console\.log" apps packages --include="*.ts" --include="*.tsx" | grep -v "\.test\.ts" | grep -v "\.spec\.ts" | wc -l
grep -rn "pino\|Pino" apps packages --include="*.ts" | wc -l
```
Reporte ambos. A política v2 (artigo 6.10) proíbe `console.log` em fluxo de produção. Cada ocorrência vira item de remediação.

### 2.8 Segurança inicial — varredura rápida
Rode:
```bash
# Verificar se algum segredo está no git (histórico não — só working tree)
grep -rE "(BEGIN (RSA |EC )?PRIVATE KEY|-----BEGIN CERT)" apps packages --include="*.ts" --include="*.json" --include="*.pem" 2>/dev/null | head
grep -rE "postgres://.*:.*@" apps packages --include="*.ts" --include="*.json" 2>/dev/null | grep -v "localhost\|127.0.0.1\|test\|example" | head
grep -rnE "fiscalzen\.com|\.prod\.|\.production\." apps packages --include="*.ts" --include="*.json" 2>/dev/null | head
```
**Qualquer resultado aqui é vermelho.** Se encontrar, **pare o inventário** e reporte ao humano imediatamente. Não avance.

---

## Fase 3 — Conformidade com a política v2

Para cada regra abaixo, dê um veredito: **OK / PARCIAL / AUSENTE / NÃO VERIFICÁVEL**.

### 3.1 Multi-tenancy
- Grep `db.query.*.findFirst\|db.query.*.findMany` em todos os repositories.
- Para cada ocorrência, verificar se há `tenantId` no `where`. Reporte contagem: N ocorrências / M com tenantId.
- Razão < 100% = AUSENTE (crítico).

### 3.2 Autenticação/Autorização
- Grep `preHandler` em todas as rotas de `apps/api/src/modules/**/routes.ts`.
- Rotas sem `preHandler` de auth em módulos multi-tenant = AUSENTE.

### 3.3 Validação Zod
- Grep `body:` ou `schema:` em rotas.
- Rotas sem schema Zod = PARCIAL/AUSENTE.

### 3.4 Idempotência de webhook
- `grep -rn "idempotency\|idempotencyKey" packages/shared apps/api/src/modules/webhooks`.
- Ausência = PARCIAL.

### 3.5 HMAC
- Grep `timingSafeEqual`, `createHmac` nos módulos de webhook.
- Presença de `==` ou `===` comparando HMAC = AUSENTE crítico.

### 3.6 NSU
- Grep `nsu` em `packages/sefaz-client` e módulo `nsu` da API.
- Verifique se há testes cobrindo: avanço correto, não-regressão, resposta vazia, timeout.

### 3.7 Offloading XML
- Grep `Worker\|worker_threads\|piscina` em `packages/xml-parser`.
- Ausência = AUSENTE (é o item #1 do backlog priorizado).

### 3.8 Cache dashboard
- Grep `redis\|cache` em módulo `dashboard`.
- Ausência = AUSENTE (item #3 do backlog).

### 3.9 Certificados
- Grep `CertificateChecker\|certificate.?expir` em jobs/workers.
- Verifique se há índice em `certificate_expiry` (já coberto em 2.4).

### 3.10 Contratos compartilhados
- Liste exports de `packages/shared/src/index.ts` (ou equivalente).
- Verifique presença de `CHANGELOG.md` em `packages/shared/`.

---

## Fase 4 — Gap analysis

Consolide em uma tabela única todos os achados das fases 2 e 3 que precisam virar **ciclo TDD** ou **tarefa de configuração**.

Formato obrigatório:

```
| # | Gap                                              | Categoria        | Severidade | Tipo de ação       |
|---|--------------------------------------------------|------------------|------------|--------------------|
| 1 | XML parser síncrono bloqueia event loop          | Performance      | Alta       | Ciclo TDD          |
| 2 | Índice ausente em certificate_expiry             | DB               | Alta       | Ciclo TDD          |
| 3 | CLAUDE.md ausente em packages/xml-parser         | Documentação    | Média      | Tarefa config      |
| 4 | Módulo X sem teste cross-tenant                  | Tenant isolation | Crítica    | Ciclo TDD urgente  |
| 5 | N ocorrências de console.log em produção         | Observabilidade  | Média      | Ciclo TDD (Pino)   |
...
```

Campos:
- **Categoria**: Performance / DB / Tenant isolation / Segurança / Contrato / Observabilidade / Documentação / Testes / Infra
- **Severidade**: Crítica / Alta / Média / Baixa
- **Tipo de ação**: Ciclo TDD urgente / Ciclo TDD / Tarefa config / Investigação adicional

---

## Fase 5 — Plano proposto de adoção

Proponha, baseado nos gaps, uma ordem de execução dos 10 primeiros ciclos TDD. Para cada um, escreva:

```
### Ciclo proposto N — <título>
- Intenção de negócio observável: ...
- Módulo: ...
- Camada: unit | integration | contract | e2e
- Gaps cobertos: #X, #Y (da tabela da Fase 4)
- Risco estimado: baixo | médio | alto
- Depende de: (ciclo N-1? nada?)
- Comando de abertura sugerido:
  /tdd-abrir "<título exato>"
```

Regras para a ordenação:
1. **Críticas de segurança/tenant vêm primeiro**, sempre.
2. **Benchmark antes de otimização** — se um gap de performance não tem benchmark, o primeiro ciclo dele é criar o benchmark.
3. **Configuração antes de dependência** — se um ciclo depende de CLAUDE.md de pacote ou de fixture SEFAZ, inclua a tarefa de config antes.
4. **Diff pequeno** — nenhum ciclo deve parecer "ciclo guarda-chuva". Se parecer, divida.
5. **Cascata de aprendizado** — comece com um ciclo de risco baixo/médio no primeiro dia, para calibrar o time no processo.

---

## Fase 6 — Perguntas abertas ao humano

Ao fim do relatório, liste **perguntas específicas** que você não conseguiu responder sozinho. Exemplos do tipo certo de pergunta:

- "Encontrei `packages/fiscal-core` que não consta no `PROJECT_INFO.md`. É legado em extinção ou pacote novo?"
- "A migration `0038_*.sql` tem `DROP COLUMN` sem predecessora. Houve deploy parando de escrever na coluna antes? Preciso do histórico."
- "O módulo `agents` está em `PROJECT_INFO.md` mas não encontrei no repo. Foi removido ou ainda não foi iniciado?"

Não invente respostas. Peça confirmação.

---

## Fase 7 — Formato do relatório final

Entregue o relatório **nesta ordem exata**, em uma única mensagem ao fim da sessão:

```markdown
# RELATÓRIO DE BOOTSTRAP — <data ISO>

## 1. Resumo executivo
- Instalação da política: <OK / PARCIAL / QUEBRADA>
- Aderência atual estimada: <X%>
- Riscos críticos detectados: <N>
- Primeiro ciclo recomendado: <título>

## 2. Verificação da política (Fase 1)
<checklist preenchido>

## 3. Inventário do monorepo (Fase 2)
<tabelas e contagens>

## 4. Conformidade (Fase 3)
<10 subseções com veredito>

## 5. Gap analysis (Fase 4)
<tabela única de gaps>

## 6. Plano de adoção (Fase 5)
<10 ciclos propostos, ordenados>

## 7. Perguntas ao humano (Fase 6)
<lista numerada>

## 8. Próximo passo único
Sugestão: "aprovar o plano e executar `/tdd-abrir \"<título do ciclo 1>\"`".
```

---

## O que acontece depois do relatório

Você **aguarda**. O humano vai:

1. Ler o relatório.
2. Responder às perguntas abertas.
3. Aprovar ou ajustar o plano.
4. Decidir qual ciclo iniciar.
5. Quando decidir, ele chama `/tdd-abrir "<título>"` — e aí você volta a agir, agora dentro do ciclo, delegando ao `tdd-orchestrator`.

**Não** proponha começar um ciclo no mesmo turno do relatório. **Não** execute nada que altere o repositório neste bootstrap. **Não** sugira "enquanto isso, vou corrigir X rapidinho". Esse "rapidinho" é exatamente o que a política combate.

---

## Se algo der errado durante o bootstrap

- **Ferramenta de escrita disparar**: abortar, reportar, não tentar de novo.
- **Hook bloquear comando read-only por engano**: reportar como finding da Fase 1 (hook sobre-restritivo). Não desligar hook.
- **Arquivo da política faltando ou corrompido**: parar e reportar — a sessão não pode operar sem política instalada.
- **Segredo/URL de produção descoberto no código**: parar imediatamente, reportar, recomendar rotação de credencial se aplicável, **não** listar o valor do segredo encontrado (nem parcialmente — mostre só o arquivo e a linha).
- **Você perceber que não tem certeza de alguma regra da política**: leia o artigo correspondente em `docs/CLAUDE_TDD_FISCALZEN_v2.md` antes de decidir. Se ainda não tiver certeza, é uma pergunta para o humano na Fase 6.

---

## Comece agora

Execute as Fases 1 a 6 em ordem. Não pule. Não condense. Ao fim, entregue o relatório no formato da Fase 7 e pare.

Boa sessão.
