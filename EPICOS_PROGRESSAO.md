# Progresso dos Epicos - MVP v1 FiscalZen

Atualizado em: 2026-05-04 21:09:30 -03:00

Observacao: as secoes "Atualizacao registrada" abaixo preservam checkpoints historicos da sessao. Em caso de conflito com entradas antigas, considere "Resposta direta" e "Status atual por epico" como a fonte de verdade mais recente.

## Resposta direta

- EP01: **nao concluido**, avancou com guarda automatizada de contrato.
- EP02: **nao concluido**, avancou com refinamento da UI de status NSU.
- EP03: **nao concluido**, avancou com tela funcional de documentos.
- EP04: **nao concluido**, avancou com `download_registry` persistente.
- Ponto de parada: **EP05 (Historico e Auditabilidade)**.

## Status atual por epico (estimativa operacional)

| ID   | Epico                              | Status         | Progresso | Observacao curta |
| :--- | :--------------------------------- | :------------- | :-------- | :--------------- |
| EP01 | Contrato API e Baseline            | ⚠️ Parcial      | 90%       | Envelope, aliases de paginação (`totalPages`) e schemas mais coerentes com as respostas reais; faltam apenas validacoes mais amplas fora do fluxo principal. |
| EP02 | Gestao de Empresas e Sync          | ✅ Adiantado    | 93%       | Tela de empresa agora cobre melhor estados de erro, certificado ausente/expirado e vazio de NSU; falta validacao E2E com sync real. |
| EP03 | Tela de Documentos                 | ⚠️ Parcial      | 87%       | Fluxos principais do inbox e detalhe foram endurecidos com anexos publicos, PDF/XML binarios tratados no frontend e menos dependencia de dados internos; ainda faltam refinamentos menores e mais testes. |
| EP04 | Downloads e Historico Local        | ⚠️ Parcial      | 92%       | API e UI de downloads deixaram de expor `storageKey`, o acesso ao ZIP segue autenticado/auditado e o worker foi corrigido para o novo retorno de PDF; falta validacao E2E completa com fila/storage reais. |
| EP05 | Historico e Auditabilidade         | ⚠️ Parcial      | 74%       | Timeline consolidada ganhou higienizacao dos detalhes de downloads e segue cobrindo PDF/manifestacao com menos risco de vazamento; faltam testes dedicados e mais fontes externas. |
| EP06 | Jobs e Filas                       | ✅ Adiantado    | 90%       | Mantido do relatorio anterior. |
| EP07 | Alertas Operacionais               | ✅ Adiantado    | 85%       | Mantido do relatorio anterior. |
| EP08 | Manifestacao do Destinatario       | ⚠️ Parcial      | 70%       | Fluxo operacional ganhou rota canonica, tela funcional, bloqueios de duplicidade, historico auditavel e contagens reais; falta validacao fiscal completa com SEFAZ/certificado em ambiente real. |
| EP09 | PDF e Anexos Fiscais               | ⚠️ Parcial      | 40%       | Fluxo principal deixou de retornar apenas 503: NFe e CTe agora podem gerar PDF operacional a partir do XML armazenado, com anexos listados e download autenticado; falta validacao fiscal/juridica mais ampla. |
| EP10 | Observabilidade e Seguranca        | ✅ Adiantado    | 70%       | Mantido do relatorio anterior. |

## Entregas feitas nesta sessao (impacto principal)

