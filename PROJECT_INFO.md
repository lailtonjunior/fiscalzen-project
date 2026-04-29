# FiscalZen — Documentação do Projeto

> **Plataforma SaaS para gestão automatizada de documentos fiscais eletrônicos brasileiros (DF-e)**

---

## 1. O que é o FiscalZen?

FiscalZen é uma plataforma distribuída, multi-tenant, construída para automatizar o **ciclo de vida completo de documentos fiscais eletrônicos** destinados a empresas brasileiras. Ela se comunica diretamente com os Web Services da SEFAZ (Secretaria da Fazenda), recebe e processa documentos fiscais, gera manifestações de destinatário, emite alertas inteligentes e os expõe via API REST e dashboard web.

O projeto é estruturado como um **monorepo Turborepo** com dois aplicativos principais (`api` e `web`) e múltiplos pacotes compartilhados.

---

## 2. Para que ele serve?

Empresas brasileiras que **recebem** documentos fiscais (NF-e, CT-e, MDF-e) de fornecedores precisam:

1. Consultar periodicamente documentos destinados ao seu CNPJ junto à SEFAZ.
2. Manifestar ciência, confirmação ou desacordo de recebimento.
3. Armazenar os XMLs e metadados de forma segura e pesquisável.
4. Monitorar eventos fiscais (cancelamentos, inutilizações, correções) em tempo real.
5. Integrar esses dados com ERPs e outros sistemas via webhooks.

O FiscalZen automatiza **todos esses passos**.

> ⚠️ O FiscalZen é um **receptor/monitor** de documentos fiscais. Ele **NÃO emite** NF-e, NFS-e, CT-e ou qualquer outro documento.

---

## 3. Documentos Fiscais Suportados

| Tipo   | Nome                              | Modelo |
|--------|-----------------------------------|--------|
| NF-e   | Nota Fiscal Eletrônica            | 55     |
| CT-e   | Conhecimento de Transporte        | 57     |
| MDF-e  | Manifesto de Documentos Fiscais   | 58     |
| NFS-e  | Nota Fiscal de Serviço Eletrônica | Municipal |

---

## 4. Stack Tecnológica

| Camada           | Tecnologia                          |
|------------------|-------------------------------------|
| **Runtime**      | Node.js 20+                         |
| **Linguagem**    | TypeScript 5.3                      |
| **Backend**      | Fastify 4                           |
| **Frontend**     | Next.js 14 (App Router)             |
| **Banco**        | PostgreSQL 16 + Drizzle ORM         |
| **Filas/Jobs**   | Redis + BullMQ                      |
| **Busca**        | Meilisearch                         |
| **Storage XML**  | MinIO / Amazon S3                   |
| **Autenticação** | JWT (via plugin Fastify)            |
| **Monorepo**     | Turborepo + pnpm workspaces         |
| **DI Container** | tsyringe                            |
| **Testes**       | Vitest + Supertest                  |

---

## 5. Estrutura do Projeto

```
fiscalzen-project/
├── apps/
│   ├── api/          # Fastify REST API + Workers (BullMQ)
│   └── web/          # Next.js 14 Dashboard (frontend)
├── packages/
│   ├── database/     # Schema Drizzle ORM (PostgreSQL)
│   ├── sefaz-client/ # Cliente SOAP SEFAZ (mTLS, certificado A1)
│   ├── nfse-client/  # Cliente NFS-e (ABRASF + RPA municipal)
│   ├── xml-parser/   # Parser XML fiscal brasileiro (NF-e, CT-e, MDF-e)
│   ├── pdf-generator/# Geração de DANFE (NF-e) e DACTE (CT-e)
│   ├── security/     # Utilitários de criptografia e certificados
│   ├── shared/       # Tipos TypeScript e schemas Zod compartilhados
│   ├── ui/           # Componentes React (shadcn/ui)
│   └── cli/          # Interface de linha de comando
├── docker/           # Docker Compose + configurações de infra
└── scripts/          # Utilitários de desenvolvimento
```

---

## 6. Módulos da API (`apps/api/src/modules`)

