# FiscalZen

Sistema completo para gestao de documentos fiscais eletronicos (DFe) brasileiros com monitoramento automatizado da SEFAZ, manifestacao do destinatario e integracao NFSe.

## Visao Geral

FiscalZen e uma plataforma moderna para empresas que precisam gerenciar documentos fiscais eletronicos de forma centralizada e automatizada:

- **Monitoramento automatico** de NFe, CTe e MDFe via SEFAZ
- **Manifestacao do Destinatario** com ciencia e confirmacao automatizadas
- **Integracao NFSe** com suporte a ABRASF e RPA para diversos municipios
- **Dashboard analitico** com metricas em tempo real
- **Multi-tenant** com suporte a multiplas empresas por conta
- **Busca full-text** com Meilisearch

## Arquitetura

O projeto utiliza uma arquitetura de monorepo com Turborepo:

```
fiscalzen/
├── apps/
│   ├── web/            # Frontend Next.js 14 (App Router)
│   └── api/            # Backend Fastify com BullMQ
├── packages/
│   ├── ui/             # Componentes React (shadcn/ui)
│   ├── database/       # Schema Drizzle ORM + PostgreSQL
│   ├── shared/         # Tipos e utilitarios compartilhados
│   ├── sefaz-client/   # Cliente SEFAZ (DistribuicaoDFe)
│   ├── xml-parser/     # Parser de XMLs fiscais
│   └── nfse-client/    # Cliente NFSe (ABRASF + RPA)
├── docker/             # Docker Compose para servicos
├── .env.example        # Variaveis de ambiente (arquivo unico na raiz)
└── package.json        # Scripts do monorepo
```

## Requisitos

- **Node.js** 20 ou superior
- **pnpm** 9 ou superior
- **Docker** e Docker Compose (para servicos de infraestrutura)

## Instalacao

### 1. Clone o repositorio

```bash
git clone https://github.com/seu-usuario/fiscalzen.git
cd fiscalzen
```

### 2. Instale as dependencias

```bash
pnpm install
```

### 3. Configure as variaveis de ambiente

Copie o arquivo `.env.example` da raiz do projeto:

**Windows (CMD):**
```cmd
copy .env.example .env
```

**Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
```

**Linux/Mac:**
```bash
cp .env.example .env
```

Edite o arquivo `.env` conforme necessario. As principais configuracoes sao:

```env
# Database
DATABASE_URL=postgresql://fiscalzen:fiscalzen_dev@localhost:5432/fiscalzen

# Redis
REDIS_URL=redis://localhost:6379

# S3/MinIO Storage
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=fiscalzen
S3_SECRET_KEY=fiscalzen_minio_dev
S3_BUCKET=fiscalzen-docs

# Meilisearch
MEILISEARCH_HOST=http://localhost:7700
MEILISEARCH_API_KEY=fiscalzen_meilisearch_dev_key

# Clerk Authentication (obtenha em https://dashboard.clerk.com)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx

# API
API_PORT=3001
NODE_ENV=development

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# SEFAZ
SEFAZ_AMBIENTE=2  # 1=Producao, 2=Homologacao
```

### 4. Inicie os servicos de infraestrutura

O projeto inclui um Docker Compose com todos os servicos necessarios:

```bash
pnpm docker:up
```

Isso iniciara:
- **PostgreSQL** na porta 5432
- **Redis** na porta 6379
- **Meilisearch** na porta 7700
- **MinIO** nas portas 9000 (API) e 9001 (Console)

Para verificar os logs:
```bash
pnpm docker:logs
```

Para parar os servicos:
```bash
pnpm docker:down
```

### 5. Configure o banco de dados

```bash
# Gerar migrations
pnpm db:generate

# Executar migrations
pnpm db:migrate

