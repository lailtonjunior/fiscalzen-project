---
status: filled
generated: 2026-01-18
---

# Glossary & Domain Concepts

Termos específicos do domínio fiscal brasileiro e conceitos técnicos do FiscalZen.

## Documentos Fiscais Eletrônicos

### NFe - Nota Fiscal Eletrônica
Documento fiscal digital que substitui a nota fiscal em papel para operações de circulação de mercadorias (ICMS) e prestação de serviços de transporte interestadual/intermunicipal (ICMS).

- **Modelo**: 55
- **Chave de acesso**: 44 dígitos
- **Emissor**: Empresas de comércio e indústria
- **Validação**: SEFAZ estadual

### NFCe - Nota Fiscal de Consumidor Eletrônica
Versão simplificada da NFe para vendas ao consumidor final (varejo).

- **Modelo**: 65
- **Uso**: PDV, varejo
- **Diferença**: Não exige destinatário identificado

### CTe - Conhecimento de Transporte Eletrônico
Documento fiscal para prestação de serviços de transporte de cargas.

- **Modelo**: 57
- **Emissor**: Transportadoras
- **Tipos**: Rodoviário, Aéreo, Aquaviário, Ferroviário, Dutoviário

### MDFe - Manifesto Eletrônico de Documentos Fiscais
Documento que vincula documentos fiscais transportados em um mesmo veículo.

- **Modelo**: 58
- **Obrigatório**: Para transporte de carga fracionada
- **Conteúdo**: Lista de NFe/CTe vinculados

### NFSe - Nota Fiscal de Serviços Eletrônica
Documento fiscal municipal para prestação de serviços (ISS).

- **Emissor**: Prestadores de serviço
- **Validação**: Prefeitura municipal
- **Padrão**: ABRASF (maioria dos municípios)

## Conceitos SEFAZ

### SEFAZ - Secretaria da Fazenda
Órgão estadual responsável pela administração tributária. Cada estado possui sua SEFAZ.

### DistDFe - Distribuição de Documentos Fiscais Eletrônicos
Serviço web da SEFAZ que permite consultar documentos fiscais emitidos contra um CNPJ (como destinatário).

- **Endpoint**: AN (Ambiente Nacional)
- **Retorno**: XMLs compactados em GZIP
- **Paginação**: Por NSU (Número Sequencial Único)

### NSU - Número Sequencial Único
Identificador sequencial único para cada documento/evento retornado pelo DistDFe.

- **Formato**: 15 dígitos (ex: `000000000000001`)
- **Uso**: Controle de sincronização incremental
- **Regra**: Consultar sempre a partir do último NSU processado

### Manifestação do Destinatário
Evento obrigatório onde o destinatário de uma NFe confirma ou rejeita a operação.

| Código | Tipo | Descrição |
|--------|------|-----------|
| 210200 | Confirmação da Operação | Confirma recebimento e aceite da mercadoria |
| 210210 | Ciência da Operação | Indica conhecimento da NFe (não confirma recebimento) |
| 210220 | Desconhecimento da Operação | Declara desconhecer a operação |
| 210240 | Operação Não Realizada | Indica que a operação não foi realizada |

### Ambiente
Contexto de execução dos serviços SEFAZ.

- **Produção** (tpAmb=1): Ambiente real, documentos válidos
- **Homologação** (tpAmb=2): Ambiente de testes, documentos sem valor fiscal

## Conceitos de Negócio

### Chave de Acesso
Identificador único de 44 dígitos que identifica um documento fiscal.

**Estrutura**:
```
[UF][AAMM][CNPJ][MOD][SER][NUM][TEMIS][CDNF][CDV]
 2    4     14    2    3    9     1     8     1   = 44 dígitos
```

- **UF**: Código do estado (ex: 35 = SP)
- **AAMM**: Ano e mês de emissão
- **CNPJ**: CNPJ do emitente
- **MOD**: Modelo do documento (55, 57, 58)
- **SER**: Série do documento
- **NUM**: Número do documento
- **TEMIS**: Tipo de emissão
- **CDNF**: Código numérico aleatório
- **CDV**: Dígito verificador

### Situação do Documento
Estado atual de um documento fiscal.

| Status | Descrição |
|--------|-----------|
| `autorizada` | Documento autorizado e válido |
| `cancelada` | Documento cancelado |
| `denegada` | Autorização negada pela SEFAZ |
| `inutilizada` | Numeração inutilizada |
| `pendente` | Aguardando processamento |

### Certificado A1
Certificado digital em arquivo (PFX/P12) usado para assinar documentos fiscais.

- **Validade**: 1 ano
- **Armazenamento**: Arquivo protegido por senha
- **Uso**: Assinatura XML, autenticação mTLS com SEFAZ

## Termos Técnicos

### ABRASF
Associação Brasileira das Secretarias de Finanças das Capitais. Define o padrão técnico para NFSe.

- **Versões**: 1.0, 2.02, 2.03, 2.04
- **Adoção**: Maioria das capitais e grandes cidades

### RPA - Robotic Process Automation
Automação de processos via interface web. Usado para municípios sem webservice ABRASF.

### Multi-tenant
Arquitetura onde uma única instância serve múltiplos clientes (tenants) com dados isolados.

- **Tenant**: Organização/escritório contábil
- **Company**: Empresa dentro de um tenant

## Personas / Atores

### Contador
- **Objetivo**: Gerenciar documentos fiscais de múltiplos clientes
- **Workflow**: Monitorar recebimentos, manifestar NFe, gerar relatórios
- **Pain points**: Perder prazo de manifestação, documentos não sincronizados

### Analista Fiscal
- **Objetivo**: Reconciliar documentos com escrituração
- **Workflow**: Buscar documentos, verificar integridade, exportar XMLs
- **Pain points**: XMLs faltantes, numeração com gaps

### Gestor de TI
- **Objetivo**: Integrar FiscalZen com ERP
- **Workflow**: Configurar APIs, monitorar sincronização
- **Pain points**: Erros de certificado, timeout SEFAZ

## Regras de Negócio

### Prazo de Manifestação
- **Ciência**: Sem prazo definido (recomendado até 180 dias)
- **Confirmação/Desconhecimento/Não Realizada**: Até 180 dias após autorização

### Retenção de Documentos
- **Obrigatoriedade**: 5 anos (legislação fiscal)
- **Recomendação**: 10 anos (prescrição civil)

### Rate Limiting SEFAZ
- **DistDFe**: Máximo 20 consultas por hora por CNPJ
- **Penalidade**: Bloqueio temporário (código 656 - Consumo Indevido)

### Validação de CNPJ/CPF
- Dígitos verificadores calculados via algoritmo módulo 11
- CNPJ: 14 dígitos, CPF: 11 dígitos