| Módulo          | Responsabilidade                                                    |
|-----------------|---------------------------------------------------------------------|
| `companies`     | Gestão de empresas/CNPJs e seus certificados digitais A1            |
| `documents`     | Ingestão, armazenamento e consulta de documentos fiscais (XML + S3) |
| `dashboard`     | Métricas, timeline de eventos e resumo gerencial                    |
| `manifestacao`  | Envio de manifestações do destinatário à SEFAZ (ciência/confirmação)|
| `alertas`       | Geração e listagem de alertas (expiração de cert., cancelamentos)   |
| `certificates`  | Validação e monitoramento de certificados A1 (.pfx)                 |
| `webhooks`      | Gerenciamento de endpoints de webhook e entrega por HMAC            |
| `nfse`          | Consulta e processamento de NFS-e municipais                        |
| `pdf`           | Geração de DANFE e DACTE em PDF, download em lote (ZIP)            |
| `downloads`     | Controle de downloads de XMLs e PDFs individuais e em lote          |
| `events`        | Registro e consulta de eventos fiscais (cancelamento, carta corr.)  |
| `comments`      | Comentários e menções colaborativas em documentos                   |
| `tags`          | Etiquetas para organização e filtragem de documentos                |
| `relations`     | Relacionamento entre documentos (ex.: NF-e ↔ CT-e)                 |
| `nsu`           | Controle de NSU (Número Sequencial Único) para polling SEFAZ        |
| `jobs`          | Exposição e monitoramento de jobs BullMQ via API                    |
| `agents`        | Integração com agentes de IA para análise de documentos             |

---

## 7. Funções Core

### 7.1 Sincronização com SEFAZ (DistDFe)

O coração do sistema. Um **worker periódico** consulta o serviço `NFeDistribuicaoDFe` da SEFAZ usando o certificado A1 da empresa (mTLS), buscando novos documentos a partir do último NSU registrado.

**Fluxo:**
```
Certificado A1 (.pfx)
       │
       ▼
Consulta DistDFe (SOAP/HTTPS)   ← NFeDistribuicaoDFe
  • distNSU  — buscar por último NSU
  • consNSU  — buscar por NSU específico
  • consChNFe — buscar por chave de acesso
       │
       ▼
Descomprimir (Base64 + GZIP)
       │
       ▼
Detectar tipo de documento (NF-e / CT-e / MDF-e / Resumo)
       │
       ▼
Persistir XML no S3 + metadados no PostgreSQL
       │
       ▼
Indexar no Meilisearch (busca full-text)
       │
       ▼
Atualizar NSU armazenado
```

### 7.2 Manifestação do Destinatário

Envio de eventos fiscais à SEFAZ via `NFeRecepcaoEvento` para registrar a posição do destinatário sobre um documento.

| Código | Evento                      |
|--------|-----------------------------|
| 210200 | Ciência da Operação         |
| 210210 | Confirmação da Operação     |
| 210220 | Desconhecimento da Operação |
| 210240 | Operação não Realizada      |

### 7.3 Parsing de XML Fiscal

O pacote `xml-parser` descomprime (Base64/GZIP), decodifica e estrutura os XMLs retornados pela SEFAZ para os formatos TypeScript internos utilizados por toda a plataforma.

### 7.4 Geração de PDF (DANFE / DACTE)

O pacote `pdf-generator` converte os XMLs processados em PDFs padronizados:
- **DANFE** — Documento Auxiliar da NF-e
- **DACTE** — Documento Auxiliar do CT-e

Suporta download individual e download em **lote (ZIP)**.

### 7.5 Monitoramento de Certificados

Worker diário (`CertificateChecker`) que escaneia todas as empresas ativas e gera alertas automáticos de expiração de certificado com antecedência de **30, 15, 7 e 1 dias**.

### 7.6 Webhooks com HMAC

Ao detectar novos documentos ou eventos relevantes, o sistema notifica endpoints externos cadastrados (e.g., ERPs), usando assinatura HMAC para garantir autenticidade da mensagem.

### 7.7 Busca Full-Text

Todos os documentos ingeridos são indexados no **Meilisearch**, permitindo pesquisa rápida por CNPJ emitente, chave de acesso, número da nota, valor, entre outros campos.

### 7.8 Multi-tenancy

Isolamento completo de dados por organização. Cada empresa opera em seu próprio contexto dentro do mesmo banco de dados, com autenticação JWT garantindo que usuários acessem apenas seus próprios documentos.

---

## 8. Fluxo de Dados Simplificado

```
SEFAZ ──► [sefaz-client SOAP/mTLS] ──► [xml-parser] ──► PostgreSQL
                                                    └──► S3 (XML bruto)
                                                    └──► Meilisearch
                                                    └──► BullMQ Jobs
                                                          └──► Webhooks
                                                          └──► Alertas
                                                          └──► PDF
```

---

## 9. API REST — Principais Endpoints

