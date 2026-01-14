// ============================================
// Document Types
// ============================================

export const docTypes = ['NFE', 'NFSE', 'CTE', 'MDFE', 'SAT', 'NFCE'] as const;
export type DocType = (typeof docTypes)[number];

export const documentStatuses = ['autorizada', 'cancelada', 'inutilizada', 'denegada'] as const;
export type DocumentStatus = (typeof documentStatuses)[number];

// ============================================
// XML Types (schemas returned by SEFAZ)
// ============================================

export const xmlSchemaTypes = [
  'procNFe',      // NFe completa autorizada
  'resNFe',       // Resumo NFe (antes da manifestação)
  'procCTe',      // CTe completo
  'resCTe',       // Resumo CTe
  'procMDFe',     // MDF-e completo
  'procEventoNFe', // Evento NFe processado
  'resEvento',    // Resumo de evento
  'CFe',          // SAT
  'CFeCanc',      // SAT Cancelamento
  'CompNfse',     // NFSe ABRASF
  'unknown',
] as const;
export type XmlSchemaType = (typeof xmlSchemaTypes)[number];

// ============================================
// Event Types (Manifestação do Destinatário)
// ============================================

export const manifestacaoEventTypes = {
  '210200': 'CONFIRMACAO',    // Confirmação da Operação
  '210210': 'CIENCIA',        // Ciência da Emissão
  '210220': 'DESCONHECIMENTO', // Desconhecimento da Operação
  '210240': 'NAO_REALIZADA',  // Operação não Realizada
} as const;

export const nfeEventTypes = {
  '110110': 'CCE',            // Carta de Correção
  '110111': 'CANCELAMENTO',   // Cancelamento
  '110112': 'CANCELAMENTO_SUB', // Cancelamento por Substituição
  '110140': 'EPEC',           // EPEC
  ...manifestacaoEventTypes,
} as const;

export type ManifestacaoEventCode = keyof typeof manifestacaoEventTypes;
export type NFeEventCode = keyof typeof nfeEventTypes;

// ============================================
// Base Interfaces
// ============================================

export interface ParsedDocumentBase {
  tipo: DocType;
  chave?: string;
  numero: number;
  serie: number;
  dataEmissao: Date;
  emitente: {
    cnpj: string;
    razaoSocial: string;
    uf?: string;
    ie?: string;
  };
  destinatario: {
    cnpjCpf: string;
    razaoSocial: string;
  };
  valorTotal: number;
  situacao: DocumentStatus;
  metadata: Record<string, unknown>;
  searchContent: string;
}

export interface DocumentItem {
  numero: number;
  codigo: string;
  descricao: string;
  ncm?: string;
  cfop?: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
}

// ============================================
// Resumo NFe (resNFe_v1.01.xsd)
// Recebido ANTES da manifestação
// ============================================

export interface ResNFeData {
  tipo: 'resNFe';
  chave: string;
  cnpjCpf: string;         // CNPJ ou CPF do emitente
  razaoSocial: string;     // Nome do emitente
  ie?: string;             // Inscrição Estadual
  dataEmissao: Date;       // dhEmi
  tipoNF: '0' | '1';       // 0=Entrada, 1=Saída
  valorTotal: number;      // vNF
  digestValue: string;     // digVal - digest do XML
  dataRecebimento: Date;   // dhRecbto
  protocolo: string;       // nProt
  situacao: DocumentStatus; // cSitNFe: 1=Autorizada, 2=Uso Denegado, 3=Cancelada
  metadata: Record<string, unknown>;
}

// ============================================
// Resumo Evento (resEvento_v1.01.xsd)
// ============================================

export interface ResEventoData {
  tipo: 'resEvento';
  orgao: number;           // cOrgao
  cnpjCpf: string;         // CNPJ ou CPF
  chave: string;           // chNFe
  dataEvento: Date;        // dhEvento
  tipoEvento: string;      // tpEvento (ex: 210210)
  sequencia: number;       // nSeqEvento
  descricaoEvento: string; // xEvento
  dataRecebimento: Date;   // dhRecbto
  protocolo: string;       // nProt
  metadata: Record<string, unknown>;
}

// ============================================
// Evento Processado (procEventoNFe_v1.00.xsd)
// ============================================

export interface ProcEventoNFeData {
  tipo: 'procEventoNFe';
  versao: string;
  // Dados do evento
  evento: {
    orgao: number;         // cOrgao
    ambiente: '1' | '2';   // tpAmb
    cnpjCpf: string;       // CNPJ autor do evento
    chave: string;         // chNFe
    dataEvento: Date;      // dhEvento
    tipoEvento: string;    // tpEvento
    sequencia: number;     // nSeqEvento
    versaoEvento: string;  // verEvento
    descricaoEvento: string; // descEvento
    justificativa?: string;  // xJust (para tpEvento 210240)
    correcao?: string;     // xCorrecao (para CCe)
  };
  // Retorno da SEFAZ
  retorno: {
    ambiente: '1' | '2';   // tpAmb
    versaoApp: string;     // verAplic
    orgao: number;         // cOrgao
    status: number;        // cStat
    motivo: string;        // xMotivo
    chave: string;         // chNFe
    tipoEvento: string;    // tpEvento
    descricaoEvento: string; // xEvento
    sequencia: number;     // nSeqEvento
    dataRegistro: Date;    // dhRegEvento
    protocolo: string;     // nProt
  };
  metadata: Record<string, unknown>;
}

// ============================================
// Detection Result
// ============================================

export interface XmlDetectionResult {
  schemaType: XmlSchemaType;
  docType: DocType | null;
  isResumo: boolean;       // É resumo (resNFe, resEvento)?
  isEvento: boolean;       // É evento?
  chave?: string;          // Chave de acesso, se disponível
}

// ============================================
// Decode Result (for GZip/Base64)
// ============================================

export interface DecodeResult {
  xml: string;
  nsu: string;
  schema: string;
}
