// ============================================
// SEFAZ Web Service Endpoints
// ============================================
// Referências:
// - NFe: https://www.nfe.fazenda.gov.br/portal/webServices.aspx
// - CTe: https://www.cte.fazenda.gov.br/portal/webServices.aspx
// - MDFe: https://mdfe-portal.sefaz.rs.gov.br/Site/Servicos

import type { SefazAmbiente } from '../types';

// ============================================
// NFe - Ambiente Nacional (AN)
// ============================================

export const NFE_DISTDFE_ENDPOINTS = {
  producao: 'https://www1.nfe.fazenda.gov.br/NFeDistribuicaoDFe/NFeDistribuicaoDFe.asmx',
  homologacao: 'https://hom1.nfe.fazenda.gov.br/NFeDistribuicaoDFe/NFeDistribuicaoDFe.asmx',
} as const;

export const NFE_RECEPCAO_EVENTO_ENDPOINTS = {
  producao: 'https://www.nfe.fazenda.gov.br/NFeRecepcaoEvento4/NFeRecepcaoEvento4.asmx',
  homologacao: 'https://hom1.nfe.fazenda.gov.br/NFeRecepcaoEvento4/NFeRecepcaoEvento4.asmx',
} as const;

export const NFE_CONSULTA_PROTOCOLO_ENDPOINTS = {
  producao: 'https://www.nfe.fazenda.gov.br/NFeConsultaProtocolo4/NFeConsultaProtocolo4.asmx',
  homologacao: 'https://hom1.nfe.fazenda.gov.br/NFeConsultaProtocolo4/NFeConsultaProtocolo4.asmx',
} as const;

// ============================================
// CTe - SVRS (Sefaz Virtual RS)
// ============================================

export const CTE_DISTDFE_ENDPOINTS = {
  producao: 'https://www1.cte.fazenda.gov.br/CTeDistribuicaoDFe/CTeDistribuicaoDFe.asmx',
  homologacao: 'https://hom1.cte.fazenda.gov.br/CTeDistribuicaoDFe/CTeDistribuicaoDFe.asmx',
} as const;

export const CTE_RECEPCAO_EVENTO_ENDPOINTS = {
  producao: 'https://www.cte.fazenda.gov.br/CTeRecepcaoEvento/CTeRecepcaoEvento.asmx',
  homologacao: 'https://hom.cte.fazenda.gov.br/CTeRecepcaoEvento/CTeRecepcaoEvento.asmx',
} as const;

// ============================================
// MDFe - SVRS (Sefaz Virtual RS)
// ============================================

export const MDFE_DISTDFE_ENDPOINTS = {
  producao: 'https://mdfe.svrs.rs.gov.br/ws/MDFeDistribuicaoDFe/MDFeDistribuicaoDFe.asmx',
  homologacao: 'https://mdfe-homologacao.svrs.rs.gov.br/ws/MDFeDistribuicaoDFe/MDFeDistribuicaoDFe.asmx',
} as const;

export const MDFE_RECEPCAO_EVENTO_ENDPOINTS = {
  producao: 'https://mdfe.svrs.rs.gov.br/ws/MDFeRecepcaoEvento/MDFeRecepcaoEvento.asmx',
  homologacao: 'https://mdfe-homologacao.svrs.rs.gov.br/ws/MDFeRecepcaoEvento/MDFeRecepcaoEvento.asmx',
} as const;

// ============================================
// SOAP Actions & Namespaces
// ============================================

export const SOAP_NAMESPACES = {
  nfe: 'http://www.portalfiscal.inf.br/nfe/wsdl/NFeDistribuicaoDFe',
  nfeEvento: 'http://www.portalfiscal.inf.br/nfe/wsdl/NFeRecepcaoEvento4',
  nfeConsulta: 'http://www.portalfiscal.inf.br/nfe/wsdl/NFeConsultaProtocolo4',
  cte: 'http://www.portalfiscal.inf.br/cte/wsdl/CTeDistribuicaoDFe',
  cteEvento: 'http://www.portalfiscal.inf.br/cte/wsdl/CTeRecepcaoEvento',
  mdfe: 'http://www.portalfiscal.inf.br/mdfe/wsdl/MDFeDistribuicaoDFe',
  mdfeEvento: 'http://www.portalfiscal.inf.br/mdfe/wsdl/MDFeRecepcaoEvento',
} as const;

