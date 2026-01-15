import { AbrasfClient } from '../client';
import type { MunicipioConfig, CertificadoA1 } from '../../types';

// ============================================
// Rio de Janeiro Configuration (Nota Carioca)
// ============================================

export const RIO_DE_JANEIRO_CONFIG: MunicipioConfig = {
  codigo: '3304557',
  nome: 'Rio de Janeiro',
  uf: 'RJ',
  tipo: 'abrasf',
  versaoAbrasf: '2.04',
  endpoints: {
    producao: 'https://notacarioca.rio.gov.br/WSNacional/nfse.asmx',
    homologacao: 'https://homologacao.notacarioca.rio.gov.br/WSNacional/nfse.asmx',
  },
  particularidades: {
    soapAction: 'http://notacarioca.rio.gov.br',
  },
};

// ============================================
// Rio de Janeiro Adapter (Nota Carioca)
// ============================================

export class RioDeJaneiroAdapter extends AbrasfClient {
  constructor(
    certificado: CertificadoA1,
    ambiente: 'producao' | 'homologacao' = 'producao'
  ) {
    super(RIO_DE_JANEIRO_CONFIG, certificado, ambiente);
  }

  /**
   * Nota Carioca uses standard ABRASF 2.04 with specific SOAPAction
   */
  protected override getSoapAction(action: string): string {
    return `http://notacarioca.rio.gov.br/${action}`;
  }
}
