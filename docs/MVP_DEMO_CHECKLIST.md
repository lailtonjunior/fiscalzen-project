# MVP Demo Checklist

## Objetivo

Checklist pragmático para subir o FiscalZen MVP v1 em ambiente de demo controlado, validando os fluxos principais sem prometer integrações ou artefatos fiscais além do que o código suporta hoje.

## Pré-requisitos

- Node.js compatível com o workspace `pnpm`
- `pnpm` instalado
- Banco PostgreSQL disponível
- Redis disponível
- MinIO ou S3 compatível disponível
- Meilisearch disponível se a busca textual de documentos for usada na demo

## Variáveis de ambiente essenciais

Backend `apps/api`:

- `DATABASE_URL`
- `REDIS_URL` ou configuração equivalente usada em `apps/api/src/config/redis`
- `S3_ENDPOINT`
- `S3_REGION`
- `S3_ACCESS_KEY`
- `S3_SECRET_KEY`
- `S3_BUCKET`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `ENABLE_SWAGGER=false` por padrão; use `true` apenas quando precisar da documentação local
- `ENABLE_TRACING=false` por padrão; use `true` apenas com coletor configurado
- `JAEGER_ENDPOINT` opcional quando `ENABLE_TRACING=true`

Frontend `apps/web`:

- `NEXT_PUBLIC_API_URL`
- variáveis do Clerk ou do provedor de autenticação usado no ambiente

Observação:

- `DISABLE_AUTH=true` só deve ser usado em ambiente local de desenvolvimento. Não habilitar em demo compartilhada nem em produção.
- Quando `DISABLE_AUTH=true`, a API usa `DEV_TENANT_ID=00000000-0000-0000-0000-000000000000` e `DEV_USER_ID=00000000-0000-0000-0000-000000000001` por padrão. Rode `pnpm seed:dev` antes de iniciar a API para criar esse tenant no banco dev.

## Serviços necessários

- PostgreSQL: persistência principal
- Redis: BullMQ, filas e jobs
- MinIO/S3: XML, PDFs e ZIPs
- Meilisearch: recomendado para busca; sem ele, a demo pode ficar limitada em alguns fluxos de pesquisa

## Stack Docker local de desenvolvimento

`pnpm docker:up` sobe a stack dev em portas dedicadas para não conflitar com outros projetos nem com a stack de integração:

- PostgreSQL dev: `localhost:55432`
- Redis dev: `localhost:56379`
- MinIO dev: `localhost:59000`
- MinIO console dev: `localhost:59001`
- Meilisearch dev: `localhost:7700`

Variáveis esperadas para desenvolvimento local:

```text
DATABASE_URL=postgresql://fiscalzen:fiscalzen@localhost:55432/fiscalzen
REDIS_URL=redis://localhost:56379
S3_ENDPOINT=http://localhost:59000
MEILISEARCH_URL=http://localhost:7700
MEILISEARCH_API_KEY=fiscalzen_meilisearch_dev_key
DISABLE_AUTH=false
DEV_TENANT_ID=00000000-0000-0000-0000-000000000000
DEV_USER_ID=00000000-0000-0000-0000-000000000001
```

Não usar `DATABASE_URL_TEST` no `turbo run dev`; a stack de integração é separada e usa `localhost:55434` para PostgreSQL e `localhost:56380` para Redis.

## Bootstrap dev sem SQL manual

Fluxo recomendado para preparar banco local de desenvolvimento:

```powershell
pnpm docker:up
pnpm db:push
pnpm seed:dev
pnpm dev
```

`pnpm seed:dev` é idempotente e cria/atualiza apenas o tenant local `FiscalZen Demo` com ID `00000000-0000-0000-0000-000000000000`, usado pelo `DISABLE_AUTH` em desenvolvimento. O comando recusa banco de teste, host não local e nomes com aparência de produção. Ele não apaga dados existentes.

## Documentação e observabilidade opcionais

- Swagger é compatível com Fastify 4 e fica desligado por padrão. Para expor a documentação local, defina `ENABLE_SWAGGER=true` e acesse `http://localhost:3001/documentation`.
- OpenTelemetry fica desligado por padrão. Para habilitar tracing, defina `ENABLE_TRACING=true`; se usar Jaeger HTTP, configure `JAEGER_ENDPOINT=http://localhost:14268/api/traces`.
- Falha no registro de Swagger ou inicialização de tracing não deve impedir o startup da API; o log deve registrar aviso claro e a API deve continuar sem expor segredos.
- Meilisearch dev usa `MEILI_MASTER_KEY=fiscalzen_meilisearch_dev_key` no container e a API deve usar `MEILISEARCH_API_KEY=fiscalzen_meilisearch_dev_key` para criar/verificar o índice `documents`. Se Meilisearch estiver indisponível ou com chave divergente, a API deve subir com busca degradada e warning claro.

## Build obrigatório antes da demo