1. EP01: ajuste de contrato e envelope (`meta` canonico + compatibilidade legada) em `apps/api/src/utils/response.ts` e `apps/api/src/utils/schema-converter.ts`.
2. EP01: padronizacao em `companies` e `documents` (`apps/api/src/modules/companies/routes.ts`, `apps/api/src/modules/documents/routes.ts`) sem quebrar `DELETE` (mantido 204).
3. EP01/EP08: alinhamento de chamadas frontend para `/api/v1/...` e correcoes de tipagem em hooks/manifestacao.
4. Baseline de estabilidade: lint/build/test de `@fiscalzen/web` e build/test de `@fiscalzen/api` executados com sucesso.
5. EP01: normalizacao centralizada de paths no cliente web para evitar duplicacao de `/api/v1` quando `NEXT_PUBLIC_API_URL` ja inclui o prefixo.
6. EP08: substituido fallback default de `/manifestacao/pending` e `/manifestacao/count` por aliases reais no modulo de manifestacao, usando os dados de pendentes.
7. Validacao adicional: `@fiscalzen/web` build/test focal e `@fiscalzen/api` build/test focal executados com sucesso.
8. EP01: padronizacao adicional de `comments`, `tags`, `jobs` e `webhooks` para usar helpers de resposta (`sendSuccess`, `sendCreated`, `sendNoContent`, `sendError`) em vez de retornos crus.
9. EP01: schemas de `webhooks/regenerate-secret` e `webhooks/events-metadata` alinhados ao envelope `{ success, data }`.
10. EP01: varredura de rotas versionadas ativas confirmou que os retornos crus remanescentes estao apenas em `pdf/routes.ts`, modulo atualmente desativado no app principal.
11. Validacao adicional: `pnpm --filter @fiscalzen/api build` e `pnpm --filter @fiscalzen/api test:run tests/app.test.ts` executados com sucesso.
12. EP01: adicionada guarda automatizada em `apps/api/tests/api-contract.test.ts` para bloquear retornos crus em `src/modules/**/routes.ts` ativos.
13. EP02: refinada a tela `apps/web/app/(dashboard)/empresas/[id]/page.tsx` com status NSU sempre visivel, resumo operacional, ultima/proxima sync, erros, rate limit e progresso por tipo de documento.
14. Validacao adicional: `pnpm --filter @fiscalzen/api build`, `pnpm --filter @fiscalzen/api test:run tests/app.test.ts tests/api-contract.test.ts` e `pnpm --filter @fiscalzen/web build` executados com sucesso.
15. EP03: implementada a tela `apps/web/app/(dashboard)/documentos/page.tsx` como caixa de entrada fiscal com busca, filtros por empresa/tipo/situacao/periodo, cards de resumo e tabela de documentos.
16. EP03/EP04: seleção em lote conectada ao endpoint `POST /api/v1/downloads/batch` para gerar pacote XML ou pacote completo dos documentos selecionados.
17. Validacao adicional: `pnpm --filter @fiscalzen/web build` executado com sucesso apos a tela de documentos.
18. EP04: adicionada rota `GET /api/v1/downloads/batch` para listar jobs recentes de download em lote do tenant autenticado.
19. EP04: criados hook `apps/web/lib/hooks/use-downloads.ts` e tela `apps/web/app/(dashboard)/downloads/page.tsx` com polling, progresso, status, erros e link para ZIP concluido.
20. EP04: adicionada navegacao para `/downloads` na sidebar desktop e mobile; `/documentos` agora aponta para o centro apos enfileirar pacote.
21. Validacao adicional: `pnpm --filter @fiscalzen/api build`, `pnpm --filter @fiscalzen/api test:run tests/api-contract.test.ts` e `pnpm --filter @fiscalzen/web build` executados com sucesso.
22. EP04: adicionada tabela `download_registry` em `packages/database/src/schema/download-registry.ts` e migration `packages/database/drizzle/0003_download_registry.sql`.
23. EP04: `POST /api/v1/downloads/batch`, `GET /api/v1/downloads/batch` e `GET /api/v1/downloads/batch/:jobId` agora registram/sincronizam historico persistente por tenant.
24. EP04: worker `batch-download.worker.ts` atualiza o registry em inicio, sucesso e falha do pacote.
25. Validacao adicional: `pnpm --filter @fiscalzen/database build`, `pnpm --filter @fiscalzen/api build`, `pnpm --filter @fiscalzen/api test:run tests/api-contract.test.ts` e `pnpm --filter @fiscalzen/web build` executados com sucesso.
26. EP05: criada a tabela `document_history` com migration dedicada e modulo backend `history` para consolidar eventos operacionais auditaveis por tenant/documento/empresa.
27. EP05: adicionada rota `GET /api/v1/documents/:id/history`, que une `document_history` e `document_events` numa timeline unica do ciclo fiscal.
28. EP04/EP05: downloads em lote agora registram eventos de enfileiramento, inicio de processamento, conclusao, falha e acesso autenticado ao ZIP concluido.
29. EP05: tela `apps/web/app/(dashboard)/documentos/[id]/page.tsx` passou a exibir a secao `Historico` consumindo a nova timeline consolidada.
30. Validacao adicional: `pnpm --filter @fiscalzen/database build`, `pnpm --filter @fiscalzen/api build`, `pnpm --filter @fiscalzen/api test:run tests/api-contract.test.ts` e `pnpm --filter @fiscalzen/web build` executados com sucesso apos a base funcional do historico.
31. EP01/EP03: corrigido o contrato real do inbox de documentos, com filtros enviados nos nomes esperados pela API (`dataInicio`, `dataFim`, `limit`) e envelope de paginação usando tambem `totalPages`.
32. EP03: `useDocuments` passou a consumir `meta/pagination` sem perder o envelope; a tela `/documentos` agora usa total real, total de paginas, estado de erro e feedback explicito para lote vazio/falho.
33. EP03: corrigido o fluxo de download XML individual no frontend para baixar o blob retornado pela rota autenticada, sem esperar uma URL inexistente.
34. EP02: tela de empresa endurecida com estados de erro, ausencia/expiracao de certificado e mensagens mais operacionais para NSU sem historico.
35. EP04: `GET /api/v1/downloads/batch/:jobId` agora faz fallback para `download_registry` quando o job ja nao existe mais na fila; a tela `/downloads` ganhou estados mais claros e polling que para quando todos os jobs chegam a estado terminal.
36. EP05: timeline ficou mais legivel e resiliente a datas invalidas/ausentes, exibe detalhes principais de metadata e padroniza melhor titulos/labels de eventos.
37. Validacao adicional: `pnpm --filter @fiscalzen/database build`, `pnpm --filter @fiscalzen/api build`, `pnpm --filter @fiscalzen/api test:run tests/api-contract.test.ts` e `pnpm --filter @fiscalzen/web build` executados com sucesso apos a rodada de polimento EP01-EP05.
38. EP08: consolidada rota canonica `POST /api/v1/manifestacao/:documentId`, mantendo aliases existentes (`/pendentes`, `/pending`, `/count`) com envelope canonico e adicionando `awaiting-final` e `history`.
39. EP08/EP05: servico de manifestacao passou a registrar eventos `requested`, `completed` e `failed` em `document_history`, com `source`, `sourceId`, `correlationId`, protocolo quando existir e erro fiscal quando houver.
40. EP08: fluxo agora bloqueia manifestacao indevida quando o documento ja esta em estado final, permite retry apos falha, valida tenant/documento elegivel e impede protocolo ficticio quando a resposta real nao existe.
41. EP08: a tela `apps/web/app/(dashboard)/manifestacao/page.tsx` deixou de ser placeholder e passou a operar com lista de pendentes, aguardando finalizacao, historico recente, filtro por empresa e cards de contagem.
42. EP08: hooks do frontend passaram a usar a rota canonica de manifestacao e os endpoints reais de `awaiting-final` e `history`, reaproveitando a timeline/auditabilidade ja criada no EP05.
43. Validacao adicional: `pnpm --filter @fiscalzen/api test:run tests/manifestacao.schemas.test.ts` executado com sucesso.
44. EP09: reativado o fluxo principal de PDF em `documents`, reaproveitando o gerador existente com `pdfmake`, cache em `pdfStorageKey` e suporte operacional para NFe/NFCe e CTe a partir do XML armazenado.
45. EP09/EP05: downloads de PDF agora registram eventos `pdf.requested`, `pdf.generated` e `pdf.failed` em `document_history`, exibidos na timeline consolidada do documento.
46. EP09: criada a listagem `GET /api/v1/documents/:id/attachments`, expondo apenas anexos publicos disponiveis (XML/PDF) sem vazar `storageKey` diretamente.
47. EP09 Web: a tela `/documentos/[id]` ganhou secao de anexos fiscais e botao de PDF; a tabela `/documentos` passou a oferecer acao individual de `Visualizar PDF`.
48. Validacao adicional: `pnpm --filter @fiscalzen/api test:run tests/pdf.helpers.test.ts` executado com sucesso.
49. Hardening geral: extraidos helpers puros para sanitizacao de documentos publicos e resultados de downloads, impedindo que `xmlStorageKey`, `pdfStorageKey`, `storageKey` ou `downloadUrl` vazem nas respostas JSON do MVP.
50. EP04/EP05: fluxo de ZIP em lote passou a expor apenas resumo publico no polling e na listagem; eventos de timeline ligados ao ZIP nao carregam mais `storageKey` em `details`.
51. EP04: corrigido o worker de batch para usar o novo retorno de `documentsService.getPdf`, evitando erro silencioso no pacote ZIP quando o formato inclui PDF.
52. EP02/EP04 Web: telas de empresa e downloads ganharam feedback operacional de sucesso/erro para acoes de sync, desativacao e liberacao do ZIP autenticado.
53. Documentacao operacional: criado `docs/MVP_DEMO_CHECKLIST.md` com prerequisitos, variaveis essenciais, servicos, workers, fluxos manuais e limitacoes conhecidas para a demo.
54. Validacao adicional: `pnpm --filter @fiscalzen/api test:run tests/documents.public-document.test.ts tests/downloads.public-result.test.ts tests/pdf.helpers.test.ts tests/manifestacao.schemas.test.ts` executado com sucesso.
55. Infra de testes: criado `apps/api/tests/integration/setup.integration.ts`, centralizando variaveis, constantes e validacao de URL segura para o banco de integracao.
56. Infra de testes: `tests/integration/setup.ts` e `global-setup.ts` passaram a usar o setup central, com falha explicita para banco inacessivel ou schema ausente, em vez de quebrar por import inexistente.
57. Infra de testes: formalizado `pnpm db:push:test` com `scripts/db-push-test.mjs` e `packages/database/drizzle-test.config.ts`, recusando banco que nao pareca ambiente de teste.
58. Documentacao: criado `docs/TESTING.md` e atualizado `docs/MVP_DEMO_CHECKLIST.md` com o fluxo seguro de integracao (`test:integration:up`, `db:push:test`, `test:integration`).
59. Estabilizacao da suite de integracao: corrigidos bugs reais em PDF (`PdfPrinter`/factory async), `companies`, `documents`, `manifestacao`, `webhooks` e certificados sem afrouxar os guard rails do banco de teste.
60. EP01/EP02/EP03/EP08/EP09: ajustes de contrato e serializacao nas rotas de `companies` e `documents` para evitar objetos vazios em runtime, schema invalido no Fastify e drift entre frontend/testes e payload aceito.
61. Infra validada ponta a ponta: `pnpm test:integration:up`, `pnpm db:push:test` e `pnpm --filter @fiscalzen/api test:integration` executados com sucesso; suite principal agora fecha com `10` arquivos e `44` testes verdes.
62. Fechamento com Docker ativo: `pnpm test:integration:up` validado, `pnpm db:push:test` validado e `pnpm --filter @fiscalzen/api test:integration` verde com `10` arquivos / `44` testes.
63. Fechamento leve: `pnpm --filter @fiscalzen/api test:run tests/api-contract.test.ts tests/api-schema-compilation.test.ts` verde com `2` arquivos / `2` testes; `pnpm --filter @fiscalzen/api test:run tests/documents.public-document.test.ts tests/downloads.public-result.test.ts tests/pdf.helpers.test.ts tests/manifestacao.schemas.test.ts` verde com `4` arquivos / `9` testes; `pnpm --filter @fiscalzen/web build` verde.
64. Estado de entrega: branch pronta para PR e demo controlada, mantendo validacao manual dos fluxos com storage/worker no ambiente de demo.
65. Schema Fastify reativado: removido bypass temporario de `app.ts`, corrigido `zodToFastify` para JSON Schema 7 compativel com Fastify 4/AJV e normalizados responses incompletos que causavam `FST_ERR_SCH_SERIALIZATION_BUILD`.

