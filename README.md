# FiscalZen

Sistema completo para gestao de documentos fiscais eletronicos (DFe) brasileiros com monitoramento automatizado da SEFAZ, manifestacao do destinatario e integracao NFSe.

## Visao Geral

FiscalZen e uma plataforma moderna para empresas que precisam gerenciar documentos fiscais eletronicos de forma centralizada e automatizada. O sistema oferece:

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
│   ├── web/          # Frontend Next.js 14 (App Router)
│   └── api/          # Backend Fastify com BullMQ
├── packages/
│   ├── ui/           # Componentes React (shadcn/ui)
│   ├── database/     # Schema Drizzle ORM + PostgreSQL
│   ├── sefaz-client/ # Cliente SEFAZ (DistribuicaoDFe)
│   ├── xml-parser/   # Parser de XMLs fiscais
│   └── nfse-client/  # Cliente NFSe (ABRASF + RPA)
```

## Requisitos

- Node.js 20+
- pnpm 8+
- PostgreSQL 15+
- Redis 7+
- Meilisearch (opcional, para busca)

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

Copie os arquivos de exemplo e configure:

```bash
# API
cp apps/api/.env.example apps/api/.env

# Web
cp apps/web/.env.example apps/web/.env
```

#### Variaveis da API (`apps/api/.env`)

```env
# Servidor
PORT=3001
NODE_ENV=development
LOG_LEVEL=info

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/fiscalzen

# Redis
REDIS_URL=redis://localhost:6379

# Meilisearch
MEILISEARCH_HOST=http://localhost:7700
MEILISEARCH_API_KEY=your-master-key

# JWT
JWT_SECRET=sua-chave-secreta-muito-segura
JWT_EXPIRES_IN=7d

# Storage (S3 compativel)
STORAGE_ENDPOINT=http://localhost:9000
STORAGE_ACCESS_KEY=minioadmin
STORAGE_SECRET_KEY=minioadmin
STORAGE_BUCKET=fiscalzen
```

#### Variaveis do Web (`apps/web/.env`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 4. Configure o banco de dados

```bash
# Gere as migrations
pnpm --filter @fiscalzen/database db:generate

# Execute as migrations
pnpm --filter @fiscalzen/database db:migrate
```

### 5. Inicie os servicos

```bash
# Desenvolvimento (todos os apps)
pnpm dev

# Ou individualmente
pnpm --filter @fiscalzen/api dev
pnpm --filter @fiscalzen/web dev
```

## Uso

### Acessando a Aplicacao

Apos iniciar os servicos:

- **Frontend**: http://localhost:3000
- **API**: http://localhost:3001
- **Documentacao API**: http://localhost:3001/docs (se habilitado)

### Primeiros Passos

#### 1. Criar uma Conta

Acesse a pagina de registro e crie sua conta. Cada conta e um tenant isolado que pode gerenciar multiplas empresas.

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

#### Visualizando Documentos

A pagina de **Documentos** exibe todos os documentos fiscais:

- Filtros por tipo (NFe, CTe, MDFe), empresa, periodo e status
- Busca por numero, chave, emitente ou destinatario
- Ordenacao por data, valor ou numero

#### Detalhes do Documento

Clique em um documento para ver:

- Dados completos (emitente, destinatario, itens)
- Eventos (autorizacao, cancelamento, etc.)
- Manifestacoes realizadas
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

#### Realizando Manifestacao

1. Va para **Manifestacao**
2. Na aba **Pendentes**, selecione os documentos
3. Clique em **Dar Ciencia** (individual ou em lote)
4. Apos a ciencia, va para **Aguardando Final**
5. Escolha a manifestacao final (Confirmacao, Desconhecimento ou Nao Realizada)

### Configuracao NFSe

Para monitorar NFSe (Notas Fiscais de Servico), configure os municipios:

#### Adicionando um Municipio

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
| **ABRASF** | Web Service padronizado | Sao Paulo, Rio, BH, Curitiba, etc. |
| **RPA** | Automacao de navegador | Manaus, Belem, Teresina, etc. |

Para municipios com RPA, e necessario informar login e senha do portal de NFSe.

### Dashboard

O dashboard apresenta:

- **Resumo**: Total de documentos, valores, pendencias
- **Grafico de Timeline**: Documentos por periodo
- **Status de Integridade**: Gaps na sequencia de NSU
- **Documentos Recentes**: Ultimas notas recebidas
- **Alertas**: Certificados vencendo, erros de sync

### Jobs e Filas

O sistema utiliza filas para processamento em background:

| Fila | Funcao |
|------|--------|
| `sefaz-monitor` | Consulta periodica a SEFAZ |
| `xml-processor` | Parsing e armazenamento de XMLs |
| `search-sync` | Indexacao no Meilisearch |
| `nfse-monitor` | Consulta de NFSe |

Para monitorar as filas, va para **Configuracoes** > **Jobs**.

## API

### Autenticacao

Todas as requisicoes (exceto login/registro) requerem o header:

```
Authorization: Bearer <token>
```

### Endpoints Principais

#### Empresas

```
GET    /api/v1/companies          # Listar empresas
POST   /api/v1/companies          # Criar empresa
GET    /api/v1/companies/:id      # Detalhes da empresa
PUT    /api/v1/companies/:id      # Atualizar empresa
DELETE /api/v1/companies/:id      # Excluir empresa
POST   /api/v1/companies/:id/certificate  # Upload certificado
```

#### Documentos

```
GET    /api/v1/documents          # Listar documentos
GET    /api/v1/documents/:id      # Detalhes do documento
GET    /api/v1/documents/:id/xml  # Download XML
GET    /api/v1/documents/:id/events  # Eventos do documento
```

#### Manifestacao

```
GET    /api/v1/manifestacao/pending      # Pendentes de ciencia
GET    /api/v1/manifestacao/awaiting     # Aguardando final
POST   /api/v1/manifestacao/ciencia      # Registrar ciencia
POST   /api/v1/manifestacao/confirmar    # Confirmar operacao
POST   /api/v1/manifestacao/desconhecer  # Desconhecer operacao
```

#### NFSe

```
GET    /api/v1/nfse/municipios           # Municipios suportados
GET    /api/v1/companies/:id/nfse        # Configs da empresa
POST   /api/v1/companies/:id/nfse        # Adicionar municipio
PATCH  /api/v1/companies/:id/nfse/:cod   # Atualizar config
DELETE /api/v1/companies/:id/nfse/:cod   # Remover config
POST   /api/v1/companies/:id/nfse/:cod/sync  # Sincronizar
```

#### Dashboard

```
GET    /api/v1/dashboard/summary     # Resumo geral
GET    /api/v1/dashboard/timeline    # Dados do grafico
GET    /api/v1/dashboard/integrity   # Status de integridade
```

## Desenvolvimento

### Scripts Disponiveis

```bash
# Desenvolvimento
pnpm dev              # Inicia todos os apps
pnpm dev:api          # Inicia apenas a API
pnpm dev:web          # Inicia apenas o frontend