# (Opcional) Popular com dados de teste
pnpm db:seed
```

### 6. Inicie a aplicacao

```bash
# Iniciar todos os apps em modo desenvolvimento
pnpm dev
```

Acesse:
- **Frontend**: http://localhost:3000
- **API**: http://localhost:3001
- **MinIO Console**: http://localhost:9001 (usuario: fiscalzen, senha: fiscalzen_minio_dev)
- **Meilisearch**: http://localhost:7700

## Scripts Disponiveis

### Raiz do Monorepo

| Script | Descricao |
|--------|-----------|
| `pnpm dev` | Inicia todos os apps em desenvolvimento |
| `pnpm build` | Build de todos os pacotes |
| `pnpm lint` | ESLint em todos os pacotes |
| `pnpm test` | Executa todos os testes |
| `pnpm format` | Formata codigo com Prettier |
| `pnpm format:check` | Verifica formatacao |
| `pnpm clean` | Limpa builds e node_modules |

### Database

| Script | Descricao |
|--------|-----------|
| `pnpm db:generate` | Gera migrations do Drizzle |
| `pnpm db:migrate` | Executa migrations pendentes |
| `pnpm db:push` | Sincroniza schema diretamente (dev) |
| `pnpm db:studio` | Abre Drizzle Studio (GUI) |
| `pnpm db:seed` | Popula com dados de teste |
| `pnpm db:test` | Testa conexao com banco |

### Docker

| Script | Descricao |
|--------|-----------|
| `pnpm docker:up` | Inicia servicos de infraestrutura |
| `pnpm docker:down` | Para servicos |
| `pnpm docker:logs` | Exibe logs dos containers |

## Uso da Aplicacao

### Primeiros Passos

#### 1. Criar uma Conta

Acesse http://localhost:3000 e crie sua conta via Clerk. Cada conta e um tenant isolado que pode gerenciar multiplas empresas.

#### 2. Cadastrar uma Empresa

1. Va para **Empresas** > **Nova Empresa**
2. Preencha os dados:
   - CNPJ
   - Razao Social
   - Nome Fantasia (opcional)
   - Inscricao Estadual
   - Inscricao Municipal (para NFSe)
   - UF
3. Selecione os tipos de documentos para monitorar:
   - NFe (Nota Fiscal Eletronica)
   - CTe (Conhecimento de Transporte)
   - MDFe (Manifesto de Documentos Fiscais)

#### 3. Upload do Certificado Digital

Para consultar documentos na SEFAZ, e necessario um certificado A1:

1. Na pagina da empresa, clique em **Certificado Digital**
2. Selecione o arquivo `.pfx`
3. Informe a senha do certificado
4. Clique em **Enviar**

O sistema validara o certificado e exibira a data de validade.

#### 4. Sincronizar Documentos

Apos configurar o certificado:

1. Clique em **Sincronizar** na pagina da empresa
2. O sistema consultara a SEFAZ e baixara os documentos
3. Acompanhe o progresso na secao **Status de Sincronizacao**

A sincronizacao automatica ocorre a cada hora para empresas ativas.

### Documentos

A pagina de **Documentos** exibe todos os documentos fiscais:

- Filtros por tipo (NFe, CTe, MDFe), empresa, periodo e status
- Busca por numero, chave, emitente ou destinatario
- Ordenacao por data, valor ou numero
- Download do XML original

### Manifestacao do Destinatario

A manifestacao e obrigatoria para NFe onde sua empresa e destinataria.

#### Tipos de Manifestacao

| Codigo | Tipo | Descricao |
|--------|------|-----------|
| 210200 | Confirmacao | Confirma a operacao e o recebimento da mercadoria |
| 210210 | Ciencia | Declara ciencia da operacao (obrigatorio antes da final) |
| 210220 | Desconhecimento | Declara desconhecimento da operacao |
| 210240 | Nao Realizada | Declara que a operacao nao foi realizada |

#### Fluxo de Manifestacao

1. **Pendentes de Ciencia**: Documentos novos aguardando ciencia
2. **Aguardando Manifestacao Final**: Documentos com ciencia registrada
3. **Historico**: Manifestacoes ja realizadas

### Configuracao NFSe

Para monitorar NFSe (Notas Fiscais de Servico):

1. Va para **Empresas** > selecione a empresa > **NFSe**
2. Clique em **Adicionar Municipio**
3. Busque e selecione o municipio
4. Configure os dados:
   - Inscricao Municipal
   - Credenciais do portal (se RPA)
5. Teste a conexao
6. Ative o monitoramento

#### Tipos de Integracao

| Tipo | Descricao | Municipios |
|------|-----------|------------|
| **ABRASF** | Web Service padronizado | Sao Paulo, Rio, BH, Curitiba, Porto Alegre, Brasilia, Salvador, Recife, Fortaleza, Campinas, Guarulhos, Goiania, Florianopolis, Vitoria, Natal, Joao Pessoa |
| **RPA** | Automacao de navegador | Manaus, Belem, Teresina, Sao Luis |

Para municipios com RPA, e necessario informar login e senha do portal de NFSe.

## API

### Autenticacao

Todas as requisicoes (exceto login/registro) requerem o header:

```
Authorization: Bearer <token>
```

### Endpoints Principais

#### Empresas

```
GET    /api/v1/companies              # Listar empresas
POST   /api/v1/companies              # Criar empresa
GET    /api/v1/companies/:id          # Detalhes
PUT    /api/v1/companies/:id          # Atualizar
DELETE /api/v1/companies/:id          # Excluir
POST   /api/v1/companies/:id/certificate  # Upload certificado
GET    /api/v1/companies/:id/nsu-status   # Status de sync
```

#### Documentos

```
GET    /api/v1/documents              # Listar documentos
GET    /api/v1/documents/:id          # Detalhes
GET    /api/v1/documents/:id/xml      # Download XML
GET    /api/v1/documents/:id/events   # Eventos do documento
```

#### Manifestacao

```
GET    /api/v1/manifestacao/pending   # Pendentes de ciencia
GET    /api/v1/manifestacao/awaiting  # Aguardando final
POST   /api/v1/manifestacao/ciencia   # Registrar ciencia
POST   /api/v1/manifestacao/confirmar # Confirmar operacao
```

#### NFSe

```
GET    /api/v1/nfse/municipios            # Municipios suportados
GET    /api/v1/nfse/municipios/:codigo    # Info do municipio
GET    /api/v1/companies/:id/nfse         # Configs da empresa
POST   /api/v1/companies/:id/nfse         # Adicionar municipio
PATCH  /api/v1/companies/:id/nfse/:cod    # Atualizar config
DELETE /api/v1/companies/:id/nfse/:cod    # Remover config
PATCH  /api/v1/companies/:id/nfse/:cod/toggle  # Ativar/desativar
POST   /api/v1/companies/:id/nfse/:cod/test    # Testar conexao
POST   /api/v1/companies/:id/nfse/:cod/sync    # Sincronizar
```

#### Dashboard

```
GET    /api/v1/dashboard/summary      # Resumo geral
GET    /api/v1/dashboard/timeline     # Dados do grafico
GET    /api/v1/dashboard/integrity    # Status de integridade
```

#### Jobs

```
GET    /api/v1/jobs/status            # Status das filas
POST   /api/v1/jobs/trigger/:companyId  # Disparar sync manual
```

## Estrutura de Pacotes

### @fiscalzen/ui

Componentes React baseados em shadcn/ui:

```tsx
import {
  Button, Card, Input, Dialog, Tabs,
  Badge, Alert, Progress, Checkbox
} from '@fiscalzen/ui';
```

### @fiscalzen/database

Schema e cliente Drizzle:

```typescript
import { db } from '@fiscalzen/database';
import { companies, documents, nfseConfigs } from '@fiscalzen/database/schema';
```

### @fiscalzen/sefaz-client

Cliente para comunicacao com SEFAZ:

```typescript
import { SefazClient } from '@fiscalzen/sefaz-client';

