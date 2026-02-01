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

// Resilience
export {
  withRetry,
  type RetryConfig,
  defaultRetryConfig,
} from './retry';

export {
  CircuitBreaker,
  CircuitBreakerError,
  CircuitState,
  type CircuitBreakerConfig,
  defaultCircuitConfig,
} from './circuit-breaker';

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

// Services - NFe
export {
  consultarDistDFe,
  consultarPorUltNSU,
  consultarPorNSU,
  consultarPorChave,
} from './services/nfe-distdfe';

// Services - CTe
export {
  consultarCTeDistDFe,
  consultarCTePorUltNSU,
  consultarCTePorNSU,
  consultarCTePorChave,
} from './services/cte-distdfe';

export {
  registrarDesacordoCTe,
} from './services/cte-events';

// Services - MDFe
export {
  consultarMDFeDistDFe,
  consultarMDFePorUltNSU,
  consultarMDFePorNSU,
  consultarMDFePorChave,
} from './services/mdfe-distdfe';

// Services - Manifestacao
export {
  enviarManifestacao,
  confirmarOperacao,
  registrarCiencia,
  desconhecerOperacao,
  operacaoNaoRealizada,
} from './services/manifestacao';

// Services - Event Query
export {
  consultarEventos,
  type ConsultarEventosParams,
  type ConsultarEventosResponse,
  type EventoConsultado,
} from './services/event-query';