| Método | Endpoint                         | Descrição                          |
|--------|----------------------------------|------------------------------------|
| GET    | `/health`                        | Health check da API                |
| GET    | `/api/v1/companies`              | Listar empresas cadastradas        |
| GET    | `/api/v1/documents`              | Listar documentos fiscais          |
| GET    | `/api/v1/documents/:id/pdf`      | Download PDF (DANFE/DACTE)         |
| POST   | `/api/v1/documents/batch-download` | Download em lote (ZIP)           |
| POST   | `/api/v1/manifestacao`           | Enviar manifestação do destinatário |
| POST   | `/api/v1/manifestacao/desacordo` | Registrar desacordo de CT-e        |
| GET    | `/api/v1/alerts`                 | Listar alertas                     |
| POST   | `/api/v1/webhooks`               | Cadastrar webhooks                 |
| GET    | `/api/v1/dashboard/timeline`     | Timeline de eventos fiscais        |

---

## 10. Serviços de Infraestrutura

| Serviço       | Porta | Finalidade                         |
|---------------|-------|------------------------------------|
| API Fastify   | 3001  | Backend REST                       |
| Web Next.js   | 3000  | Dashboard frontend                 |
| PostgreSQL    | 5432  | Banco de dados principal           |
| Redis         | 6379  | Cache + fila de jobs               |
| Meilisearch   | 7700  | Busca full-text                    |
| MinIO Console | 9001  | Console de storage de objetos      |

---

## 11. Status do Projeto

**Health Score:** 🟢 **75/100**

| Área              | Status | Nota   |
|-------------------|--------|--------|
| Arquitetura       | ✅     | 9/10   |
| Testes            | ✅     | 8/10   |
| Código/Tipagem    | ⚠️     | 7/10   |
| Tech Debt         | ✅     | 8/10   |
| Documentação      | ⚠️     | 4/10   |
| Segurança         | ⚠️     | 7/10   |

### Funcionalidades implementadas ✅
- Sincronização automática com DistDFe SEFAZ
- Gestão completa de documentos (CRUD + XML + S3)
- Geração de DANFE e DACTE em PDF
- Manifestação do destinatário (ciência, confirmação, desacordo)
- Alertas de expiração de certificado
- Webhooks com HMAC
- Busca full-text via Meilisearch
- Dashboard com timeline de eventos
- Multi-tenancy com isolamento por organização
- Colaboração: tags, comentários e menções

### Pendências / Roadmap ⚠️
- Cache Redis no Dashboard (queries lentas)
- Worker Threads para parsing XML (atualmente síncrono/bloqueante)
- Índices de banco para queries de workers
- Validação LCR/OCSP de certificados revogados
- Preenchimento da documentação `.context/`
- Padronização de logging (substituir `console.log` por Pino)

---

## 12. Fora do Escopo (Anti-Scope)

- ❌ Emissão de qualquer tipo de documento fiscal
- ❌ Cálculo de impostos (ICMS, IPI, PIS, COFINS)
- ❌ Integração genérica com ERPs terceiros
- ❌ Gestão de múltiplas empresas num único certificado
- ❌ Alternância automática Produção/Homologação

---

## 13. Início Rápido

```bash
# 1. Instalar dependências
pnpm install

# 2. Subir infraestrutura
docker compose -f docker/docker-compose.yml up -d

# 3. Aplicar schema no banco
pnpm --filter @fiscalzen/database db:push

# 4. Iniciar em desenvolvimento
pnpm dev
# → API: http://localhost:3001
# → Web: http://localhost:3000
```

---

## 14. Documentação Interna

| Arquivo                             | Conteúdo                              |
|-------------------------------------|---------------------------------------|
| `CORE_LOGIC.md`                     | Lógica de negócio central             |
| `ANTI_SCOPE.md`                     | Tudo que está fora do escopo          |
| `PROJECT_STATUS.md`                 | Status atual e pendências             |
| `PROJECT_HEALTH.md`                 | Diagnóstico de saúde do projeto       |
| `CHANGELOG.md`                      | Histórico de mudanças                 |
| `.context/docs/architecture.md`     | Arquitetura detalhada do sistema      |
| `.context/docs/data-flow.md`        | Fluxo de dados                        |
| `.context/docs/security.md`         | Políticas de segurança e compliance   |
| `.context/docs/glossary.md`         | Glossário fiscal brasileiro           |

---

> **Avisos legais:** Documentos fiscais têm implicações legais. Consulte um contador antes de usar em produção. A SEFAZ pode alterar seus Web Services sem aviso prévio. Mantenha backups dos certificados A1.
