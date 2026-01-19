import { Page } from 'playwright';
import { AbrasfClient } from './abrasf/client';
import { SaoPauloAdapter } from './abrasf/municipios/sao-paulo';
import { RioDeJaneiroAdapter } from './abrasf/municipios/rio-de-janeiro';
import { BeloHorizonteAdapter } from './abrasf/municipios/belo-horizonte';
import { BaseNfseScraper } from './rpa/base-scraper';
import { getMunicipioConfig } from './registry';
import type { CertificadoA1, MunicipioConfig } from './types';

// ============================================
// Client Factory
// ============================================

/**
 * Get the appropriate ABRASF client for a municipality
 */
export function getAbrasfClient(
  codigoMunicipio: string,
  certificado: CertificadoA1,
  ambiente: 'producao' | 'homologacao' = 'producao'
): AbrasfClient {
  const config = getMunicipioConfig(codigoMunicipio);

  if (!config) {
    throw new Error(`Municipio ${codigoMunicipio} nao encontrado no registro`);
  }

  if (config.tipo !== 'abrasf') {
    throw new Error(`Municipio ${config.nome} nao suporta integracao ABRASF`);
  }

  // Return specific adapter if available
  switch (codigoMunicipio) {
    case '3550308': // São Paulo
      return new SaoPauloAdapter(certificado, ambiente);

    case '3304557': // Rio de Janeiro
      return new RioDeJaneiroAdapter(certificado, ambiente);

    case '3106200': // Belo Horizonte
      return new BeloHorizonteAdapter(certificado, ambiente);

    default:
      // Use generic ABRASF client for other municipalities
      return new AbrasfClient(config, certificado, ambiente);
  }
}

/**
 * Get the appropriate RPA scraper for a municipality
 */
export function getRpaScraper(
  codigoMunicipio: string,
  _page: Page
): BaseNfseScraper {
  const config = getMunicipioConfig(codigoMunicipio);

  if (!config) {
    throw new Error(`Municipio ${codigoMunicipio} nao encontrado no registro`);
  }

  if (config.tipo !== 'rpa') {
    throw new Error(`Municipio ${config.nome} nao requer RPA`);
  }

  // Add specific scrapers as they are implemented
  switch (codigoMunicipio) {
    // Example: Add Manaus scraper when implemented
    // case '1302603':
    //   return new ManausScraper(page);

    default:
      throw new Error(`Scraper para ${config.nome} ainda nao implementado`);
  }
}

/**
 * Check if a municipality requires RPA or supports ABRASF
 */
export function getMunicipioIntegrationType(
  codigoMunicipio: string
): 'abrasf' | 'rpa' | 'nao_suportado' {
  const config = getMunicipioConfig(codigoMunicipio);
  return config?.tipo ?? 'nao_suportado';
}

/**
 * Get municipality configuration
 */
export function getMunicipioInfo(codigoMunicipio: string): MunicipioConfig | null {
  return getMunicipioConfig(codigoMunicipio);
}
