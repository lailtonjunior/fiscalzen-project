import { SefazClient } from '../client';
import { SEFAZ_URLS } from '../constants';
import { buildSoapEnvelope, extractSoapBody } from '../soap/envelope';
import type { SefazResponse } from '../types';

export interface ConsultaProtocoloRequest {
  chave: string;
}

export interface ConsultaProtocoloResponse {
  cStat: string;
  xMotivo: string;
  chNFe: string;
  nProt?: string;
  digVal?: string;
  dhRecbto?: string;
}

export class ConsultaProtocolo {
  private client: SefazClient;

  constructor(client: SefazClient) {
    this.client = client;
  }

  async consultar(request: ConsultaProtocoloRequest): Promise<SefazResponse<ConsultaProtocoloResponse>> {
    const envKey = this.client.environment === 'producao' ? 'production' : 'homologation';
    const url = SEFAZ_URLS.NFE.CONSULTA[envKey];

    const tpAmb = this.client.environment === 'producao' ? '1' : '2';

    const consultaXml = `
      <consSitNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
        <tpAmb>${tpAmb}</tpAmb>
        <xServ>CONSULTAR</xServ>
        <chNFe>${request.chave}</chNFe>
      </consSitNFe>
    `.trim();

    const soapEnvelope = buildSoapEnvelope('nfeConsultaNF', consultaXml);

    try {
      const responseXml = await this.client.request(url, soapEnvelope);
      const body = extractSoapBody(responseXml);

      const result = this.parseResponse(body, request.chave);
      return {
        success: result.cStat === '100' || result.cStat === '101', // 100=Autorizada, 101=Cancelada
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

  private parseResponse(xml: string, chNFe: string): ConsultaProtocoloResponse {
    const cStat = this.extractValue(xml, 'cStat');
    const xMotivo = this.extractValue(xml, 'xMotivo');
    const nProt = this.extractValue(xml, 'nProt');
    const digVal = this.extractValue(xml, 'digVal');
    const dhRecbto = this.extractValue(xml, 'dhRecbto');

    return {
      cStat,
      xMotivo,
      chNFe,
      nProt: nProt || undefined,
      digVal: digVal || undefined,
      dhRecbto: dhRecbto || undefined,
    };
  }

  private extractValue(xml: string, tag: string): string {
    const regex = new RegExp(`<${tag}>([^<]*)</${tag}>`, 'i');
    const match = xml.match(regex);
    return match ? match[1] : '';
  }
}