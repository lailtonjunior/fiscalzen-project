import { AbrasfClient } from '../client';
import type { MunicipioConfig, CertificadoA1 } from '../../types';

// ============================================
// Belo Horizonte Configuration (BHISS Digital)
// ============================================

export const BELO_HORIZONTE_CONFIG: MunicipioConfig = {
  codigo: '3106200',
  nome: 'Belo Horizonte',
  uf: 'MG',
  tipo: 'abrasf',
  versaoAbrasf: '2.04',
  endpoints: {
    producao: 'https://bhissdigital.pbh.gov.br/bhiss-ws/nfse',
    homologacao: 'https://bhisshomologa.pbh.gov.br/bhiss-ws/nfse',
  },
};

// ============================================
// Belo Horizonte Adapter
// ============================================

export class BeloHorizonteAdapter extends AbrasfClient {
  constructor(
    certificado: CertificadoA1,
    ambiente: 'producao' | 'homologacao' = 'producao'
  ) {
    super(BELO_HORIZONTE_CONFIG, certificado, ambiente);
  }

  /**
   * BH uses standard ABRASF 2.04
   */
}
