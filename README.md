# FiscalZen

**CLI para consulta e manifestação de documentos fiscais eletrônicos (SEFAZ)**

[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)]()

---

## O que este projeto faz

Permite consultar e gerenciar documentos fiscais eletrônicos (NF-e, CT-e, MDF-e) destinados a uma empresa via Web Services da SEFAZ:

- **Consulta DistDFe** - Buscar documentos fiscais destinados ao CNPJ
- **Manifestação do Destinatário** - Confirmar ciência, confirmar operação, desconhecer ou informar não realização
- **Validação de Certificado** - Verificar validade do certificado A1

## O que este projeto NÃO faz

> ⚠️ **Leia antes de usar**

- ❌ **NÃO emite NF-e, NFS-e, NFC-e, CT-e ou MDF-e**
- ❌ NÃO possui interface web ou dashboard
- ❌ NÃO calcula impostos (ICMS, IPI, etc.)
- ❌ NÃO integra com ERPs
- ❌ NÃO armazena dados em banco de dados

Para emissão de documentos fiscais, use soluções especializadas.

---

## Pré-requisitos

- Node.js 20+
- pnpm 9+
- Certificado digital A1 (.pfx) válido
- Acesso à internet para comunicação com SEFAZ

## Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/fiscalzen-project.git
cd fiscalzen-project

# Instale as dependências
pnpm install

# Build dos pacotes
pnpm build
```

## Uso da CLI

### 1. Validar Certificado

Verifique se seu certificado está válido antes de usar:

```bash
npx fiscalzen validar-cert --cert ./certificado.pfx --senha "sua-senha"
```

Saída esperada:
```
═══════════════════════════════════════════
  FiscalZen - Validação de Certificado A1
═══════════════════════════════════════════

Status: ✓ VÁLIDO
Mensagem: Certificado válido até 2027-01-15T00:00:00.000Z

─── Dados do Certificado ───────────────────

CNPJ:         12.345.678/0001-99
Razão Social: EMPRESA EXEMPLO LTDA
Válido desde: 15/01/2024, 10:30
Válido até:   15/01/2027, 10:30
Dias restantes: 730
```

### 2. Consultar Documentos (DistDFe)

Buscar documentos fiscais destinados ao seu CNPJ:

```bash
# Ambiente de homologação (testes)
npx fiscalzen consultar \
  --cert ./certificado.pfx \
  --senha "sua-senha" \
  --cnpj 12345678000199 \
  --ambiente homologacao \
  --ultNSU 0

# Consultar documento por chave de acesso
npx fiscalzen consultar \
  --cert ./certificado.pfx \
  --senha "sua-senha" \
  --cnpj 12345678000199 \
  --chave 35240112345678000199550010000001231234567890
```

**Códigos de retorno comuns:**
- `137` - Nenhum documento localizado
- `138` - Documento(s) localizado(s)
- `656` - Consumo indevido (aguarde antes de nova consulta)

### 3. Enviar Manifestação

Manifestar ciência ou confirmação de uma NF-e:

```bash
# Ciência da operação
npx fiscalzen manifestar \
  --cert ./certificado.pfx \
  --senha "sua-senha" \
  --chave 35240112345678000199550010000001231234567890 \
  --tipo ciencia \
  --ambiente homologacao

# Confirmação da operação
npx fiscalzen manifestar \
  --cert ./certificado.pfx \
  --senha "sua-senha" \
  --chave 35240112345678000199550010000001231234567890 \
  --tipo confirmacao

# Operação não realizada (requer justificativa)
npx fiscalzen manifestar \
  --cert ./certificado.pfx \
  --senha "sua-senha" \
  --chave 35240112345678000199550010000001231234567890 \
  --tipo nao-realizada \
  --justificativa "Mercadoria não foi recebida na data informada"
```

**Tipos de manifestação:**
- `ciencia` - Ciência da Operação (210210)
- `confirmacao` - Confirmação da Operação (210200)
- `desconhecimento` - Desconhecimento da Operação (210220)
- `nao-realizada` - Operação não Realizada (210240)

---

## Exemplo: Fluxo Completo em Homologação

```bash
# 1. Valide o certificado
npx fiscalzen validar-cert --cert ./cert.pfx --senha 123456

# 2. Consulte documentos pendentes
npx fiscalzen consultar \
  --cert ./cert.pfx \
  --senha 123456 \
  --cnpj 12345678000199 \
  --ambiente homologacao \
  --ultNSU 0

# 3. Manifeste ciência de um documento encontrado
npx fiscalzen manifestar \
  --cert ./cert.pfx \
  --senha 123456 \
  --chave <chave-do-documento> \
  --tipo ciencia \
  --ambiente homologacao
```

---

## Estrutura do Projeto

```
fiscalzen-project/
├── packages/
│   ├── cli/              # CLI (este pacote)
│   ├── sefaz-client/     # Cliente SEFAZ (SOAP, certificado, assinatura)
│   └── xml-parser/       # Parser de XMLs fiscais
├── CORE_LOGIC.md         # O que o projeto faz
├── ANTI_SCOPE.md         # O que o projeto NÃO faz
└── README.md             # Este arquivo
```

---

## Limitações e Riscos

### Limitações Técnicas

1. **Ambiente de homologação** - O ambiente de testes da SEFAZ pode não ter documentos disponíveis para o seu CNPJ
2. **Throttling** - A SEFAZ limita requisições. Código 656 indica consumo indevido
3. **Certificado real** - Mesmo em homologação, é necessário certificado A1 válido

### Avisos Legais

> ⚠️ **Use por sua conta e risco**

- Este projeto é **experimental** e **não possui garantias**
- Documentos fiscais têm implicações legais - consulte um contador
- A SEFAZ pode alterar os Web Services sem aviso prévio
- Não nos responsabilizamos por prejuízos decorrentes do uso

### O que pode dar errado

| Erro | Causa | Solução |
|------|-------|---------|
| `Mac verify error` | Senha incorreta | Verifique a senha do certificado |
| `certificate has expired` | Certificado vencido | Renove o certificado |
| HTTP 500 | Servidor SEFAZ indisponível | Aguarde e tente novamente |
| cStat 656 | Consumo indevido | Aguarde 1 hora |

---

## Desenvolvimento

```bash
# Rodar em modo desenvolvimento
pnpm --filter @fiscalzen/cli dev

# Executar testes
pnpm --filter @fiscalzen/sefaz-client test:run
```

---

## Licença

MIT

---

## Documentação Adicional

- [CORE_LOGIC.md](./CORE_LOGIC.md) - Escopo e fluxo do projeto
- [ANTI_SCOPE.md](./ANTI_SCOPE.md) - O que não está no escopo