## Atualizacao registrada

- Data/hora da modificacao: 2026-05-06.
- Fechamento final revalidado com Docker ativo: `pnpm test:integration:up`, `pnpm db:push:test` e `pnpm --filter @fiscalzen/api test:integration` verdes.
- Resultado objetivo da suite integrada: `10` arquivos / `44` testes.
- Testes leves confirmados: contrato/schema compilation com `2` arquivos / `2` testes e conjunto de documentos/downloads/PDF/manifestacao com `4` arquivos / `9` testes.
- `pnpm --filter @fiscalzen/web build` verde.
- API dev confirmada em `localhost:3001/health` com status 200, validação e serialização padrão ativas.
- Branch pronta para PR e demo controlada.
- Limitacoes reais mantidas: SEFAZ real depende de ambiente/certificado valido; PDF e operacional e nao deve ser declarado DANFE/DACTE juridicamente validado em todos os cenarios; fluxos com storage/worker devem ser conferidos manualmente no ambiente de demo.

## Atualizacao registrada

- Data/hora da modificacao: 2026-05-03 23:01:08 -03:00.
- EP01 atualizado para 70% por conta da normalizacao centralizada de paths no cliente web e baseline verde.
- EP08 atualizado para 50% porque `/manifestacao/pending` e `/manifestacao/count` agora retornam dados reais do modulo de manifestacao, sem fallback default.
- Validacoes registradas: build de `@fiscalzen/web`, build de `@fiscalzen/api`, teste focal `apps/web/lib/api.test.ts` e teste focal `apps/api/tests/app.test.ts`.

