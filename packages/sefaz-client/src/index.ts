// Client
export { SefazClient } from './client';

// SOAP Client
export {
  SoapClient,
  extractSoapBody,
  extractElement,
  extractAttribute,
  extractAllElements,
  extractTagValue,
  createSoapClient,
} from './soap-client';

// Constants - exporta tudo de constants
export {
  UF_CODES,
  SEFAZ_URLS,
  SEFAZ_STATUS,
  DIST_DFE_SCHEMAS,
} from './constants';

// Types - exporta apenas os tipos (não re-exporta SEFAZ_STATUS)
export type {
  SefazAmbiente,
  CertificadoA1,
  SefazClientConfig,
  DistDFeParams,
  DocumentoDistDFe,
  DistDFeResponse,
  TipoEventoManifestacao,
  ManifestacaoParams,
  ManifestacaoResponse,
  ConsultaProtocoloParams,
  ConsultaProtocoloResponse,
  SoapEnvelope,
  SoapResponse,
  SefazResponse,
  DistDFeRequest,
} from './types';

// Exporta as constantes e classes de tipos
export {
  MANIFESTACAO_DESCRICOES,
  SefazError,
  CertificadoError,
  TimeoutError,
} from './types';

// Certificate
export {
  loadCertificado,
  loadCertificadoCached,
  clearCertificadoCache,
  getCertificadoInfo,
  validateCertificado,
  getCertificadoPem,
  getPrivateKey,
} from './certificate';

export type { CertificadoInfo, CertificadoKeys } from './certificate';

// Signature
export {
  signXml,
  signXmlLegacy,
  validateSignature,
  calculateDigest,
  calculateDigestSha256,
  gerarEventoId,
} from './signature';

// Services
export * from './services/manifestacao';
export * from './services/consulta';
export * from './services/distdfe-nfe';
export * from './services/distdfe-cte';
export * from './services/mdfe-distdfe';