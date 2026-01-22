# Glossário e Conceitos de Domínio - FiscalZen

Este documento serve como referência para os termos técnicos, siglas e conceitos de negócio utilizados no ecossistema FiscalZen. O projeto lida com a complexidade do sistema fiscal brasileiro, integrando-se com esferas governamentais Federais, Estaduais e Municipais.

---

## Documentos Fiscais Eletrônicos (DF-e)

Os Documentos Fiscais Eletrônicos são arquivos XML com validade jurídica que substituíram os documentos em papel.

### NF-e (Nota Fiscal Eletrônica)  
- **Descrição:** Documento que registra operações de circulação de mercadorias.  
- **Modelo:** 55  
- **Identificação:** Chave de acesso de 44 dígitos única para cada nota.  
- **Papel no Sistema:** O FiscalZen monitora principalmente notas fiscais onde o cliente é o **Destinatário**, permitindo a recepção e manifestação sobre esses documentos.  

### NFS-e (Nota Fiscal de Serviços Eletrônica)  
- **Descrição:** Documento eletrônico emitido para registro de prestação de serviços, com validade municipal.  
- **Padrão:** O padrão varia por município. O sistema suporta o padrão **ABRASF** (versões 1 e 2) e também a abordagem de **RPA** (Robotic Process Automation) para prefeituras sem webservices.  
- **Implementação:** Gerenciado internamente pelo `AbrasfClient` e através de adaptadores específicos para municípios, como o `BeloHorizonteAdapter`.  

### CT-e (Conhecimento de Transporte Eletrônico)  
- **Descrição:** Documento usado para registrar serviços de transporte de cargas (rodoviário, aéreo, ferroviário, etc.).  
- **Modelo:** 57  

### MDF-e (Manifesto Eletrônico de Documentos Fiscais)  
- **Descrição:** Documento que agrupa vários documentos fiscais (NF-e, CT-e) relacionados à uma unidade logística de carga.  
- **Modelo:** 58  

---

## Ecossistema SEFAZ e Integração

### SEFAZ (Secretaria da Fazenda)  
Órgão estadual responsável pela arrecadação e fiscalização tributária. No FiscalZen, o componente `SefazClient` encapsula a comunicação via SOAP com os WebServices disponibilizados por SEFAZ em diversos níveis.

### Ambiente (tpAmb)  
Define qual o destino das requisições feitas ao SEFAZ:  
- **Produção (1):** Ambiente oficial para operações legais e válidas fiscalmente.  
- **Homologação (2):** Ambiente de testes, sem validade comercial real.  

### DistDFe (Distribuição de Documento Fiscal Eletrônico)  
Serviço da SEFAZ que permite ao destinatário consultar e baixar documentos fiscais emitidos contra seu CNPJ.  

- **Compactação dos XML:** Normalmente os XMLs retornados vêm em blocos comprimidos em GZIP, codificados em Base64. A função utilitária `decodeDocZip` lida com esta descompactação automaticamente.  

### NSU (Número Sequencial Único)  
Número incremental gerenciado pela SEFAZ para controlar a sequência de documentos disponibilizados para cada destinatário (CNPJ).  

- **Sincronização:** O banco possui uma tabela `nsu_control` que guarda o último NSU sincronizado (`last_nsu`), permitindo o job `SefazMonitorJob` continuar a consulta do ponto exato onde parou.  

---

## Segurança e Certificação

### Certificado Digital A1  
- **Descrição:** Arquivo digital no formato `.pfx` ou `.p12` que atesta a identidade da empresa no ambiente eletrônico fiscal.  
- **Protocolos:** Utilizado em autenticação mTLS (Mutual TLS), protocolo que exige certificado válido no cliente e servidor para comunicação segura.  
- **Assinatura Digital:** Documento XML deve ser assinado digitalmente para garantir integridade e autenticidade. As funcionalidades `signXml` e `calculateDigest` realizam este processo no código.  

### Cadeia de Certificação  
Conjunto hierárquico de certificados de autoridades certificadoras (AC) que validam o certificado da empresa. FiscalZen requer configuração das cadeias da ICP-Brasil para garantir confiança e compatibilidade.  

---

## Eventos e Manifestação do Destinatário

Para que o destinatário manifeste sua ciência e posição diante de uma NF-e eletrônica emitida contra ele, existem eventos legais padronizados:

| Evento                     | Código  | Descrição                                                                                                  |
| :------------------------- | :-----: | :------------------------------------------------------------------------------------------------------- |
| Ciência da Operação        | 210210  | O destinatário informa seu conhecimento da nota fiscal, liberando a SEFAZ para liberar o XML completo.    |
| Confirmação da Operação    | 210200  | O destinatário confirma a operação e o recebimento da mercadoria.                                         |
| Desconhecimento da Operação| 210220  | Utilizado quando o CNPJ foi indevidamente usado em uma nota, que não pertence à empresa.                   |
| Operação não Realizada     | 210240  | Quando há um acerto comercial, mas a mercadoria não foi entregue.                                         |