```powershell
pnpm --filter @fiscalzen/database build
pnpm --filter @fiscalzen/api build
pnpm --filter @fiscalzen/api test:run tests/api-contract.test.ts
pnpm --filter @fiscalzen/api test:run tests/manifestacao.schemas.test.ts
pnpm --filter @fiscalzen/api test:run tests/pdf.helpers.test.ts
pnpm --filter @fiscalzen/web build
```

## Infraestrutura de testes e smoke check

Quando for validar o ambiente antes da demo com cobertura de integração:

```powershell
pnpm test:integration:up
pnpm db:push:test
pnpm --filter @fiscalzen/api test:integration
```

Observação:

- esse fluxo usa apenas banco/Redis de teste e nunca deve apontar para o banco de desenvolvimento.
- o padrão local de integração é `DATABASE_URL_TEST=postgresql://fiscalzen_test:fiscalzen_test@localhost:55434/fiscalzen_test` e `REDIS_URL=redis://localhost:56380`.
- após `pnpm test:integration:down`, é esperado repetir `pnpm db:push:test`, porque a stack de teste sobe limpa.
- `pnpm test:integration:up` agora é amigável quando a própria stack de teste já está saudável: ele retorna sucesso e informa que a stack já está pronta.
- se `55434` ou `56380` estiver ocupada por serviço externo ou container inesperado, `pnpm test:integration:up` continua falhando com erro claro.
- estado validado nesta rodada: `pnpm test:integration:down`, `pnpm test:integration:up`, `pnpm test:integration:up` novamente, `pnpm db:push:test` e `pnpm --filter @fiscalzen/api test:integration` verdes.
- revalidacao final com Docker ativo: `pnpm test:integration:up`, `pnpm db:push:test` e suite de integração da API verdes (`10` arquivos / `44` testes).
- smoke atual de schema/API: API Fastify sobe em `localhost:3001` com validação e serialização padrão ativas, sem `FST_ERR_SCH_SERIALIZATION_BUILD`; `/health` responde 200.
- teste de regressão recomendado no fechamento: `pnpm --filter @fiscalzen/api test:run tests/api-contract.test.ts tests/api-schema-compilation.test.ts`.

## Execução recomendada

API:

```powershell
pnpm --filter @fiscalzen/api dev
```

Web:

```powershell
pnpm --filter @fiscalzen/web dev
```

Worker de downloads em lote:

- garantir que o processo que executa `apps/api/src/jobs/batch-download.worker.ts` esteja ativo no ambiente

Outros workers relevantes:

- sync/NSU conforme a configuração atual do ambiente
- alertas de certificado, se a demo depender disso

## Fluxos manuais para validar

1. Criar ou editar empresa.
2. Fazer upload de certificado A1.
3. Abrir a tela da empresa e confirmar status NSU, ausência de certificado ou expiração.
4. Listar documentos em `/documentos` com filtros e paginação.
5. Abrir detalhe de documento.
6. Baixar XML individual.
7. Gerar PDF operacional de NFe ou CTe suportado.
8. Conferir anexos fiscais no detalhe do documento.
9. Criar pacote ZIP em lote.
10. Acompanhar o job em `/downloads`.
11. Baixar ZIP pela rota autenticada.
12. Confirmar eventos na timeline do documento.
13. Manifestar um documento elegível.
14. Confirmar manifestação na timeline.

## Limitações conhecidas

- Integração SEFAZ depende de ambiente fiscal real, certificado válido e cenário compatível.
- O PDF atual é operacional, baseado no XML armazenado e no parser/layout existente. Não tratar como DANFE/DACTE juridicamente validado em todos os cenários.
- No ambiente local atual, a suíte de integração depende de um PostgreSQL de teste funcional em `localhost:55434/fiscalzen_test`; após reset limpo da stack, reaplique o schema com `pnpm db:push:test` antes de rodar a suíte.
- O módulo legado `apps/api/src/modules/pdf/routes.ts` continua explicitamente desativado e isolado.
- Tipos fora da cobertura atual do PDF reativado, como MDF-e, continuam com erro claro de não suportado nesta rodada.
- Na execucao validada mais recente, os avisos `FSTDEP021` deixaram de aparecer na suite principal apos o ajuste das rotas legadas de `tags`; ainda vale monitorar novas rotas antes de Fastify v5.

## Riscos para demo

- Sem Redis ou worker ativo, o fluxo de ZIP em lote não conclui.
- Sem MinIO/S3 funcional, XML, PDF e ZIP falham em leitura ou entrega.
- Sem certificado válido, sync real e manifestação real ficam limitados.
- Sem Meilisearch, a busca textual pode não refletir a experiência completa do inbox.

## Critério prático de “demo pronta”

- Branch pronta para PR e demo controlada após validação integrada e builds verdes.
- Login/autenticação funcionando.
- Empresa visível e com certificado carregado.
- Documentos listados e acessíveis por tenant correto.
- XML individual baixando.
- PDF operacional de NFe/CTe baixando.
- ZIP em lote criando, aparecendo em `/downloads` e abrindo via rota autenticada.
- Timeline exibindo eventos de documento, download, PDF e manifestação.