## Atualizacao registrada

- Data/hora da modificacao: 2026-05-03 23:03:45 -03:00.
- EP01 atualizado para 80% apos padronizar retornos de rotas versionadas ativas em `comments`, `tags`, `jobs` e `webhooks`.
- Retornos 403 administrativos de `jobs` agora passam por `sendError` com `ForbiddenError`.
- Criacao/remoção em `comments` e `tags` agora usam helpers canonicos mantendo 201/204.
- `webhooks/regenerate-secret` e `webhooks/events-metadata` agora respondem/documentam envelope `{ success, data }`.
- Validacoes registradas: `pnpm --filter @fiscalzen/api build` e `pnpm --filter @fiscalzen/api test:run tests/app.test.ts`.

## Atualizacao registrada

- Data/hora da modificacao: 2026-05-03 23:20:39 -03:00.
- EP01 atualizado para 85% apos adicionar teste de contrato que varre rotas ativas e impede retorno cru fora dos helpers canonicos.
- EP02 atualizado para 90% apos refinar a UI de status NSU na tela de detalhe da empresa.
- A tela de empresa agora exibe estado vazio/carregando do NSU, status geral, ultima/proxima sincronizacao, erros acumulados, rate limit e progresso por tipo de documento.
- Validacoes registradas: `pnpm --filter @fiscalzen/api build`, `pnpm --filter @fiscalzen/api test:run tests/app.test.ts tests/api-contract.test.ts` e `pnpm --filter @fiscalzen/web build`.

## Atualizacao registrada

- Data/hora da modificacao: 2026-05-03 23:26:37 -03:00.
- EP03 atualizado para 75% apos substituir o placeholder de `/documentos` por uma caixa de entrada fiscal funcional.
- A tela agora possui busca, filtros por empresa/tipo/situacao/periodo, cards de resumo, tabela paginada, seleção de linhas e ação de pacote em lote.
- A ação em lote usa `POST /api/v1/downloads/batch` para enfileirar pacote XML ou pacote completo dos documentos selecionados.
- Validacao registrada: `pnpm --filter @fiscalzen/web build`.

## Atualizacao registrada

- Data/hora da modificacao: 2026-05-03 23:31:42 -03:00.
- EP04 atualizado para 55% apos criar o centro `/downloads` e a listagem de jobs recentes de download em lote.
- Backend agora expoe `GET /api/v1/downloads/batch` para acompanhar jobs recentes do tenant pela fila BullMQ.
- Frontend ganhou hooks de downloads, tela com progresso/status/erro/link de ZIP e navegacao desktop/mobile.
- Pendencia principal restante: criar `download_registry` persistente para historico local auditavel alem da retencao da fila.
- Validacoes registradas: `pnpm --filter @fiscalzen/api build`, `pnpm --filter @fiscalzen/api test:run tests/api-contract.test.ts` e `pnpm --filter @fiscalzen/web build`.

## Atualizacao registrada

- Data/hora da modificacao: 2026-05-03 23:38:30 -03:00.
- EP04 atualizado para 75% apos implementar `download_registry` persistente em banco.
- Criados schema e migration do registry de downloads; a API grava o registro ao enfileirar pacote e sincroniza status/progresso/resultado com a fila.
- O worker de batch download atualiza o registry em inicio, conclusao e falha, preservando historico mesmo apos retencao da fila.
- Pendencias restantes: auditar acesso efetivo ao ZIP, validar E2E com Redis/MinIO/worker reais e integrar o historico ao EP05.
- Validacoes registradas: `pnpm --filter @fiscalzen/database build`, `pnpm --filter @fiscalzen/api build`, `pnpm --filter @fiscalzen/api test:run tests/api-contract.test.ts` e `pnpm --filter @fiscalzen/web build`.

