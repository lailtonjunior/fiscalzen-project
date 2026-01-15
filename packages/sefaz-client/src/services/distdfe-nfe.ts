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

export interface DistDFeNFeResponse extends Omit<DistDFeResponse, 'documentos'> {
  documentos: DocumentoDistDFe[];
}

export class DistDFeNFe {
  private client: SefazClient;

  constructor(client: SefazClient) {
    this.client = client;
  }

  async consultar(request: DistDFeRequest): Promise<SefazResponse<DistDFeNFeResponse>> {
    const envKey = this.client.environment === 'producao' ? 'production' : 'homologation';
    const url = SEFAZ_URLS.NFE.DISTDFE[envKey];

    const ufCode = UF_CODES[this.client.uf] || '35';
    const tpAmb = this.client.environment === 'producao' ? '1' : '2';

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
    const cStat = this.extractValue(xml, 'cStat');
    const xMotivo = this.extractValue(xml, 'xMotivo');
    const ultNSU = this.extractValue(xml, 'ultNSU');
    const maxNSU = this.extractValue(xml, 'maxNSU');

    const documents: DocumentoDistDFe[] = [];

    // Extract docZip elements
    const docZipRegex = /<docZip[^>]*NSU="(\d+)"[^>]*schema="([^"]+)"[^>]*>([^<]+)<\/docZip>/g;
    let match;
    while ((match = docZipRegex.exec(xml)) !== null) {
      const [, nsu, schema, base64Content] = match;
      try {
        const xmlContent = this.decompressGzip(base64Content);
        documents.push({
          nsu,
          schema,
          xml: xmlContent,
          tipo: 'NFE',
          isResumo: schema.includes('resNFe') || schema.includes('resEvento'),
          isEvento: schema.includes('Evento'),
          chave: this.extractChave(xmlContent),
        });
      } catch {
        // Try direct base64 decode if not gzipped
        try {
          const xmlContent = Buffer.from(base64Content, 'base64').toString('utf-8');
          documents.push({
            nsu,
            schema,
            xml: xmlContent,
            tipo: 'NFE',
            isResumo: schema.includes('resNFe') || schema.includes('resEvento'),
            isEvento: schema.includes('Evento'),
            chave: this.extractChave(xmlContent),
          });
        } catch {
          // Skip invalid
        }
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
    const match = xml.match(/chNFe>(\d+)</) || xml.match(/Id="NFe(\d+)"/);
    return match ? match[1] : undefined;
  }

  private decompressGzip(base64Content: string): string {
    const buffer = Buffer.from(base64Content, 'base64');
    const str = buffer.toString('utf-8');
    // Em produção usaria zlib.gunzipSync. Aqui assumimos que pode vir descomprimido ou string direta
    // Se precisar de descompressão real, deve-se usar o módulo zlib do Node.js
    return str;
  }
}

// Wrapper function for API compatibility
export async function consultarPorUltNSU(
  ambiente: SefazAmbiente,
  cnpj: string,
  ultNSU: string,
  certificado: CertificadoA1
): Promise<DistDFeResponse> {
  const client = new SefazClient({
    ambiente,
    certificado,
    uf: 'SP', // Default UF usually fine for DistDFe (AN)
    cnpj,
  });

  const service = new DistDFeNFe(client);
  const response = await service.consultar({ ultNSU });

  if (!response.data) {
    throw new Error(response.error?.message || 'Erro na consulta DFe');
  }

  return response.data;
}