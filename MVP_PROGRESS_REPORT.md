# Relatório de Progresso - MVP v1 FiscalZen

Este relatório reconcilia o estado atual do código com o **Backlog Técnico** e a **Especificação Funcional** definidos para o MVP v1.

Observacao: quando houver divergencia entre checkpoints antigos e o resumo atual, considere a "Visao Geral por Epico" e "Estado confirmado em 2026-05-06" como a referencia mais recente deste documento.

---

## 📊 Visão Geral por Épico

| ID   | Épico                                | Status      | Progresso | Observações                                                                 |
| :--- | :----------------------------------- | :---------- | :-------- | :-------------------------------------------------------------------------- |
| EP01 | **Contrato API e Baseline**          | ⚠️ Parcial   | 90%       | Envelope, aliases de paginação e schemas das rotas principais ficaram mais coerentes com a resposta real; falta validação mais ampla fora do fluxo principal. |
| EP02 | **Gestão de Empresas e Sync**        | ✅ Adiantado | 93%       | CRUD, certificado e UI de status NSU ficaram mais resilientes a estados vazios/erro; falta validação E2E com sync real. |
| EP03 | **Tela de Documentos**               | ⚠️ Parcial   | 87%       | Inbox e detalhe ficaram mais seguros e operacionais no consumo de XML/PDF/anexos; faltam refinamentos menores e testes dedicados. |
| EP04 | **Downloads e Histórico Local**      | ⚠️ Parcial   | 92%       | Downloads em lote deixaram de expor `storageKey`/URL em payload JSON, mantiveram acesso autenticado e o worker foi ajustado ao fluxo atual de PDF; falta validar E2E completo com worker/storage reais. |
| EP05 | **Histórico e Auditabilidade**       | ⚠️ Parcial   | 74%       | Timeline consolidada ficou mais segura ao remover detalhes internos de downloads, mantendo cobertura de PDF e manifestação; faltam testes dedicados e mais fontes operacionais. |
| EP06 | **Jobs e Filas**                     | ✅ Adiantado | 90%       | BullMQ e Redis operacionais. Falta apenas a UI de retry e progresso refinada. |
| EP07 | **Alertas Operacionais**             | ✅ Adiantado | 85%       | Worker de expiração de certificado operacional.                             |
| EP08 | **Manifestação do Destinatário**     | ⚠️ Parcial   | 70%       | Fluxo operacional por documento, pendentes/contagem reais, tela funcional e integração com `document_history`; falta validação fiscal completa em ambiente SEFAZ real. |
| EP09 | **PDF e Anexos Fiscais**             | ⚠️ Parcial   | 40%       | Fluxo principal foi reativado em `documents` para NFe/NFCe e CTe com PDF operacional baseado no XML armazenado; falta validação fiscal/jurídica mais ampla. |
| EP10 | **Observabilidade e Segurança**      | ✅ Adiantado | 70%       | Multi-tenancy implementado via `tenant_id`.                                |

---

## ✅ O que JÁ FOI feito (Done)

