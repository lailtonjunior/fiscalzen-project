# Glossário e Conceitos de Domínio

Este documento serve como referência para os termos técnicos e de negócio utilizados no FiscalZen. O projeto lida com a complexidade do ecossistema fiscal brasileiro, integrando-se com diversas esferas governamentais (Federal, Estadual e Municipal).

## Documentos Fiscais Eletrônicos (DF-e)

### NFe (Nota Fiscal Eletrônica)
Documento digital que substitui as notas fiscais modelo 1 e 1-A. Utilizada para registrar operações de circulação de mercadorias.
- **Modelo:** 55.
- **Identificação:** Chave de acesso de 44 dígitos.
- **Ator FiscalZen:** O sistema atua como **Destinatário** (monitorando notas emitidas contra o cliente).

### NFSe (Nota Fiscal de Serviços Eletrônica)
Documento municipal para registro de prestação de serviços.
- **Padrão:** Variável por município. O FiscalZen foca no padrão **ABRASF** (v1 e v2) e via **RPA** para prefeituras sem webservices padronizados.
- **Integração:** Realizada via `AbrasfClient` ou `TemplateScraper`.

### CTe (Conhecimento de Transporte Eletrônico)
Documento para serviços de transporte de carga (rodoviário, aéreo, etc.).
- **Modelo:** 57.

### MDFe (Manifesto Eletrônico de Documentos Fiscais)
Documento que agrupa outros documentos fiscais (NFe, CTe) em uma unidade de transporte.
- **Modelo:** 58.

---

## Ecossistema SEFAZ

### SEFAZ (Secretaria da Fazenda)
Órgão estadual responsável pela arrecadação e fiscalização de tributos estaduais (como ICMS). No FiscalZen, o `SefazClient` gerencia a comunicação com esses órgãos.

### Ambiente (tpAmb)
Identifica se a operação é real ou teste.
- **Produção (1):** Documentos com validade jurídica.
- **Homologação (2):** Apenas para testes de integração.

### DistDFe (Distribuição de Documentos Fiscais)
Serviço da SEFAZ que permite ao destinatário "baixar" os documentos emitidos contra seu CNPJ.
- **GZIP:** Os XMLs retornados pela SEFAZ vêm compactados em Base64/GZIP. O utilitário `decodeDocZip` é responsável por esta descompactação.

### NSU (Número Sequencial Único)
Contador sequencial gerenciado pela SEFAZ para cada CNPJ.
- **Controle:** O FiscalZen utiliza a tabela `nsu_control` para armazenar o `last_nsu` de cada empresa, garantindo que a sincronização seja incremental e não pule documentos.

---

## Certificação Digital

### Certificado A1
Arquivo digital (formato `.pfx` ou `.p12`) que contém a identidade da empresa.
- **Uso:** Necessário para autenticação mTLS (Mutual TLS) com os servidores da SEFAZ e para assinatura digital de eventos.
- **FiscalZen:** Gerenciado via `loadCertificado` e cacheado em memória para otimizar a performance de conexões SOAP.

### Cadeia de Certificação
Conjunto de certificados de autoridades certificadoras (AC) que validam o certificado da empresa. O sistema deve confiar nas cadeias da ICP-Brasil.

---

## Eventos e Manifestação

### Manifestação do Destinatário
Processo onde o comprador informa à SEFAZ sua participação na operação. Os principais eventos são:
- **Ciência da Operação (210210):** Declara ter conhecimento da nota, mas ainda não confirma a operação. Libera o download do XML completo.
- **Confirmação da Operação (210200):** Confirma que a mercadoria foi recebida.
- **Desconhecimento da Operação (210220):** Utilizado em casos de fraude ou uso indevido do CNPJ.

### Protocolo
Recibo retornado pela SEFAZ (XML `retConsStatServ` ou `retEnviNFe`) comprovando que uma solicitação foi processada.

---

## Conceitos Técnicos do Sistema

### Tenant (Inquilino)
Representa uma conta principal no sistema (ex: um escritório de contabilidade). Possui isolamento de dados total.

### Company (Empresa)
Uma entidade jurídica (CNPJ) cadastrada sob um Tenant. É a unidade que possui certificados e documentos fiscais vinculados.

### Monitoramento (Jobs)
Processos em background que executam tarefas recorrentes:
- **SefazMonitorJob:** Consulta o DistDFe periodicamente.
- **XmlProcessorJob:** Analisa o conteúdo do XML, extrai valores, impostos e itens.
- **SearchSyncJob:** Sincroniza os dados do banco de dados com o motor de busca (Meilisearch).

### Chave de Acesso
String de 44 caracteres que identifica univocamente um documento fiscal no Brasil.
- **Composição:** UF + AAMM + CNPJ + Modelo + Série + Número + Tipo Emissão + Código Numérico + DV.
- **Validação:** Realizada via `isValidChaveAcesso` no pacote de utilitários.

---

## Siglas Comuns

| Sigla | Significado | Descrição |
|:--- |:--- |:--- |
| **ABRASF** | Assoc. Bras. das Secretarias de Finanças | Órgão que padroniza os XMLs de NFSe. |
| **DANFE** | Doc. Auxiliar da NFe | Representação gráfica (PDF) da nota fiscal. |
| **DFe** | Documento Fiscal Eletrônico | Termo genérico para NFe, CTe, MDFe, etc. |
| **mTLS** | Mutual TLS | Protocolo de segurança que exige certificado de ambos os lados (Cliente e Servidor). |
| **RPA** | Robotic Process Automation | Automação de navegadores para extrair dados onde não há API disponível. |
| **UF** | Unidade da Federação | Estado brasileiro (SP, RJ, MG, etc.). |
