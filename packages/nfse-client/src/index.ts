// Types
export type {
  MunicipioConfig,
  MunicipioTipo,
  AbrasfVersion,
  MunicipioEndpoints,
  MunicipioParticularidades,
  CertificadoA1,
  NfseIdentificacao,
  NfsePrestador,
  NfseTomador,
  NfseEndereco,
  NfseContato,
  NfseServico,
  NfseValores,
  ParsedNfse,
  ConsultaParams,
  ConsultaNfseServicoTomadoParams,
  ConsultaNfseServicoPrestadoParams,
  ConsultaNfsePorFaixaParams,
  NfseConsultaResponse,
  NfseErro,
  NfseCredentials,
  NfseRpaResult,
  NfseTestConnectionResult,
} from './types.js';

// Registry
export {
  MUNICIPIOS,
  getMunicipioConfig,
  isMunicipioSuportado,
  getMunicipiosByUf,
  getMunicipiosByTipo,
  getAllMunicipios,
  searchMunicipios,
} from './registry.js';

// ABRASF Client
export { AbrasfClient } from './abrasf/client.js';
export {
  SaoPauloAdapter,
  SAO_PAULO_CONFIG,
  RioDeJaneiroAdapter,
  RIO_DE_JANEIRO_CONFIG,
  BeloHorizonteAdapter,
  BELO_HORIZONTE_CONFIG,
} from './abrasf/municipios/index.js';

// RPA
export {
  BrowserManager,
  getBrowserManager,
  closeBrowserManager,
  BaseNfseScraper,
} from './rpa/index.js';

// Factory
export {
  getAbrasfClient,
  getRpaScraper,
  getMunicipioIntegrationType,
  getMunicipioInfo,
} from './factory.js';