*   **Infraestrutura Core:** Monorepo Turborepo, PostgreSQL com Drizzle, Redis/BullMQ, Meilisearch e MinIO configurados.
*   **Empresas:** Cadastro, listagem e upload de certificado A1 (com criptografia).
*   **Sincronização:** Polling SEFAZ via NSU funcional para NF-e.
*   **Documentos (Backend):** Ingestão XML, armazenamento em S3, indexação para busca e metadados fiscais extraídos.
*   **Segurança:** Autenticação JWT e isolamento multi-tenant básico.
*   **Monitoramento:** Worker diário de expiração de certificados gerando alertas.
*   **Baseline web/API:** Builds de `@fiscalzen/web` e `@fiscalzen/api` passam; cliente web desembrulha envelope e evita duplicacao de `/api/v1`.
*   **Manifestação pendente:** `/manifestacao/pendentes`, `/manifestacao/pending` e `/manifestacao/count` retornam dados reais do serviço de pendentes.
*   **Manifestação operacional do MVP:** existe rota canônica `POST /api/v1/manifestacao/:documentId`, mais `GET /api/v1/manifestacao/awaiting-final` e `GET /api/v1/manifestacao/history`, todas com envelope canônico.
*   **Auditabilidade da manifestação:** solicitações, conclusões e falhas de manifestação passam a alimentar `document_history` com `source`, `sourceId`, `correlationId`, protocolo real quando houver e erro fiscal quando aplicável.
*   **Tela de manifestação:** `/manifestacao` saiu de placeholder e agora mostra pendentes reais, documentos aguardando manifestação final e histórico recente com filtro por empresa.
*   **Contrato de rotas ativas:** `comments`, `tags`, `jobs` e `webhooks` usam helpers canonicos de resposta nos pontos que ainda retornavam payload cru.
*   **Guarda de contrato:** `apps/api/tests/api-contract.test.ts` impede retorno cru em rotas versionadas ativas.
*   **Status NSU na empresa:** tela de detalhe exibe resumo operacional, ultima/proxima sync, erros e progresso por tipo de documento.
*   **Tela de documentos:** `/documentos` lista documentos com filtros operacionais, cards de resumo, seleção de linhas e criação de pacote em lote.
*   **Centro de downloads:** `/downloads` mostra jobs recentes, progresso, erros e link para ZIP concluido.
*   **Histórico local de downloads:** `download_registry` persiste jobs de pacote por tenant, usuário, filtros/IDs, progresso, resultado e erros.
*   **Auditabilidade do ciclo fiscal:** `document_history` persiste eventos operacionais por tenant/documento/empresa e `GET /api/v1/documents/:id/history` consolida essa trilha com `document_events`.
*   **Timeline no frontend:** a tela `/documentos/[id]` agora exibe o histórico consolidado do documento.
*   **Downloads auditáveis:** enfileiramento, início, conclusão, falha e acesso efetivo ao ZIP concluído agora alimentam o histórico do documento.
*   **Paginação operacional do inbox:** `/documentos` passou a consumir `meta/pagination` reais da API, incluindo `totalPages`, sem depender de paginação visual/local.
*   **Download XML individual:** o frontend agora baixa o blob autenticado devolvido pela API, em vez de assumir uma URL pré-assinada inexistente.
*   **Hardening de estados de UI:** empresa, downloads e timeline de histórico ficaram mais claros em loading, erro, vazio e dados inválidos.
*   **PDF fiscal operacional:** `GET /api/v1/documents/:id/pdf/download` volta a funcionar para NFe/NFCe e CTe a partir do XML armazenado, com cache em `pdfStorageKey`.
*   **Anexos fiscais:** `GET /api/v1/documents/:id/attachments` lista XML/PDF disponíveis sem expor chaves internas de storage.
*   **Timeline do PDF:** solicitações, sucesso e falhas de PDF agora entram em `document_history`.
*   **Sanitização de payloads internos:** rotas públicas de documentos e downloads agora expõem apenas `hasXml`/`hasPdf` e resumos públicos, sem `storageKey` nem URL pré-assinada persistida em JSON.
*   **Checklist de demo:** `docs/MVP_DEMO_CHECKLIST.md` documenta ambiente, serviços, workers, builds e limitações honestas do MVP.
*   **Infra de integração mínima:** existe agora `tests/integration/setup.integration.ts`, `pnpm db:push:test`, `drizzle-test.config.ts` e `docs/TESTING.md` para orientar e proteger a execução da suíte integrada.
*   **Suíte de integração estabilizada:** `pnpm test:integration:up`, `pnpm db:push:test` e `pnpm --filter @fiscalzen/api test:integration` foram validados ponta a ponta; a suíte principal fecha verde com `10` arquivos e `44` testes.
*   **Correções reais de backend já cobertas pela integração:** PDF via `pdfmake`, criação/listagem de empresas, fixtures de documentos/certificados, contrato de webhooks e normalização de datas de manifestação foram alinhados ao schema/runtime atual.

---

## 🛑 O que AINDA FALTA (Todo)

