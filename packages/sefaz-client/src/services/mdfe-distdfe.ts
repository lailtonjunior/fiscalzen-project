import { SefazClient } from '../client';
import { SEFAZ_URLS, UF_CODES } from '../constants';
import { buildSoapEnvelope, extractSoapBody } from '../soap/envelope';
import type {
  DistDFeRequest,
  SefazResponse,
  DistDFeResponse,
  SefazAmbiente,
  CertificadoA1,
  DocumentoDistDFe,
} from '../types';

export interface DistDFeMDFeResponse extends Omit<DistDFeResponse, 'documentos'> {
  documentos: DocumentoDistDFe[];
}

export class DistDFeMDFe {
  private client: SefazClient;

  constructor(client: SefazClient) {
    this.client = client;
  }

  async consultar(request: DistDFeRequest): Promise<SefazResponse<DistDFeMDFeResponse>> {
    const envKey = this.client.environment === 'producao' ? 'production' : 'homologation';
    const url = SEFAZ_URLS.MDFE.DISTDFE[envKey];

    const ufCode = UF_CODES[this.client.uf] || '35';
    const tpAmb = this.client.environment === 'producao' ? '1' : '2';

    let distDFeInt = '';
    if (request.NSU) {
      distDFeInt = `<consNSU><NSU>${request.NSU.padStart(15, '0')}</NSU></consNSU>`;
    } else {
      const ultNSU = (request.ultNSU || '0').padStart(15, '0');
      distDFeInt = `<distNSU><ultNSU>${ultNSU}</ultNSU></distNSU>`;
    }

    const mdfeDadosMsg = `
      <distDFeInt xmlns="http://www.portalfiscal.inf.br/mdfe" versao="3.00">
        <tpAmb>${tpAmb}</tpAmb>
        <cUFAutor>${ufCode}</cUFAutor>
        <CNPJ>${this.client.cnpj}</CNPJ>
        ${distDFeInt}
      </distDFeInt>
    `.trim();

    const soapEnvelope = buildSoapEnvelope('mdfeDistDFeInteresse', mdfeDadosMsg);

    try {
      const responseXml = await this.client.request(url, soapEnvelope);
      const body = extractSoapBody(responseXml);

      const result = this.parseResponse(body);
      return {
        success: result.cStat === '137' || result.cStat === '138',
        data: result,
        rawXml: responseXml,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'REQUEST_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  private parseResponse(xml: string): DistDFeMDFeResponse {
    const cStat = this.extractValue(xml, 'cStat');
    const xMotivo = this.extractValue(xml, 'xMotivo');
    const ultNSU = this.extractValue(xml, 'ultNSU');
    const maxNSU = this.extractValue(xml, 'maxNSU');

    const documents: DocumentoDistDFe[] = [];

    const docZipRegex = /<docZip[^>]*NSU="(\d+)"[^>]*schema="([^"]+)"[^>]*>([^<]+)<\/docZip>/g;
    let match;
    while ((match = docZipRegex.exec(xml)) !== null) {
      const [, nsu, schema, base64Content] = match;
      try {
        const xmlContent = Buffer.from(base64Content, 'base64').toString('utf-8');
        documents.push({
          nsu,
          schema,
          xml: xmlContent,
          tipo: 'MDFE',
          isResumo: schema.includes('resMDFe') || schema.includes('resEvento'),
          isEvento: schema.includes('Evento'),
          chave: this.extractChave(xmlContent),
        });
      } catch {
        // Skip
      }
    }

    return {
      sucesso: cStat === '137' || cStat === '138',
      cStat,
      xMotivo,
      ultNSU,
      maxNSU,
      documentos: documents,
    };
  }

  private extractValue(xml: string, tag: string): string {
    const regex = new RegExp(`<${tag}>([^<]*)</${tag}>`, 'i');
    const match = xml.match(regex);
    return match ? match[1] : '';
  }

  private extractChave(xml: string): string | undefined {
    const match = xml.match(/chMDFe>(\d+)</) || xml.match(/Id="MDFe(\d+)"/);
    return match ? match[1] : undefined;
  }
}

// Wrapper function for API compatibility
export async function consultarMDFePorUltNSU(
  ambiente: SefazAmbiente,
  cnpj: string,
  ultNSU: string,
  certificado: CertificadoA1
): Promise<DistDFeResponse> {
  const client = new SefazClient({
    ambiente,
    certificado,
    uf: 'SP',
    cnpj,
  });

  const service = new DistDFeMDFe(client);
  const response = await service.consultar({ ultNSU });

  if (!response.data) {
    throw new Error(response.error?.message || 'Erro na consulta MDFe');
  }

  return response.data;
}