## Atualizacao registrada

- Data/hora da modificacao: 2026-05-03 23:58:30 -03:00.
- EP04 atualizado para 85% apos registrar auditoria de enfileiramento, processamento, conclusao, falha e acesso autenticado ao ZIP concluido.
- EP05 atualizado para 55% apos implementar `document_history`, modulo `history` no backend e timeline consolidada em `GET /api/v1/documents/:id/history`.
- A tela de detalhe do documento agora exibe a timeline consolidada; downloads em lote passaram a alimentar o historico do documento.
- Pendencias restantes: ampliar cobertura para mais mudancas de status/erros de jobs externos, adicionar testes especificos de history/downloads e validar E2E com Redis/MinIO/banco de integracao realmente provisionados.
- Validacoes registradas: `pnpm --filter @fiscalzen/database build`, `pnpm --filter @fiscalzen/api build`, `pnpm --filter @fiscalzen/api test:run tests/api-contract.test.ts` e `pnpm --filter @fiscalzen/web build`.
- Observacao de teste: os arquivos `tests/integration/documents.test.ts` e `tests/integration/documents.integration.test.ts` nao rodaram pelo fluxo default; a suite de integracao falhou por setup ausente (`pnpm db:push:test` / import `./setup.integration`), nao por erro de compilacao da entrega.

## Atualizacao registrada

- Data/hora da modificacao: 2026-05-04 00:08:30 -03:00.
- EP01 atualizado para 90% apos alinhar melhor schemas/respostas reais e expor `totalPages` sem quebrar compatibilidade com `pages`.
- EP02 atualizado para 93% apos endurecer estados operacionais da tela de empresa e mensagens para certificado/NSU.
- EP03 atualizado para 85% apos corrigir busca textual, paginação real, meta/pagination no frontend e feedback de lote/download XML.
- EP04 atualizado para 90% apos reforcar estados do centro de downloads, polling condicional e fallback ao `download_registry` quando o job da fila ja expirou.
- EP05 atualizado para 68% apos melhorar indices, legibilidade/resiliencia da timeline e padronizacao de detalhes de rastreabilidade (`sourceId`, `correlationId`, `jobId` em metadata).
- Validacoes registradas: `pnpm --filter @fiscalzen/database build`, `pnpm --filter @fiscalzen/api build`, `pnpm --filter @fiscalzen/api test:run tests/api-contract.test.ts` e `pnpm --filter @fiscalzen/web build`.
- Testes extras nao adicionados nesta rodada; o foco permaneceu em estabilidade operacional e os testes de integracao conhecidos seguem limitados por setup ausente no repositorio.

## Atualizacao registrada

- Data/hora da modificacao: 2026-05-04 00:48:18 -03:00.
- EP08 atualizado para 70% apos transformar a manifestacao em fluxo operacional do MVP, com rota canonica por documento, tela funcional, hooks reais e integracao consistente com a timeline do EP05.
- `GET /api/v1/manifestacao/pendentes`, `/pending` e `/count` foram mantidos em envelope canonico; a API passou a expor tambem `GET /api/v1/manifestacao/awaiting-final`, `GET /api/v1/manifestacao/history` e `POST /api/v1/manifestacao/:documentId`.
- O backend agora valida tenant/documento, bloqueia duplicidade quando a manifestacao ja esta em estado final, permite nova tentativa apos falha e registra eventos `manifestacao.requested`, `manifestacao.completed` e `manifestacao.failed` em `document_history`.
- A tela `/manifestacao` agora lista pendentes reais, aguardando finalizacao e historico recente, com filtro por empresa e feedback mais claro para operacao.
- Limitacao restante: a chamada fiscal real ainda depende de certificado valido e validacao em ambiente SEFAZ; quando nao houver protocolo real, o sistema nao fabrica protocolo.
- Validacoes registradas: `pnpm --filter @fiscalzen/database build`, `pnpm --filter @fiscalzen/api build`, `pnpm --filter @fiscalzen/api test:run tests/api-contract.test.ts`, `pnpm --filter @fiscalzen/api test:run tests/manifestacao.schemas.test.ts` e `pnpm --filter @fiscalzen/web build`.
- Observacao de testes: suites de integracao continuam limitadas por setup ausente no repositorio (`pnpm db:push:test` e import `./setup.integration`), nao por regressao desta entrega.

## Atualizacao registrada

