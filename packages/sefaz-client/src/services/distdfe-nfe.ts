import { SefazClient } from '../client';
import { SEFAZ_URLS, UF_CODES } from '../constants';
import { buildSoapEnvelope, extractSoapBody } from '../soap/envelope';
import type { DistDFeRequest, DocumentoZip, SefazResponse } from '../types';

export interface DistDFeNFeDocument {
  nsu: string;
  schema: string;
  xml: string;
}

export interface DistDFeNFeResponse {
  cStat: string;
  xMotivo: string;
  ultNSU: string;
  maxNSU: string;
  documents: DistDFeNFeDocument[];
}

export class DistDFeNFe {
  private client: SefazClient;

  constructor(client: SefazClient) {
    this.client = client;
  }

  async consultar(request: DistDFeRequest): Promise<SefazResponse<DistDFeNFeResponse>> {
    const envKey = this.client.environment === 'production' ? 'production' : 'homologation';
    const url = SEFAZ_URLS.NFE.DISTDFE[envKey];

    const ufCode = UF_CODES[this.client.uf] || '35';
    const tpAmb = this.client.environment === 'production' ? '1' : '2';

    let distDFeInt = '';
    if (request.chNFe) {
      distDFeInt = `<consChNFe><chNFe>${request.chNFe}</chNFe></consChNFe>`;
    } else if (request.NSU) {
      distDFeInt = `<consNSU><NSU>${request.NSU.padStart(15, '0')}</NSU></consNSU>`;
    } else {
      const ultNSU = (request.ultNSU || '0').padStart(15, '0');
      distDFeInt = `<distNSU><ultNSU>${ultNSU}</ultNSU></distNSU>`;
    }

    const nfeDadosMsg = `
      <distDFeInt xmlns="http://www.portalfiscal.inf.br/nfe" versao="1.01">
        <tpAmb>${tpAmb}</tpAmb>
        <cUFAutor>${ufCode}</cUFAutor>
        <CNPJ>${this.client.cnpj}</CNPJ>
        ${distDFeInt}
      </distDFeInt>
    `.trim();

    const soapEnvelope = buildSoapEnvelope('nfeDistDFeInteresse', nfeDadosMsg);

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

  private parseResponse(xml: string): DistDFeNFeResponse {
    // Simple XML parsing - in production, use a proper parser
    const cStat = this.extractValue(xml, 'cStat');
    const xMotivo = this.extractValue(xml, 'xMotivo');
    const ultNSU = this.extractValue(xml, 'ultNSU');
    const maxNSU = this.extractValue(xml, 'maxNSU');

    const documents: DistDFeNFeDocument[] = [];

    // Extract docZip elements
    const docZipRegex = /<docZip[^>]*NSU="(\d+)"[^>]*schema="([^"]+)"[^>]*>([^<]+)<\/docZip>/g;
    let match;
    while ((match = docZipRegex.exec(xml)) !== null) {
      const [, nsu, schema, base64Content] = match;
      try {
        // Decompress and decode the content
        const xmlContent = this.decompressGzip(base64Content);
        documents.push({
          nsu,
          schema,
          xml: xmlContent,
        });
      } catch {
        // If decompression fails, try direct base64 decode
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

  private decompressGzip(base64Content: string): string {
    const buffer = Buffer.from(base64Content, 'base64');
    // Note: In production, use zlib.gunzipSync
    // For now, return as-is if it's already decompressed
    const str = buffer.toString('utf-8');
    if (str.startsWith('<?xml') || str.startsWith('<')) {
      return str;
    }
    // Attempt gzip decompression would go here
    return str;
  }
}
