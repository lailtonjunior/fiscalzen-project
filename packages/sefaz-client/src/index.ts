// ============================================
// @fiscalzen/sefaz-client
// ============================================
// Cliente para Web Services SEFAZ
// NFe, CTe, MDFe DistDFe e Manifestacao

// Types
export type {
  SefazAmbiente,
  CertificadoA1,
  SefazClientConfig,
  DistDFeParams,
  DistDFeResponse,
  DocumentoDistDFe,
  ManifestacaoParams,
  ManifestacaoResponse,
  TipoEventoManifestacao,
  ConsultaProtocoloParams,
  ConsultaProtocoloResponse,
  SoapEnvelope,
  SoapResponse,
} from './types.js';

// Error classes
export {
  SefazError,
  CertificadoError,
  TimeoutError,
  SEFAZ_STATUS,
  MANIFESTACAO_DESCRICOES,
} from './types.js';

// Certificate utilities
export {
  loadCertificado,
  getCertificadoInfo,
  validateCertificado,
  getCertificadoPem,
  getPrivateKey,
  loadCertificadoCached,
  clearCertificadoCache,
  type CertificadoInfo,
  type CertificadoKeys,
} from './certificate.js';

// Signature utilities
export {
  signXml,
  signEvento,
  gerarEventoId,
  validateSignature,
  calculateDigest,
  type SignatureOptions,
} from './signature.js';

// SOAP Client
export {
  SoapClient,
  createSoapClient,
  extractSoapBody,
  extractElement,
  extractAttribute,
  extractAllElements,
  extractTagValue,
  type SoapClientOptions,
} from './soap-client.js';

// Endpoints and constants
export {
  NFE_DISTDFE_ENDPOINTS,
  NFE_RECEPCAO_EVENTO_ENDPOINTS,
  NFE_CONSULTA_PROTOCOLO_ENDPOINTS,
  CTE_DISTDFE_ENDPOINTS,
  MDFE_DISTDFE_ENDPOINTS,
  SOAP_NAMESPACES,
  SOAP_ACTIONS,
  SCHEMA_VERSIONS,
  XML_NAMESPACES,
  UF_CODES,
  UF_FROM_CODE,
  getNFeDistDFeEndpoint,
  getNFeEventoEndpoint,
  getCTeDistDFeEndpoint,
  getMDFeDistDFeEndpoint,
  getAmbienteCode,
  getUfCode,
  getUfFromCode,
} from './constants/endpoints.js';

// NFe DistDFe Service
export {
  consultarDistDFe,
  consultarPorUltNSU,
  consultarPorNSU,
  consultarPorChave,
} from './services/nfe-distdfe.js';

// CTe DistDFe Service
export {
  consultarCTeDistDFe,
  consultarCTePorUltNSU,
  consultarCTePorNSU,
  consultarCTePorChave,
} from './services/cte-distdfe.js';

// MDFe DistDFe Service
export {
  consultarMDFeDistDFe,
  consultarMDFePorUltNSU,
  consultarMDFePorNSU,
  consultarMDFePorChave,
} from './services/mdfe-distdfe.js';

// Manifestacao do Destinatario
export {
  enviarManifestacao,
  confirmarOperacao,
  registrarCiencia,
  desconhecerOperacao,
  operacaoNaoRealizada,
} from './services/manifestacao.js';
