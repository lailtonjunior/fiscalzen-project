// UF Codes (IBGE)
export const UF_CODES: Record<string, string> = {
  AC: '12',
  AL: '27',
  AM: '13',
  AP: '16',
  BA: '29',
  CE: '23',
  DF: '53',
  ES: '32',
  GO: '52',
  MA: '21',
  MG: '31',
  MS: '50',
  MT: '51',
  PA: '15',
  PB: '25',
  PE: '26',
  PI: '22',
  PR: '41',
  RJ: '33',
  RN: '24',
  RO: '11',
  RR: '14',
  RS: '43',
  SC: '42',
  SE: '28',
  SP: '35',
  TO: '17',
};

// SEFAZ Web Service URLs
export const SEFAZ_URLS = {
  NFE: {
    DISTDFE: {
      production: 'https://www1.nfe.fazenda.gov.br/NFeDistribuicaoDFe/NFeDistribuicaoDFe.asmx',
      homologation: 'https://hom1.nfe.fazenda.gov.br/NFeDistribuicaoDFe/NFeDistribuicaoDFe.asmx',
    },
    MANIFESTACAO: {
      production: 'https://www.nfe.fazenda.gov.br/NFeRecepcaoEvento4/NFeRecepcaoEvento4.asmx',
      homologation: 'https://hom.nfe.fazenda.gov.br/NFeRecepcaoEvento4/NFeRecepcaoEvento4.asmx',
    },
    CONSULTA: {
      production: 'https://www.nfe.fazenda.gov.br/NFeConsultaProtocolo4/NFeConsultaProtocolo4.asmx',
      homologation: 'https://hom.nfe.fazenda.gov.br/NFeConsultaProtocolo4/NFeConsultaProtocolo4.asmx',
    },
  },
  CTE: {
    DISTDFE: {
      production: 'https://www1.cte.fazenda.gov.br/CTeDistribuicaoDFe/CTeDistribuicaoDFe.asmx',
      homologation: 'https://hom1.cte.fazenda.gov.br/CTeDistribuicaoDFe/CTeDistribuicaoDFe.asmx',
    },
  },
};

// SEFAZ Status Codes
export const SEFAZ_STATUS = {
  // Success
  '137': 'Documento localizado',
  '138': 'Não há mais documentos',

  // Errors
  '656': 'Consumo indevido',
  '593': 'Certificado inválido',
  '594': 'Certificado revogado',

  // Manifestação
  '210200': 'Evento registrado com sucesso',
  '210210': 'Ciência da Operação registrada',
  '210220': 'Confirmação da Operação registrada',
  '210240': 'Operação não Realizada registrada',
  '210260': 'Desconhecimento da Operação registrado',
};

// Document types that can be returned
export const DIST_DFE_SCHEMAS = {
  resNFe: 'Resumo NFe',
  resEvento: 'Resumo Evento',
  procNFe: 'NFe Completa',
  procEventoNFe: 'Evento NFe',
};
