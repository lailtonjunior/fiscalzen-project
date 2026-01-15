import type { DocType } from '@fiscalzen/xml-parser';

// ============================================
// Environment & Configuration
// ============================================

export type SefazAmbiente = 'producao' | 'homologacao';

export interface CertificadoA1 {
  pfxBuffer: Buffer;
  password: string;
  // Extracted info
  cnpj?: string;
  razaoSocial?: string;
  validFrom?: Date;
  validTo?: Date;
}

export interface SefazClientConfig {
  ambiente: SefazAmbiente;
  certificado: CertificadoA1;
  timeout?: number;        // Default: 30000ms
  retryAttempts?: number;  // Default: 3
  retryDelay?: number;     // Default: 1000ms (base for exponential backoff)
}

// ============================================
// DistDFe Request/Response
// ============================================

export interface DistDFeParams {
  ambiente: SefazAmbiente;
  cnpj: string;
  ufAutor?: number;        // Código UF (35 para SP, etc)
  // Tipos de consulta (apenas um deve ser informado)
  ultNSU?: string;         // distNSU - busca em lote
  nsu?: string;            // consNSU - busca NSU específico
  chNFe?: string;          // consChNFe - busca por chave
  certificado: CertificadoA1;
}

export interface DocumentoDistDFe {
  nsu: string;             // NSU do documento (15 dígitos)
  schema: string;          // Ex: procNFe_v4.00.xsd, resNFe_v1.01.xsd
  xml: string;             // XML descompactado
  tipo: DocType | null;    // Tipo detectado (NFE, CTE, etc)
  isResumo: boolean;       // É resumo (resNFe, resEvento)?
  isEvento: boolean;       // É evento?
  chave?: string;          // Chave de acesso (quando disponível)
}

export interface DistDFeResponse {
  sucesso: boolean;
  // Status da SEFAZ
  cStat: string;           // Código de status (137, 138, 656, etc)
  xMotivo: string;         // Descrição do status
  // Controle de NSU
  ultNSU: string;          // Último NSU pesquisado
  maxNSU: string;          // Maior NSU disponível
  // Documentos retornados
  documentos: DocumentoDistDFe[];
  // Metadata
  dhResp?: Date;           // Data/hora da resposta
  versaoApp?: string;      // Versão da aplicação SEFAZ
  // Erro (quando sucesso=false)
  erro?: {
    codigo: string;
    mensagem: string;
  };
}

// ============================================
// Manifestação do Destinatário
// ============================================

export type TipoEventoManifestacao =
  | '210200'  // Confirmação da Operação
  | '210210'  // Ciência da Emissão
  | '210220'  // Desconhecimento da Operação
  | '210240'; // Operação não Realizada

export const MANIFESTACAO_DESCRICOES: Record<TipoEventoManifestacao, string> = {
  '210200': 'Confirmacao da Operacao',
  '210210': 'Ciencia da Operacao',
  '210220': 'Desconhecimento da Operacao',
  '210240': 'Operacao nao Realizada',
};

export interface ManifestacaoParams {
  ambiente: SefazAmbiente;
  chNFe: string;           // Chave de acesso da NFe (44 dígitos)
  cnpjDestinatario: string; // CNPJ do destinatário (14 dígitos)
  tipoEvento: TipoEventoManifestacao;
  justificativa?: string;   // Obrigatório para 210240 (min 15, max 255 chars)
  sequencia?: number;       // Sequência do evento (default: 1)
  certificado: CertificadoA1;
}

export interface ManifestacaoResponse {
  sucesso: boolean;
  // Dados do evento registrado
  chNFe: string;
  tipoEvento: string;
  descricaoEvento: string;
  sequencia: number;
  dhRegEvento?: Date;
  nProt?: string;          // Número do protocolo
  // Status
  cStat: string;
  xMotivo: string;
  // Erro
  erro?: {
    codigo: string;
    mensagem: string;
  };
}

// ============================================
// Consulta Protocolo
// ============================================

export interface ConsultaProtocoloParams {
  ambiente: SefazAmbiente;
  chNFe: string;
  certificado: CertificadoA1;
}

export interface ConsultaProtocoloResponse {
  sucesso: boolean;
  cStat: string;
  xMotivo: string;
  // Dados da NFe
  chNFe?: string;
  nProt?: string;
  dhRecbto?: Date;
  digVal?: string;
  // Situação
  situacao?: 'autorizada' | 'cancelada' | 'denegada' | 'inutilizada';
  erro?: {
    codigo: string;
    mensagem: string;
  };
}

// ============================================
// Códigos de Status SEFAZ
// ============================================

import { SEFAZ_STATUS as ConstantsSEFAZ_STATUS } from './constants';

export type SEFAZ_STATUS = typeof ConstantsSEFAZ_STATUS;

// ============================================
// SOAP Types
// ============================================

export interface SoapEnvelope {
  action: string;
  body: string;
  namespace?: string;
}

export interface SoapResponse {
  statusCode: number;
  body: string;
  headers: Record<string, string>;
}

// ============================================
// Error Types
// ============================================

export class SefazError extends Error {
  constructor(
    message: string,
    public readonly codigo: string,
    public readonly xmlRequest?: string,
    public readonly xmlResponse?: string
  ) {
    super(message);
    this.name = 'SefazError';
  }
}

export class CertificadoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CertificadoError';
  }
}

export class TimeoutError extends Error {
  constructor(message: string = 'Request timeout') {
    super(message);
    this.name = 'TimeoutError';
  }
}
