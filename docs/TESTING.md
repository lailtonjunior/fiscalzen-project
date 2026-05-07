# Testing Guide

## Objetivo

Guia operacional para executar os testes do FiscalZen MVP v1 com segurança, especialmente evitando uso acidental do banco de desenvolvimento nos testes de integração.

## Tipos de teste

## Stack Docker de desenvolvimento

`pnpm docker:up` sobe a stack de desenvolvimento definida em `docker/docker-compose.yml`.

Portas publicadas no host para desenvolvimento local:

- PostgreSQL dev: `localhost:55432` -> container `5432`
- Redis dev: `localhost:56379` -> container `6379`
- MinIO dev: `localhost:59000` -> container `9000`
- MinIO console dev: `localhost:59001` -> container `9001`
- Meilisearch dev: `localhost:7700` -> container `7700`

Variáveis locais esperadas para desenvolvimento:

```text
DATABASE_URL=postgresql://fiscalzen:fiscalzen@localhost:55432/fiscalzen
REDIS_URL=redis://localhost:56379
S3_ENDPOINT=http://localhost:59000
MEILISEARCH_URL=http://localhost:7700
MEILISEARCH_API_KEY=fiscalzen_meilisearch_dev_key
```

Essa stack é separada da stack de integração. Não use `DATABASE_URL_TEST` no `turbo run dev` e não aponte o desenvolvimento local para o banco `fiscalzen_test`.

### Bootstrap do banco dev

Depois de subir a stack dev, prepare o schema e o tenant mínimo de desenvolvimento:

```powershell
pnpm docker:up
pnpm db:push
pnpm seed:dev
```

`pnpm seed:dev` cria de forma idempotente o tenant `FiscalZen Demo` com ID `00000000-0000-0000-0000-000000000000`, que é o padrão usado por `DISABLE_AUTH=true`. O seed dev não usa `DATABASE_URL_TEST`, não apaga dados e recusa execução contra banco de teste ou alvo com aparência de produção.

Também existe o atalho:

```powershell
pnpm dev:bootstrap
```

### Swagger e tracing no desenvolvimento

Por padrão, a API sobe com Swagger e OpenTelemetry desligados:

```text
ENABLE_SWAGGER=false
ENABLE_TRACING=false
```

Para testar documentação local, use `ENABLE_SWAGGER=true` e acesse `http://localhost:3001/documentation`. Para testar tracing, use `ENABLE_TRACING=true` e, se houver coletor Jaeger HTTP, configure `JAEGER_ENDPOINT=http://localhost:14268/api/traces`.

Essas flags não alteram a stack de integração nem devem apontar para banco de teste.

### Meilisearch dev

O container dev define `MEILI_MASTER_KEY=fiscalzen_meilisearch_dev_key`; a API local deve usar a mesma chave em `MEILISEARCH_API_KEY` para criar e configurar o índice `documents`.

Se `MEILISEARCH_URL`/`MEILISEARCH_HOST` apontar para serviço indisponível ou a chave divergir, a API deve continuar subindo e registrar warning de busca degradada. Health da API pode reportar `search: error` nesse cenário.

### Testes leves

Executam sem infraestrutura completa de integração e cobrem build, contrato e helpers puros.

Comandos usados com frequência:

```powershell
pnpm --filter @fiscalzen/database build
pnpm --filter @fiscalzen/api build
pnpm --filter @fiscalzen/api test:run tests/api-contract.test.ts
pnpm --filter @fiscalzen/api test:run tests/documents.public-document.test.ts tests/downloads.public-result.test.ts tests/pdf.helpers.test.ts tests/manifestacao.schemas.test.ts
pnpm --filter @fiscalzen/web build
```

### Testes de integração

Executam com `vitest.integration.config.ts` e usam banco PostgreSQL real de teste.

Comando principal:

```powershell
pnpm --filter @fiscalzen/api test:integration
```

Estado validado em 2026-05-06 com Docker ativo:

- `pnpm test:integration:up` verde;
- `pnpm test:integration:up` novamente verde, retornando `Integration test stack is already running and healthy.`;
- `pnpm db:push:test` verde;
- `pnpm --filter @fiscalzen/api test:integration` verde (`10` arquivos / `44` testes).
- Quando a propria stack esperada (`fiscalzen-postgres-test` + `fiscalzen-redis-test`) ja estiver ativa e saudável, `pnpm test:integration:up` deve sair com sucesso e apenas informar que a stack já está pronta.
- Se a porta `55434` ou `56380` estiver ocupada por processo externo ou container inesperado/não saudável, o comando falha com mensagem clara apontando conflito externo ou container stale.
- A stack de integração é separada da stack dev: `pnpm test:integration:up` usa PostgreSQL em `55434` e Redis em `56380`, enquanto `pnpm docker:up` usa PostgreSQL em `55432` e Redis em `56379`.

## Banco de teste seguro

O fluxo de integração usa:

- `DATABASE_URL_TEST`, ou
- `TEST_DATABASE_URL`

Se nenhuma delas estiver configurada, o projeto usa o fallback seguro:

```text
postgresql://fiscalzen_test:fiscalzen_test@localhost:55434/fiscalzen_test
```

Proteções ativas:

- helpers de integração recusam URLs que não sejam `localhost`/`127.0.0.1` na porta `55434` com nome de banco marcado como teste;
- `pnpm db:push:test` recusa empurrar schema para qualquer URL fora desse padrão;
- o setup de integração não herda mais `DATABASE_URL` de desenvolvimento.

## Arquivos de ambiente

Base recomendada:

- copie `.env.test.example` para `.env.test`

Variáveis principais:

- `DATABASE_URL_TEST`
- `REDIS_URL`
- `JWT_SECRET`
- `CERT_ENCRYPTION_KEY`

Padrão atual do ambiente local de integração:

- PostgreSQL: `localhost:55434`
- database: `fiscalzen_test`
- user: `fiscalzen_test`
- password: `fiscalzen_test`
- Redis: `localhost:56380`

## Subindo serviços para integração

Serviços mínimos esperados no fluxo atual:

- PostgreSQL de teste
- Redis de teste

Subir stack de teste:

```powershell
pnpm test:integration:up
```

Comportamento esperado:

- primeira execução: sobe/reconcilia a stack e espera healthcheck;
- segunda execução com a mesma stack saudável: retorna sucesso sem recriar containers;
- porta ocupada por serviço externo: falha explicitamente para evitar falso positivo.

Derrubar stack de teste:

```powershell
pnpm test:integration:down
```

## Preparando schema do banco de teste

Comando seguro:

```powershell
pnpm db:push:test
```

Esse comando:

- usa `drizzle-test.config.ts`;
- usa apenas `DATABASE_URL_TEST`/`TEST_DATABASE_URL`;
- usa fallback seguro para `localhost:55434/fiscalzen_test`;
- recusa rodar fora de `localhost:55434` com banco marcado como teste.
- executa `drizzle-kit push --force` apenas no banco de teste já validado, evitando prompt interativo no fluxo local/CI.

## Ordem recomendada para rodar integração

1. `Copy-Item .env.test.example .env.test` e ajuste se necessário.
2. `pnpm test:integration:up`
3. `pnpm test:integration:up` novamente para smoke de idempotencia opcional
4. `pnpm db:push:test`
5. `pnpm --filter @fiscalzen/api test:integration`

Observação:

- após `pnpm test:integration:down`, um `pnpm test:integration:up` limpo recria containers vazios; por isso `pnpm db:push:test` continua sendo obrigatório antes da suíte.
- para a validacao final local desta rodada, o fluxo confirmado foi `pnpm test:integration:down -> pnpm test:integration:up -> pnpm test:integration:up -> pnpm db:push:test -> pnpm --filter @fiscalzen/api test:integration`.
- revalidacao final com Docker ativo confirmou `pnpm test:integration:up`, `pnpm db:push:test` e `pnpm --filter @fiscalzen/api test:integration` verdes.

## Reset limpo do ambiente de teste

O compose de integração usa `tmpfs` para Postgres e Redis, então não há volume persistente de teste para preservar ou apagar separadamente. Um reset limpo não toca no ambiente de desenvolvimento:

```powershell
pnpm test:integration:down
docker rm -f fiscalzen-postgres-test fiscalzen-redis-test 2>$null
pnpm test:integration:up
pnpm db:push:test
```

Se `pnpm test:integration:up` falhar por porta ocupada, libere apenas as portas da stack de teste (`55434` para Postgres e `56380` para Redis) ou escolha outro valor dedicado em `.env.test` e no compose de teste.

## Dependências externas

### Obrigatórias no estado atual

- PostgreSQL de teste

### Recomendadas / potencialmente necessárias dependendo da suíte

- Redis de teste

### Não exigidas para o caminho mínimo atual

- SEFAZ real
- certificado fiscal real

### Podem exigir configuração adicional se a cobertura crescer

- MinIO/S3
- Meilisearch

## Falhas conhecidas e interpretação

### `Could not connect to the integration test database`

Significa que:

- PostgreSQL de teste não está no ar, ou
- credenciais/URL de teste estão erradas.

Próximo passo:

- subir `docker/docker-compose.test.yml`, ou
- corrigir `DATABASE_URL_TEST`.

### `Integration test database schema not initialized`

Significa que o banco de teste respondeu, mas o schema ainda não foi aplicado.

Próximo passo:

- rodar `pnpm db:push:test`

### `Integration test environment is not ready`

Mensagem agregada do `global-setup`.

No ambiente atual esperado, o alvo correto é `localhost:55434/fiscalzen_test`. Se houver falha, ela deve vir do container de teste ou do schema, não de um Postgres externo em porta conflitada.

### Suite de integração ainda falha depois do setup

No estado atual validado, a suíte de integração principal está verde. Se ela voltar a falhar depois do setup, revisar primeiro:

- mudanças de schema de resposta que façam o Fastify serializar objetos como `{}`;
- drift entre fixtures e schema atual;
- endpoints binários registrados com schema de resposta inválido;
- dependências externas adicionais que algum teste novo passe a exigir.

## Segurança operacional

- Nunca use `DATABASE_URL` de desenvolvimento para integração.
- Não rode `cleanupDatabase` fora do ambiente de teste.
- Se a URL não tiver marcador claro de teste, os helpers agora falham por segurança.