# Build
pnpm build            # Build de todos os pacotes
pnpm build:api        # Build apenas da API
pnpm build:web        # Build apenas do frontend

# Testes
pnpm test             # Executa todos os testes
pnpm test:watch       # Testes em modo watch

# Linting
pnpm lint             # ESLint em todos os pacotes
pnpm lint:fix         # Corrige problemas automaticamente

# Type checking
pnpm typecheck        # Verifica tipos em todos os pacotes

# Database
pnpm db:generate      # Gera migrations
pnpm db:migrate       # Executa migrations
pnpm db:studio        # Abre Drizzle Studio
```

### Estrutura de Pacotes

#### @fiscalzen/ui

Componentes React baseados em shadcn/ui:

```tsx
import { Button, Card, Input, Dialog } from '@fiscalzen/ui';
```

#### @fiscalzen/database

Schema e cliente Drizzle:

```typescript
import { db } from '@fiscalzen/database';
import { companies, documents } from '@fiscalzen/database/schema';
```

#### @fiscalzen/sefaz-client

Cliente para comunicacao com SEFAZ:

```typescript
import { SefazClient } from '@fiscalzen/sefaz-client';

const client = new SefazClient(certificado, 'SP');
const result = await client.distribuicaoDFe({ ultNSU: '0' });
```

#### @fiscalzen/xml-parser

Parser de XMLs fiscais:

```typescript
import { parseNFe, parseCTe, parseMDFe } from '@fiscalzen/xml-parser';

const nfe = parseNFe(xmlContent);
console.log(nfe.chave, nfe.emitente, nfe.destinatario);
```

#### @fiscalzen/nfse-client

Cliente NFSe com suporte a ABRASF e RPA:

```typescript
import { getAbrasfClient, getMunicipioConfig } from '@fiscalzen/nfse-client';

const client = getAbrasfClient('3550308', certificado, 'producao');
const nfses = await client.consultarNfseServicoTomado({ cnpjTomador: '...' });
```

### Adicionando Novos Municipios NFSe

Para adicionar suporte a um novo municipio:

1. **ABRASF**: Adicione a configuracao em `packages/nfse-client/src/registry.ts`
2. **RPA**: Crie um scraper em `packages/nfse-client/src/rpa/municipios/`

Exemplo de configuracao ABRASF:

```typescript
'1234567': {
  codigo: '1234567',
  nome: 'Nome do Municipio',
  uf: 'UF',
  tipo: 'abrasf',
  versaoAbrasf: '2.04',
  endpoints: {
    producao: 'https://...',
    homologacao: 'https://...',
  },
},
```

## Deploy

### Docker

```bash
# Build das imagens
docker-compose build

# Iniciar servicos
docker-compose up -d
```

### Variaveis de Producao

Em producao, configure:

```env
NODE_ENV=production
JWT_SECRET=<chave-forte-256-bits>
DATABASE_URL=<url-producao>
REDIS_URL=<url-redis-producao>
```

### Recomendacoes

- Use HTTPS em todos os endpoints
- Configure rate limiting no load balancer
- Habilite backups automaticos do PostgreSQL
- Monitore as filas do BullMQ
- Configure alertas para erros de certificado

## Suporte

### Documentacao Fiscal

- [Manual NFe](https://www.nfe.fazenda.gov.br/)
- [Manual CTe](https://www.cte.fazenda.gov.br/)
- [Padrao ABRASF NFSe](http://www.abrasf.org.br/)

### Problemas Comuns

#### Erro de certificado

- Verifique se o certificado e do tipo A1 (arquivo .pfx)
- Confirme que a senha esta correta
- Verifique a validade do certificado

#### Documentos nao sincronizam

- Confirme que a empresa esta ativa
- Verifique o status do certificado
- Consulte os logs de erro na fila

#### NFSe RPA falha

- Confirme as credenciais do portal
- Verifique se o portal esta acessivel
- Alguns portais podem ter captcha

## Licenca

MIT License - veja [LICENSE](LICENSE) para detalhes.

## Contribuindo

1. Fork o repositorio
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudancas (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

---

Desenvolvido com Claude Code