export const SOAP_ACTIONS = {
  nfeDistDFe: 'http://www.portalfiscal.inf.br/nfe/wsdl/NFeDistribuicaoDFe/nfeDistDFeInteresse',
  nfeRecepcaoEvento: 'http://www.portalfiscal.inf.br/nfe/wsdl/NFeRecepcaoEvento4/nfeRecepcaoEvento',
  nfeConsultaProtocolo: 'http://www.portalfiscal.inf.br/nfe/wsdl/NFeConsultaProtocolo4/nfeConsultaNF',
  cteDistDFe: 'http://www.portalfiscal.inf.br/cte/wsdl/CTeDistribuicaoDFe/cteDistDFeInteresse',
  cteRecepcaoEvento: 'http://www.portalfiscal.inf.br/cte/wsdl/CTeRecepcaoEvento/cteRecepcaoEvento',
  mdfeDistDFe: 'http://www.portalfiscal.inf.br/mdfe/wsdl/MDFeDistribuicaoDFe/mdfeDistDFeInteresse',
  mdfeRecepcaoEvento: 'http://www.portalfiscal.inf.br/mdfe/wsdl/MDFeRecepcaoEvento/mdfeRecepcaoEvento',
} as const;

// ============================================
// XML Schemas & Versions
// ============================================

export const SCHEMA_VERSIONS = {
  nfe: '4.00',
  cte: '4.00',
  mdfe: '3.00',
  distDFe: '1.01',
  evento: '1.00',
} as const;

export const XML_NAMESPACES = {
  nfe: 'http://www.portalfiscal.inf.br/nfe',
  cte: 'http://www.portalfiscal.inf.br/cte',
  mdfe: 'http://www.portalfiscal.inf.br/mdfe',
  soap: 'http://www.w3.org/2003/05/soap-envelope',
  xmldsig: 'http://www.w3.org/2000/09/xmldsig#',
} as const;

// ============================================
// UF Codes (Código IBGE)
// ============================================

export const UF_CODES: Record<string, number> = {
  AC: 12,
  AL: 27,
  AM: 13,
  AP: 16,
  BA: 29,
  CE: 23,
  DF: 53,
  ES: 32,
  GO: 52,
  MA: 21,
  MG: 31,
  MS: 50,
  MT: 51,
  PA: 15,
  PB: 25,
  PE: 26,
  PI: 22,
  PR: 41,
  RJ: 33,
  RN: 24,
  RO: 11,
  RR: 14,
  RS: 43,
  SC: 42,
  SE: 28,
  SP: 35,
  TO: 17,
  AN: 91, // Ambiente Nacional
} as const;

export const UF_FROM_CODE: Record<number, string> = Object.fromEntries(
  Object.entries(UF_CODES).map(([uf, code]) => [code, uf])
);

// ============================================
// Helper Functions
// ============================================

export function getNFeDistDFeEndpoint(ambiente: SefazAmbiente): string {
  return NFE_DISTDFE_ENDPOINTS[ambiente];
}

export function getNFeEventoEndpoint(ambiente: SefazAmbiente): string {
  return NFE_RECEPCAO_EVENTO_ENDPOINTS[ambiente];
}

export function getCTeDistDFeEndpoint(ambiente: SefazAmbiente): string {
  return CTE_DISTDFE_ENDPOINTS[ambiente];
}

export function getMDFeDistDFeEndpoint(ambiente: SefazAmbiente): string {
  return MDFE_DISTDFE_ENDPOINTS[ambiente];
}

export function getAmbienteCode(ambiente: SefazAmbiente): '1' | '2' {
  return ambiente === 'producao' ? '1' : '2';
}

export function getUfCode(uf: string): number | undefined {
  return UF_CODES[uf.toUpperCase()];
}

export function getUfFromCode(code: number): string | undefined {
  return UF_FROM_CODE[code];
}