### Prioridade 1: Estabilização e Contrato (Épico 1)
- [x] **Padronização de Respostas:** Rotas versionadas ativas foram padronizadas e cobertas por guarda automatizada.
- [x] **Correção de Métodos:** Frontend de empresas usa `PUT` e NSU aponta para `/nsu-status`.
- [x] **Build Verde:** `apps/web` e `apps/api` compilam com sucesso.

### Prioridade 2: Superfície Operacional (Épico 3 e 4)
- [ ] **Tela de Documentos:** Grade estilo "Caixa de Entrada" e paginação real implementadas; faltam refinamentos menores de UX e testes dedicados.
- [ ] **Downloads em Lote:** Job ZIP, acompanhamento, `download_registry` persistente e auditoria de acesso implementados; falta validar E2E com Redis/MinIO/worker.
- [x] **Centro de Downloads:** Tela `/downloads` acompanha progresso dos pacotes ZIP recentes.

### Prioridade 3: Auditabilidade e Ciclo Fiscal (Épico 5, 8 e 9)
- [x] **Timeline do Documento:** Visão unificada inicial entregue (sync/resumo -> eventos fiscais/manifestação -> lote/download ZIP).
- [ ] **Manifestação Real Validada:** Validar em ambiente fiscal real as chamadas à SEFAZ com certificado e protocolo efetivo nos cenários finais do destinatário.
- [ ] **Validação Fiscal do PDF:** Validar o gerador reativado em ambiente operacional real e ampliar cobertura para tipos/cenários ainda não suportados, mantendo honestidade jurídica do artefato.

## Validacoes desta sessao

- `pnpm test:integration:down`
- `pnpm test:integration:up`
- `pnpm test:integration:up`
- `pnpm --filter @fiscalzen/database build`
- `pnpm --filter @fiscalzen/api build`
- `pnpm --filter @fiscalzen/web build`
- `pnpm --filter @fiscalzen/api test:run tests/api-contract.test.ts`
- `pnpm --filter @fiscalzen/api test:run tests/documents.public-document.test.ts tests/downloads.public-result.test.ts tests/pdf.helpers.test.ts tests/manifestacao.schemas.test.ts`
- `pnpm db:push:test`
- `pnpm --filter @fiscalzen/api test:integration`

## Estado confirmado em 2026-05-06

- Validacao final com Docker ativo concluida com sucesso.
- API Fastify validada sem bypass de schema: validadores e serializadores padrao ativos, `GET /health` em `localhost:3001` respondendo 200.
- Causa do erro de startup corrigida: response schemas incompletos (`{ description: ... }`) e JSON Schema OpenAPI com `exclusiveMinimum` booleano eram invalidos para Fastify 4/AJV.
- Regressao adicionada em `tests/api-schema-compilation.test.ts` para compilar todas as rotas ativas no startup.
- `pnpm test:integration:up` validado.
- `pnpm db:push:test` validado.
- `pnpm --filter @fiscalzen/api test:integration` verde com `10` arquivos / `44` testes.
- `pnpm --filter @fiscalzen/api test:run tests/api-contract.test.ts tests/api-schema-compilation.test.ts` verde com `2` arquivos / `2` testes.
- `pnpm --filter @fiscalzen/api test:run tests/documents.public-document.test.ts tests/downloads.public-result.test.ts tests/pdf.helpers.test.ts tests/manifestacao.schemas.test.ts` verde com `4` arquivos / `9` testes.
- `pnpm --filter @fiscalzen/web build` verde.
- Branch pronta para PR e demo controlada.
- Nenhuma das falhas reais listadas para esta rodada foi reproduzida novamente.
- `pnpm db:push:test` continua seguro e reaplicavel sobre o banco de teste em `localhost:55434/fiscalzen_test`.
- `pnpm test:integration:up` agora e idempotente quando a propria stack esperada ja esta ativa e saudavel.
- Se `55434` ou `56380` estiver ocupada por servico externo ou container inesperado/nao saudavel, o bootstrap continua falhando com mensagem clara.
- Os avisos `FSTDEP021` observados anteriormente foram removidos na execucao validada ao converter as rotas legadas de `tags` para JSON Schema completo.

## Validacoes registradas anteriormente