- Data/hora da modificacao: 2026-05-04 01:13:25 -03:00.
- EP09 atualizado para 40% apos desbloquear o fluxo principal de PDF fiscal no modulo `documents`, sem depender do endpoint legado desativado em `pdf/routes.ts`.
- Suporte atual: NFe/NFCe e CTe com PDF operacional gerado a partir do XML armazenado; tipos sem base suficiente continuam retornando erro claro e canonicamente tratado.
- O endpoint `GET /api/v1/documents/:id/pdf` agora expõe apenas metadados/disponibilidade do PDF, e `GET /api/v1/documents/:id/pdf/download` entrega o arquivo autenticado com `Content-Type: application/pdf`.
- Foi adicionada a rota `GET /api/v1/documents/:id/attachments`, listando XML e PDF disponiveis sem expor `xmlStorageKey`/`pdfStorageKey`; `GET /api/v1/documents/:id` e `/chave/:chave` passaram a devolver apenas `hasXml`/`hasPdf`.
- EP05 atualizado para 72% porque a timeline agora mostra tentativa, sucesso e falha de PDF (`pdf.requested`, `pdf.generated`, `pdf.failed`).
- Limitacoes restantes: o PDF reativado e uma visualizacao operacional baseada no XML e no parser existente, nao uma garantia de DANFE/DACTE juridicamente validado em todos os cenarios fiscais; MDF-e e outros tipos seguem sem suporte nesta rodada.
- Validacoes registradas: `pnpm --filter @fiscalzen/database build`, `pnpm --filter @fiscalzen/api build`, `pnpm --filter @fiscalzen/api test:run tests/api-contract.test.ts`, `pnpm --filter @fiscalzen/api test:run tests/pdf.helpers.test.ts` e `pnpm --filter @fiscalzen/web build`.
- Observacao de testes: suites de integracao continuam limitadas por setup ausente no repositorio (`pnpm db:push:test` e import `./setup.integration`), nao por regressao desta entrega.

## Atualizacao registrada

- Data/hora da modificacao: 2026-05-04 01:26:34 -03:00.
- Rodada de hardening focada em demo/ambiente controlado, sem abrir novas frentes grandes.
- EP03 atualizado para 87% por conta do endurecimento do detalhe do documento e do consumo seguro de anexos/PDF/XML no frontend.
- EP04 atualizado para 92% apos remover `storageKey` e `downloadUrl` das respostas JSON de downloads, manter o ZIP apenas via rota autenticada e corrigir o worker para o retorno atual de PDF.
- EP05 atualizado para 74% apos higienizar os detalhes de eventos de download na timeline, reduzindo risco de vazar informacao interna.
- Criados testes leves de sanitizacao em `tests/documents.public-document.test.ts` e `tests/downloads.public-result.test.ts`.
- Criado o checklist `docs/MVP_DEMO_CHECKLIST.md` com prerequisitos, servicos obrigatorios, workers, fluxo manual e limitacoes conhecidas.
- Validacoes registradas: `pnpm --filter @fiscalzen/database build`, `pnpm --filter @fiscalzen/api build`, `pnpm --filter @fiscalzen/api test:run tests/api-contract.test.ts`, `pnpm --filter @fiscalzen/api test:run tests/documents.public-document.test.ts tests/downloads.public-result.test.ts tests/pdf.helpers.test.ts tests/manifestacao.schemas.test.ts` e `pnpm --filter @fiscalzen/web build`.
- Risco remanescente para demo/producao: suites de integracao continuam bloqueadas por setup ausente (`pnpm db:push:test` e import `./setup.integration`), portanto a cobertura permanece focada em build, contrato e testes leves.

## Atualizacao registrada

- Data/hora da modificacao: 2026-05-04 01:45:23 -03:00.
- Infraestrutura de integracao deixou de falhar por setup ausente: `setup.integration.ts` agora existe e centraliza env/constantes/guardas de seguranca.
- `pnpm db:push:test` agora existe formalmente e usa config dedicada (`drizzle-test.config.ts`) para evitar qualquer uso acidental do banco de desenvolvimento.
- `pnpm --filter @fiscalzen/api test:integration` agora falha com motivo explicito de ambiente, nao mais por import quebrado: no ambiente atual, o Postgres de teste em `localhost:5434/fiscalzen_test` responde com erro de autenticacao/schema ausente.
- Nenhum percentual dos epicos foi inflado nesta rodada; o ganho principal foi de prontidao operacional e seguranca da infraestrutura de testes.
- Validacoes registradas: `pnpm db:push:test` executado (falha controlada por autenticacao do banco de teste), `pnpm --filter @fiscalzen/api test:integration` executado (falha controlada por banco de teste/schema), `pnpm --filter @fiscalzen/database build`, `pnpm --filter @fiscalzen/api build`, `pnpm --filter @fiscalzen/api test:run tests/api-contract.test.ts`, `pnpm --filter @fiscalzen/api test:run tests/documents.public-document.test.ts tests/downloads.public-result.test.ts tests/pdf.helpers.test.ts tests/manifestacao.schemas.test.ts` e `pnpm --filter @fiscalzen/web build`.

## Atualizacao registrada

- Data/hora da modificacao: 2026-05-04 21:09:30 -03:00.
- Limpeza tecnica de compatibilidade Fastify: removidos os avisos `FSTDEP021` observados na suite de integracao ao converter as rotas legadas de `tags` para JSON Schema completo, sem alterar payload, status code ou regra de negocio.
- Rotas ajustadas nesta rodada: `PUT /api/v1/tags/:id`, `DELETE /api/v1/tags/:id`, `POST /api/v1/tags/documents/:documentId/tags` e `DELETE /api/v1/tags/documents/:documentId/tags/:tagId`.
- Revalidacao concluida com sucesso: `pnpm --filter @fiscalzen/api test:integration`, `pnpm --filter @fiscalzen/api test:run tests/api-contract.test.ts`, `pnpm --filter @fiscalzen/api build`, `pnpm --filter @fiscalzen/database build`, `pnpm --filter @fiscalzen/web build` e `pnpm --filter @fiscalzen/api test:run tests/documents.public-document.test.ts tests/downloads.public-result.test.ts tests/pdf.helpers.test.ts tests/manifestacao.schemas.test.ts`.
- Resultado objetivo: suite principal segue verde com `10` arquivos e `44` testes, sem `FSTDEP021` na execucao validada.

