import { SefazClient } from '../client';
import { SEFAZ_URLS, UF_CODES } from '../constants';
import { buildSoapEnvelope, extractSoapBody } from '../soap/envelope';
import type { DistDFeRequest, SefazResponse } from '../types';

export interface DistDFeCTeDocument {
  nsu: string;
  schema: string;
  xml: string;
}

export interface DistDFeCTeResponse {
  cStat: string;
  xMotivo: string;
  ultNSU: string;
  maxNSU: string;
  documents: DistDFeCTeDocument[];
}

export class DistDFeCTe {
  private client: SefazClient;

  constructor(client: SefazClient) {
    this.client = client;
  }

  async consultar(request: DistDFeRequest): Promise<SefazResponse<DistDFeCTeResponse>> {
    const envKey = this.client.environment === 'production' ? 'production' : 'homologation';
    const url = SEFAZ_URLS.CTE.DISTDFE[envKey];

    const ufCode = UF_CODES[this.client.uf] || '35';
    const tpAmb = this.client.environment === 'production' ? '1' : '2';

    let distDFeInt = '';
    if (request.NSU) {
      distDFeInt = `<consNSU><NSU>${request.NSU.padStart(15, '0')}</NSU></consNSU>`;
    } else {
      const ultNSU = (request.ultNSU || '0').padStart(15, '0');
      distDFeInt = `<distNSU><ultNSU>${ultNSU}</ultNSU></distNSU>`;
    }

    const cteDadosMsg = `
      <distDFeInt xmlns="http://www.portalfiscal.inf.br/cte" versao="1.00">
        <tpAmb>${tpAmb}</tpAmb>
        <cUFAutor>${ufCode}</cUFAutor>
        <CNPJ>${this.client.cnpj}</CNPJ>
        ${distDFeInt}
      </distDFeInt>
    `.trim();

    const soapEnvelope = buildSoapEnvelope('cteDistDFeInteresse', cteDadosMsg);

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

  private parseResponse(xml: string): DistDFeCTeResponse {
    const cStat = this.extractValue(xml, 'cStat');
    const xMotivo = this.extractValue(xml, 'xMotivo');
    const ultNSU = this.extractValue(xml, 'ultNSU');
    const maxNSU = this.extractValue(xml, 'maxNSU');

    const documents: DistDFeCTeDocument[] = [];

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
        });
      } catch {
        // Skip invalid documents
      }
    }

    return {
      cStat,
      xMotivo,
      ultNSU,
      maxNSU,
      documents,
    };
  }

  private extractValue(xml: string, tag: string): string {
    const regex = new RegExp(`<${tag}>([^<]*)</${tag}>`, 'i');
    const match = xml.match(regex);
    return match ? match[1] : '';
  }
}
