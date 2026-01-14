import { AbrasfClient } from '../client.js';
import type { MunicipioConfig, CertificadoA1 } from '../../types.js';

// ============================================
// São Paulo Configuration
// ============================================

export const SAO_PAULO_CONFIG: MunicipioConfig = {
  codigo: '3550308',
  nome: 'Sao Paulo',
  uf: 'SP',
  tipo: 'abrasf',
  versaoAbrasf: '2.04',
  endpoints: {
    producao: 'https://nfe.prefeitura.sp.gov.br/ws/lotenfe.asmx',
    homologacao: 'https://nfeh.prefeitura.sp.gov.br/ws/lotenfe.asmx',
  },
  particularidades: {
    namespaceCustom: 'http://www.prefeitura.sp.gov.br/nfe',
    requiresInscricaoMunicipal: true,
    soapAction: 'http://www.prefeitura.sp.gov.br/nfe',
  },
};

// ============================================
// São Paulo Adapter
// ============================================

export class SaoPauloAdapter extends AbrasfClient {
  constructor(
    certificado: CertificadoA1,
    ambiente: 'producao' | 'homologacao' = 'producao'
  ) {
    super(SAO_PAULO_CONFIG, certificado, ambiente);
  }

  /**
   * São Paulo uses a different SOAP action format
   */
  protected override getSoapAction(action: string): string {
    const actionMap: Record<string, string> = {
      ConsultarNfseServicoTomado: 'ConsultaNFe',
      ConsultarNfseServicoPrestado: 'ConsultaNFe',
      ConsultarNfseFaixa: 'ConsultaNFe',
    };
    return `${this.config.particularidades?.soapAction}/${actionMap[action] || action}`;
  }

  /**
   * São Paulo specific XML structure
   */
  protected override buildSoapEnvelope(body: string, action: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
               xmlns:xsd="http://www.w3.org/2001/XMLSchema"
               xmlns:nfe="http://www.prefeitura.sp.gov.br/nfe">
  <soap:Body>
    <nfe:${this.getSaoPauloAction(action)}>
      <nfe:VersaoSchema>1</nfe:VersaoSchema>
      <nfe:MensagemXML>
        <![CDATA[${body}]]>
      </nfe:MensagemXML>
    </nfe:${this.getSaoPauloAction(action)}>
  </soap:Body>
</soap:Envelope>`;
  }

  private getSaoPauloAction(action: string): string {
    const actionMap: Record<string, string> = {
      ConsultarNfseServicoTomado: 'ConsultaNFeRequest',
      ConsultarNfseServicoPrestado: 'ConsultaNFeRequest',
      ConsultarNfseFaixa: 'ConsultaNFeRequest',
    };
    return actionMap[action] || action;
  }
}