## Atualizacao registrada

- Data/hora da modificacao: 2026-05-04 20:58:30 -03:00.
- Hardening final da infraestrutura de integracao: `scripts/test-integration-up.mjs` agora distingue stack de teste ja saudavel de conflito externo real, retornando sucesso idempotente quando `fiscalzen-postgres-test` e `fiscalzen-redis-test` ja estao saudaveis.
- Fluxo final revalidado em sequencia: `pnpm test:integration:down`, `pnpm test:integration:up`, `pnpm test:integration:up`, `pnpm db:push:test` e `pnpm --filter @fiscalzen/api test:integration`.
- Suite principal confirmada verde apos o polimento: `10` arquivos e `44` testes.
- Validacoes leves tambem reexecutadas com sucesso: `pnpm --filter @fiscalzen/database build`, `pnpm --filter @fiscalzen/api build`, `pnpm --filter @fiscalzen/web build`, `pnpm --filter @fiscalzen/api test:run tests/api-contract.test.ts` e `pnpm --filter @fiscalzen/api test:run tests/documents.public-document.test.ts tests/downloads.public-result.test.ts tests/pdf.helpers.test.ts tests/manifestacao.schemas.test.ts`.

## Atualizacao registrada

- Data/hora da modificacao: 2026-05-04 19:52:30 -03:00.
- Revalidacao desta sessao confirmou que a suite principal continua verde nesta arvore de trabalho: `pnpm --filter @fiscalzen/api test:integration` fechou com `10` arquivos e `44` testes.
- Validacoes reexecutadas com sucesso: `pnpm --filter @fiscalzen/database build`, `pnpm --filter @fiscalzen/api build`, `pnpm --filter @fiscalzen/web build`, `pnpm --filter @fiscalzen/api test:run tests/api-contract.test.ts`, `pnpm --filter @fiscalzen/api test:run tests/documents.public-document.test.ts tests/downloads.public-result.test.ts tests/pdf.helpers.test.ts tests/manifestacao.schemas.test.ts`, `pnpm db:push:test` e `pnpm --filter @fiscalzen/api test:integration`.
- Observacao operacional: com a stack de teste ja ativa, `pnpm test:integration:up` falha por porta `55434` ocupada; isso caracteriza reexecucao nao idempotente do bootstrap, nao falha funcional da suite.
- Nenhuma falha real restante foi reproduzida nesta sessao; os bugs listados inicialmente ja estao corrigidos no workspace atual.

## Atualizacao registrada

- Data/hora da modificacao: 2026-05-04 13:10:24 -03:00.
- Rodada focada exclusivamente em corrigir falhas reais da suite de integracao, sem abrir features novas e sem relaxar os guard rails de `DATABASE_URL_TEST`.
- Corrigidos: `PdfPrinter is not a constructor`, `webhooks.name` nulo, `UPDATE companies` com SQL invalido/payload vazio, normalizacao de datas em manifestacao, expectativa de unicidade de CNPJ por tenant e drift de fixtures antigos de certificados/documentos.
- Ajustados tambem schemas/serializacao das rotas de `companies` e `documents`, evitando que o Fastify removesse os campos reais do payload em respostas envelopadas.
- Validacoes registradas: `pnpm test:integration:down`, `pnpm test:integration:up`, `pnpm db:push:test`, `pnpm --filter @fiscalzen/api test:integration`, `pnpm --filter @fiscalzen/database build`, `pnpm --filter @fiscalzen/api build`, `pnpm --filter @fiscalzen/api test:run tests/api-contract.test.ts`, `pnpm --filter @fiscalzen/api test:run tests/documents.public-document.test.ts tests/downloads.public-result.test.ts tests/pdf.helpers.test.ts tests/manifestacao.schemas.test.ts` e `pnpm --filter @fiscalzen/web build`.
- Resultado objetivo: suite principal de integracao verde (`10` arquivos / `44` testes). Percentuais dos epicos foram mantidos, porque a rodada foi de estabilizacao e nao de escopo funcional novo.

Corrigido.
                                                                          
  Causa                                                                   
  O container dev usa MEILI_MASTER_KEY=fiscalzen_meilisearch_dev_key, mas 
  a API podia subir com MEILISEARCH_API_KEY ausente/divergente. O health  
  do Meilisearch ainda responde, mas operações de índice (getIndexes,     
  createIndex, updateSettings) falham com invalid_api_key.                
                                                                          
  Alterações                                                              
                                                                          
  - apps/api/src/config/env.ts: aceita MEILISEARCH_URL e fallback legado  
    MEILISEARCH_HOST; trata MEILISEARCH_API_KEY= vazio como ausente.      
  - apps/api/src/config/meilisearch.ts: logs estruturados, warning claro e
    retorno booleano no setup de índices.                                 
  - apps/api/src/index.ts: se o setup de índices falhar, a API continua   
    subindo com busca degradada.                                          
  - docker/docker-compose.yml: profile local da API também recebe         
    MEILISEARCH_API_KEY=fiscalzen_meilisearch_dev_key.                    
  - .env.example: MEILISEARCH_API_KEY=fiscalzen_meilisearch_dev_key.      
  - docs/MVP_DEMO_CHECKLIST.md e docs/TESTING.md: documentado alinhamento 
    MEILI_MASTER_KEY/MEILISEARCH_API_KEY e comportamento degradado.       
                                                                          
  Validações                                                              
  - docker ps --filter name=fiscalzen-meilisearch: container healthy em   
    localhost:7700.
  - GET http://localhost:7700/health: 200.
  - GET http://localhost:7700/indexes com bearer fiscalzen_meilisearch_de 
  - pnpm --filter @fiscalzen/web build: verde.
  - Startup API isolado em PORT=3016: /health/ready 200 e log Meilisearch 
    indexes configured.
  - Startup com chave inválida em PORT=3017: /health/ready 200 e warning  
    claro Meilisearch index setup failed; API startup will continue with  
    search degraded.

  Pendência fora deste escopo: no smoke apareceu warning de storage/MinIO 
  bucket não encontrado em /health/ready; não bloqueou startup e não      
  alterei isso nesta rodada.

