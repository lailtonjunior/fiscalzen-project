// ============================================
// SOAP Client para Web Services SEFAZ
// ============================================
// Cliente HTTP com suporte a certificado mTLS

import axios, { AxiosInstance, AxiosError } from 'axios';
import https from 'https';
import type { CertificadoA1, SoapEnvelope, SoapResponse, SefazClientConfig } from './types';
import { SefazError, TimeoutError } from './types';
import { loadCertificadoCached } from './certificate';
import { XML_NAMESPACES } from './constants/endpoints';

// ============================================
// Tipos
// ============================================

export interface SoapClientOptions {
  certificado: CertificadoA1;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

// ============================================
// SOAP Client Class
// ============================================

export class SoapClient {
  private axiosInstance: AxiosInstance;
  private config: Required<SoapClientOptions>;

  constructor(options: SoapClientOptions) {
    this.config = {
      certificado: options.certificado,
      timeout: options.timeout ?? 30000,
      retryAttempts: options.retryAttempts ?? 3,
      retryDelay: options.retryDelay ?? 1000,
    };

    this.axiosInstance = this.createAxiosInstance();
  }

  /**
   * Cria instância do Axios com certificado mTLS
   */
  private createAxiosInstance(): AxiosInstance {
    const { certificado, timeout } = this.config;
    const { privateKey, pem } = loadCertificadoCached(certificado);

    // Exporta a chave privada em formato PEM
    const privateKeyPem = privateKey.export({
      type: 'pkcs8',
      format: 'pem',
    }) as string;

    // Cria agente HTTPS com certificado cliente
    const httpsAgent = new https.Agent({
      cert: pem,
      key: privateKeyPem,
      rejectUnauthorized: true, // Valida certificado do servidor
      keepAlive: true,
      keepAliveMsecs: 10000,
    });

    return axios.create({
      timeout,
      httpsAgent,
      headers: {
        'Content-Type': 'application/soap+xml; charset=utf-8',
        Accept: 'application/soap+xml',
      },
    });
  }

  /**
   * Envia requisição SOAP
   */
  async send(url: string, envelope: SoapEnvelope): Promise<SoapResponse> {
    const soapXml = this.buildSoapEnvelope(envelope);
    const headers = {
      'Content-Type': `application/soap+xml; charset=utf-8; action="${envelope.action}"`,
      SOAPAction: envelope.action,
    };

    return this.executeWithRetry(async () => {
      try {
        const response = await this.axiosInstance.post(url, soapXml, { headers });

        return {
          statusCode: response.status,
          body: response.data,
          headers: response.headers as Record<string, string>,
        };
      } catch (error) {
        if (axios.isAxiosError(error)) {
          return this.handleAxiosError(error);
        }
        throw error;
      }
    });
  }

  /**
   * Constrói o envelope SOAP 1.2
   */
  private buildSoapEnvelope(envelope: SoapEnvelope): string {
    const namespace = envelope.namespace ?? XML_NAMESPACES.nfe;

    return `<?xml version="1.0" encoding="UTF-8"?>
<soap12:Envelope xmlns:soap12="${XML_NAMESPACES.soap}" xmlns:nfe="${namespace}">
  <soap12:Header/>
  <soap12:Body>
    ${envelope.body}
  </soap12:Body>
</soap12:Envelope>`;
  }

  /**
   * Executa com retry e exponential backoff
   */
  private async executeWithRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Não faz retry para erros de validação ou negócio
        if (this.isNonRetryableError(lastError)) {
          throw lastError;
        }

        // Exponential backoff
        if (attempt < this.config.retryAttempts) {
          const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
          await this.sleep(delay);
        }
      }
    }

    throw lastError;
  }

  /**
   * Verifica se erro não deve ter retry
   */
  private isNonRetryableError(error: Error): boolean {
    // Erros de certificado não devem ter retry
    if (error.message.includes('certificate')) {
      return true;
    }

    // Erros de validação XML
    if (error.message.includes('XML') || error.message.includes('schema')) {
      return true;
    }

    return false;
  }

  /**
   * Trata erros do Axios
   */
  private handleAxiosError(error: AxiosError): never {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      throw new TimeoutError(`Timeout após ${this.config.timeout}ms`);
    }

    if (error.response) {
      // Erro com resposta do servidor
      const { status, data } = error.response;

      throw new SefazError(
        `Erro SEFAZ: HTTP ${status}`,
        String(status),
        undefined,
        typeof data === 'string' ? data : JSON.stringify(data)
      );
    }

    if (error.request) {
      // Erro de conexão (sem resposta)
      throw new SefazError(
        `Erro de conexão: ${error.message}`,
        'NETWORK_ERROR'
      );
    }

    throw new SefazError(`Erro inesperado: ${error.message}`, 'UNKNOWN');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ============================================
// Funções utilitárias para XML
// ============================================

/**
 * Extrai conteúdo do Body do SOAP Response
 */
export function extractSoapBody(soapResponse: string): string {
  // Remove namespaces para facilitar parsing
  const match = soapResponse.match(/<(?:\w+:)?Body[^>]*>([\s\S]*?)<\/(?:\w+:)?Body>/i);

  if (!match) {
    throw new SefazError('Body do SOAP não encontrado na resposta', 'PARSE_ERROR');
  }

  return match[1].trim();
}

/**
 * Extrai elemento específico do XML
 */
export function extractElement(xml: string, tagName: string): string | null {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : null;
}

/**
 * Extrai atributo de elemento
 */
export function extractAttribute(xml: string, tagName: string, attrName: string): string | null {
  const regex = new RegExp(`<${tagName}[^>]*\\s${attrName}="([^"]*)"`, 'i');
  const match = xml.match(regex);
  return match ? match[1] : null;
}

/**
 * Extrai todos os elementos com determinada tag
 */
export function extractAllElements(xml: string, tagName: string): string[] {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'gi');
  const matches: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(xml)) !== null) {
    matches.push(match[1].trim());
  }

  return matches;
}

/**
 * Extrai valor de tag simples
 */
export function extractTagValue(xml: string, tagName: string): string | null {
  const regex = new RegExp(`<${tagName}>([^<]*)<\\/${tagName}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : null;
}

// ============================================
// Factory
// ============================================

/**
 * Cria cliente SOAP a partir da configuração
 */
export function createSoapClient(config: SefazClientConfig): SoapClient {
  return new SoapClient({
    certificado: config.certificado,
    timeout: config.timeout,
    retryAttempts: config.retryAttempts,
    retryDelay: config.retryDelay,
  });
}