const client = new SefazClient(certificado, 'SP');
const result = await client.distribuicaoDFe({ ultNSU: '0' });
```

### @fiscalzen/xml-parser

Parser de XMLs fiscais:

```typescript
import { parseNFe, parseCTe, parseMDFe, parseNFSe } from '@fiscalzen/xml-parser';

const nfe = parseNFe(xmlContent);
console.log(nfe.chave, nfe.emitente, nfe.destinatario);
```

### @fiscalzen/nfse-client

Cliente NFSe com suporte a ABRASF e RPA:

```typescript
import {
  getAbrasfClient,
  getMunicipioConfig,
  getAllMunicipios,
  getBrowserManager
} from '@fiscalzen/nfse-client';

// Listar municipios suportados
const municipios = getAllMunicipios();

// Criar cliente ABRASF para Sao Paulo
const client = getAbrasfClient('3550308', certificado, 'producao');
const nfses = await client.consultarNfseServicoTomado({ cnpjTomador: '...' });
```

## Filas de Processamento

O sistema utiliza BullMQ para processamento em background:

| Fila | Funcao | Concorrencia |
|------|--------|--------------|
| `sefaz-monitor` | Consulta periodica a SEFAZ | 2 |
| `xml-processor` | Parsing e armazenamento de XMLs | 5 |
| `search-sync` | Indexacao no Meilisearch | 10 |
| `nfse-monitor` | Consulta de NFSe (ABRASF/RPA) | 2 |

## Solucao de Problemas

### Docker nao inicia (Windows)

- Verifique se o Docker Desktop esta rodando
- Verifique se as portas 5432, 6379, 7700, 9000, 9001 estao livres
- Execute como Administrador se necessario

### Erro de certificado

- Verifique se o certificado e do tipo A1 (arquivo `.pfx`)
- Confirme que a senha esta correta
- Verifique a validade do certificado

### Documentos nao sincronizam

- Confirme que a empresa esta ativa
- Verifique o status do certificado
- Consulte os logs da API (`pnpm --filter @fiscalzen/api dev`)

### NFSe RPA falha

- Confirme as credenciais do portal
- Verifique se o portal esta acessivel
- Alguns portais podem ter captcha ou mudancas de layout

### Erro de conexao com banco

- Verifique se o PostgreSQL esta rodando: `pnpm docker:logs`
- Teste a conexao: `pnpm db:test`
- Verifique a DATABASE_URL no `.env`

## Producao

Para deploy em producao:

1. Configure variaveis de ambiente seguras (especialmente `JWT_SECRET`)
2. Use HTTPS em todos os endpoints
3. Configure backups automaticos do PostgreSQL
4. Monitore as filas do BullMQ
5. Configure alertas para erros de certificado
6. Use `SEFAZ_AMBIENTE=1` para ambiente de producao

## Links Uteis

- [Manual NFe](https://www.nfe.fazenda.gov.br/)
- [Manual CTe](https://www.cte.fazenda.gov.br/)
- [Padrao ABRASF NFSe](http://www.abrasf.org.br/)
- [Clerk Authentication](https://clerk.com/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [BullMQ](https://docs.bullmq.io/)

## Licenca

MIT License - veja LICENSE para detalhes.

---

Desenvolvido com Claude Code