─ Worked for 4m 33s ──────────────────────────────────────────────────────


› Resuma tudo que foi feito nessa seção, de onde paramos, para
  continuarmos depois.
                                                                          

• Nesta seção trabalhamos no hardening do ambiente dev/API do FiscalZen   
  MVP v1.                                                                 
                                                                          
  Principais entregas                                                     
                                                                          
  - Corrigido Swagger para Fastify 4:                                     
      - @fastify/swagger ajustado para 8.15.0.                            
      - @fastify/swagger-ui ajustado para 1.10.2.                         
      - ENABLE_SWAGGER=true habilita /documentation.                      
      - Startup não quebra se Swagger falhar.                             
  - Corrigido OpenTelemetry:                                              
      - Removido import quebrado de Resource.                             
      - Uso de resourceFromAttributes.                                    
      - ENABLE_TRACING=true habilita tracing.                             
      - Desligado por padrão e com degradação controlada.                 
  - Criado bootstrap dev:                                                 
      - Novo pnpm seed:dev.                                               
      - Novo pnpm db:seed:dev.                                            
      - Novo pnpm dev:bootstrap.                                          
      - Seed idempotente cria tenant:                                     
        00000000-0000-0000-0000-000000000000                              
      - DISABLE_AUTH usa esse tenant e usuário dev:                       
        00000000-0000-0000-0000-000000000001.                             
      - Guard rails impedem seed dev contra banco de teste/produção.      
  - Corrigido fluxo dev de banco:                                         
      - pnpm db:push agora usa drizzle-kit push --force.                  
      - Defaults dev alinhados para Postgres localhost:55432.             
      - Foi necessário reconciliar senha do volume local antigo do        
        Postgres dev.                                                     
  - Corrigido Meilisearch dev:                                            
      - Chave dev alinhada:                                               
        fiscalzen_meilisearch_dev_key.                                    
      - MEILISEARCH_URL e fallback legado MEILISEARCH_HOST.               
      - Setup do índice documents loga sucesso.                           
      - Se chave/serviço falhar, API sobe com busca degradada e warning   
        claro.                                                            
                                                                          
  Validações verdes                                                       
                                                                          
  - pnpm docker:up                                                        
  - pnpm db:push                                                          
  - pnpm seed:dev                                                         
  - pnpm --filter @fiscalzen/database build                               
  - pnpm --filter @fiscalzen/api build                                    
  - pnpm --filter @fiscalzen/web build                                    
  - pnpm --filter @fiscalzen/api test:run tests/api-contract.test.ts      
    tests/api-schema-compilation.test.ts                                  
  - API temporária com DISABLE_AUTH=true:                                 
      - /health: 200                                                      
      - /api/v1/companies: 200                                            
      - /api/v1/documents: 200                                            
      - /api/v1/dashboard/summary: 200                                    
  - Meilisearch:                                                          
      - /health: 200                                                      
      - /indexes com chave dev: 200                                       
      - startup API com chave correta: Meilisearch indexes configured     
      - startup API com chave inválida: API sobe e loga busca degradada.  
                                                                          
  Arquivos tocados mais relevantes                                        
                                                                          
  - apps/api/src/config/env.ts                                            
  - apps/api/src/config/tracing.ts                                        
  - apps/api/src/config/meilisearch.ts                                    
  - apps/api/src/plugins/swagger.ts                                       
  - apps/api/src/plugins/auth.ts                                          
  - apps/api/src/index.ts                                                 
  - packages/database/src/seed-dev.ts                                     
  - packages/database/package.json                                        
  - package.json                                                          
  - docker/docker-compose.yml                                             
  - .env.example                                                          
  - apps/api/.env.example                                                 
  - docs/MVP_DEMO_CHECKLIST.md                                            
  - docs/TESTING.md                                                       
  - pnpm-lock.yaml                                                        
                                                                          
  Onde paramos                                                            
  A API/dev stack está funcional com banco dev, tenant dev, Redis,        
  Meilisearch e Swagger/tracing tratados corretamente. A pendência        
  observada no último smoke foi fora do escopo: /health/ready logou       
  warning de storage/MinIO bucket não encontrado (Storage connection      
  failed: NotFound). O startup não quebrou, mas esse é o próximo ponto    
  natural para corrigir.                                                  
 
                                                                          › Summarize recent commits                                                 
  gpt-5.5 medium · C:\fiscalzen-project