---

## Arquitetura do Sistema (Conceitos Técnicos)

### Tenant (Inquilino)  
Representa a conta principal no sistema, geralmente um escritório de contabilidade ou uma holding. Garante isolamento lógico entre clientes.  

### Company (Empresa)  
Entidade associada a um Tenant, representa uma empresa real (CNPJ) no sistema. É o nível onde certificados digitais são instalados e documentos são armazenados.  

### Chave de Acesso  
Identificador único gerado para cada documento fiscal eletrônico com 44 caracteres, contendo informações codificadas sobre UF, data, CNPJ, modelo, série, número, tipo de emissão e um dígito verificador.  

- **Validação:** Implementada pela função `isValidChaveAcesso` para garantir autenticidade e integridade.  

### Monitoramento e Jobs (Tarefas em Segundo Plano)  
Módulos de execução contínua e periódica que mantêm a sincronização e atualização dos dados fiscais:

- **SefazMonitorJob:** Consulta periodicamente o serviço de distribuição da SEFAZ para capturar documentos novos ou atualizações.  
- **XmlProcessorJob:** Realiza parsing e processamento do XML bruto, extraindo dados estruturados como itens, impostos e valores, para gravar no banco de dados.  
- **SearchSyncJob:** Indexa os documentos processados no Meilisearch, permitindo buscas integradas e ultra-rápidas na interface Web.  

---

## Siglas Comuns

| Sigla     | Significado                                 | Descrição                                             |
|-----------|--------------------------------------------|-------------------------------------------------------|
| **ABRASF**| Associação Brasileira das Secretarias de Finanças | Organismo que padroniza comunicação de NFS-e.          |
| **DANFE** | Documento Auxiliar da NF-e                  | Representação legível (tipicamente PDF) da Nota Fiscal. |
| **DF-e**  | Documento Fiscal Eletrônico                 | Termo geral para documentos como NF-e, CT-e, MDF-e.    |
| **RPA**   | Robotic Process Automation                  | Automação que simula o navegador para acessar prefeituras sem API. |
| **SOAP**  | Simple Object Access Protocol                | Protocolo XML utilizado nas comunicações com webservices SEFAZ. |
| **UF**    | Unidade da Federação                        | Sigla do estado brasileiro (ex: SP - São Paulo).       |

---

## Exemplos de Uso

### Verificar validade de uma Chave de Acesso

```typescript
import { isValidChaveAcesso } from 'packages/xml-parser/src/detector';

const chave = '35191234567890123456789012345678901234567890';
if (isValidChaveAcesso(chave)) {
    console.log('Chave de acesso válida');
} else {
    console.log('Chave de acesso inválida');
}
```

### Criar cliente ABRASF para emissão de NFS-e

```typescript
import { AbrasfClient } from 'packages/nfse-client/src/abrasf/client';

const abrasfClient = new AbrasfClient({
  // Configurações específicas do município e credenciais
});

const response = await abrasfClient.sendNfse({...});
console.log('NFS-e emitida com sucesso:', response);
```

### Monitorar SEFAZ utilizando o job `SefazMonitorJob`

Este job é configurado no backend da aplicação e executa regularmente para sincronizar documentos fiscais eletrônicos emitidos a uma empresa. Ele utiliza o número NSU para evitar duplicidade e garantir o processamento contínuo.

---

## Relacionados

- **`SefazClient`** – Cliente para integração com serviços SOAP da SEFAZ visando NF-e, CT-e, MDF-e, manifestação de destinatário e distribuição de documentos fiscais.  
- **`AbrasfClient`** – Cliente oficial para integração com o padrão ABRASF das NFS-e municipais.  
- **`BeloHorizonteAdapter`** – Adaptador específico para integrar com a Prefeitura de Belo Horizonte conforme padrão ABRASF.  
- **Jobs de backend:**  
  - `SefazMonitorJob` – Sincroniza documentos fiscais contínuos.  
  - `XmlProcessorJob` – Realiza processamento e parsing dos XMLs recebidos.  
  - `SearchSyncJob` – Indexa documentos para uma busca rápida na interface.  
- **Funções utilitárias:**  
  - `decodeDocZip` – Descompacta e decodifica XMLs compactados e codificados em Base64.  
  - `signXml`, `calculateDigest` – Realizam assinaturas digitais e cálculos de hash para integridade e autenticidade dos documentos XML.

---

Este glossário é fundamental para entender os conceitos-chave envolvidos no desenvolvimento, manutenção e integração do sistema FiscalZen com o complexo ambiente fiscal brasileiro. Para detalhes técnicos e exemplos de implementação, consulte os respectivos módulos e serviços listados acima.
