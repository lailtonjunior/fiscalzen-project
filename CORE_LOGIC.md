# CORE_LOGIC - FiscalZen

## Problema Fiscal Resolvido

O FiscalZen resolve o problema de **consultar e processar documentos fiscais eletrônicos destinados a uma empresa**.

Empresas brasileiras recebem documentos fiscais (NF-e, CT-e, MDF-e) de fornecedores e precisam:
1. Consultar documentos destinados a seu CNPJ
2. Manifestar ciência/confirmação de recebimento
3. Armazenar e processar os XMLs recebidos

## Documento Fiscal Suportado

**Foco inicial:** NF-e (Nota Fiscal Eletrônica) - Modelo 55

Extensões futuras (já com infraestrutura):
- CT-e (Conhecimento de Transporte)
- MDF-e (Manifesto de Documentos Fiscais)

## Fluxo Mínimo Funcional

```
┌─────────────────┐
│   CERTIFICADO   │  Carregar certificado A1 (.pfx)
│       A1        │  e validar conformidade
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   CONSULTAR     │  NFeDistribuicaoDFe
│    DistDFe      │  Buscar docs por ultNSU, NSU ou chave
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   PROCESSAR     │  Descomprimir GZIP + Base64
│      XML        │  Detectar tipo de documento
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   MANIFESTAR    │  NFeRecepcaoEvento
│  DESTINATÁRIO   │  210200, 210210, 210220, 210240
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    RECEBER      │  Número do protocolo
│   PROTOCOLO     │  Confirmação da SEFAZ
└─────────────────┘
```

## Serviços SEFAZ Utilizados

| Serviço | Web Service | Operação |
|---------|-------------|----------|
| Distribuição | NFeDistribuicaoDFe | distNSU, consNSU, consChNFe |
| Manifestação | NFeRecepcaoEvento | Envio de eventos tipo 21xxxx |

## Critério de Sucesso

Um desenvolvedor consegue:
1. Consultar documentos fiscais destinados ao CNPJ
2. Manifestar ciência de uma NF-e
3. Receber protocolo de confirmação da SEFAZ

Tudo isso usando **apenas a CLI** e seguindo o **README**.