- `pnpm test:integration:down`
- `pnpm test:integration:up`
- `pnpm db:push:test`
- `pnpm --filter @fiscalzen/api test:integration`
- `pnpm --filter @fiscalzen/database build`
- `pnpm --filter @fiscalzen/api build`
- `pnpm --filter @fiscalzen/api test:run tests/api-contract.test.ts`
- `pnpm --filter @fiscalzen/api test:run tests/documents.public-document.test.ts tests/downloads.public-result.test.ts tests/pdf.helpers.test.ts tests/manifestacao.schemas.test.ts`
- `pnpm --filter @fiscalzen/web build`

## Correcoes desta sessao por epico

- Hardening de contrato: extraídos helpers puros para sanitizar documentos públicos e resultados de downloads, reduzindo risco de vazamento de detalhes internos no JSON.
- EP04: listagem/status de downloads em lote não expõem mais `storageKey` nem `downloadUrl`; o ZIP continua acessível apenas pela rota autenticada específica.
- EP04/EP05: eventos auditáveis ligados ao ZIP deixaram de carregar `storageKey` em `details`, mas preservam rastreabilidade útil para o usuário.
- EP04: corrigido o worker de batch download para o retorno atual de `documentsService.getPdf`, evitando quebra operacional quando o pacote inclui PDF.
- EP02/EP04 Web: empresa e downloads agora exibem feedback de sucesso/erro para ações críticas, em vez de depender só de `console.error`.
- Documentação operacional: criado `docs/MVP_DEMO_CHECKLIST.md`.
- Testes de integração: além do setup seguro já criado, foram corrigidos bugs reais em `pdf`, `companies`, `documents`, `manifestacao`, `webhooks` e certificados para refletir o runtime/schema atual.
- Banco de teste: `pnpm db:push:test` permanece seguro e agora foi validado junto com a suíte completa, sem fallback para `DATABASE_URL`.
- Documentação de testes: `docs/TESTING.md` passou a registrar o fluxo confirmado `up -> db:push:test -> test:integration` e o estado verde da suíte.

## Pendencias restantes do EP09

- Validar o PDF operacional gerado contra cenários fiscais reais e confirmar se o layout atual atende ao nível de fidelidade exigido para DANFE/DACTE nos tipos suportados.
- Ampliar cobertura para outros tipos ainda sem base suficiente nesta rodada, especialmente MDF-e.
- Adicionar testes de serviço/rota cobrindo documento sem XML, tenant incorreto e falha de storage.

## Riscos atuais para demo/produção controlada

- Fluxos dependentes de storage/worker continuam exigindo validação manual no ambiente da demo.
- SEFAZ real depende de ambiente fiscal e certificado válido.
- PDF é operacional e não deve ser declarado DANFE/DACTE juridicamente validado em todos os cenários.
- O endpoint legado `apps/api/src/modules/pdf/routes.ts` permanece desativado e deve continuar isolado.
- Mesmo sem `FSTDEP021` na execucao validada, ainda vale revisar periodicamente outras rotas legadas quando houver upgrade de Fastify para v5.

## Observacao de testes extras

- `apps/api/tests/integration/documents.integration.test.ts` e os demais arquivos da suíte agora executam pelo fluxo padrão de integração.
- Após `pnpm test:integration:down`, é esperado repetir `pnpm test:integration:up` e `pnpm db:push:test` antes da suíte, porque os containers sobem limpos.

---

## 🚀 Próxima Sprint Recomendada (Sprint 1 do Backlog)

**Foco:** Validacao operacional de demo controlada
1.  Validar o fluxo real com Docker, Redis, worker de downloads e MinIO/S3 ativos.
2.  Executar checklist manual de demo com certificado valido e tenant de teste controlado.
3.  Verificar fluxos fiscais reais de manifestacao e sync em ambiente SEFAZ compativel.
4.  Consolidar checklist de deploy/rollback/backup/observabilidade antes de qualquer ambiente alem da demo.

---

> **Nota:** Este relatório foi gerado com base na análise cruzada entre os arquivos de documentação técnica e o código-fonte atual.
