import * as https from 'https';
import type { SefazConfig, SefazEnvironment } from './types';

export class SefazClient {
  private config: SefazConfig;
  private httpsAgent: https.Agent;

  constructor(config: SefazConfig) {
    this.config = {
      timeout: 60000,
      retryAttempts: 3,
      retryDelay: 1000,
      ...config,
    };

    this.httpsAgent = new https.Agent({
      pfx: config.certificate.pfx,
      passphrase: config.certificate.password,
      rejectUnauthorized: true,
    });
  }

  get environment(): SefazEnvironment {
    return this.config.environment;
  }

  get uf(): string {
    return this.config.uf;
  }

  get cnpj(): string {
    return this.config.cnpj;
  }

  get agent(): https.Agent {
    return this.httpsAgent;
  }

  get timeout(): number {
    return this.config.timeout || 60000;
  }

  async request(url: string, soapEnvelope: string): Promise<string> {
    let lastError: Error | null = null;
    const attempts = this.config.retryAttempts || 3;

    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        const response = await this.doRequest(url, soapEnvelope);
        return response;
      } catch (error) {
        lastError = error as Error;
        if (attempt < attempts) {
          const delay = (this.config.retryDelay || 1000) * Math.pow(2, attempt - 1);
          await this.sleep(delay);
        }
      }
    }

    throw lastError || new Error('Request failed after retries');
  }

  private doRequest(url: string, soapEnvelope: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);

      const options: https.RequestOptions = {
        hostname: urlObj.hostname,
        port: 443,
        path: urlObj.pathname,
        method: 'POST',
        agent: this.httpsAgent,
        timeout: this.config.timeout,
        headers: {
          'Content-Type': 'application/soap+xml; charset=utf-8',
          'Content-Length': Buffer.byteLength(soapEnvelope, 'utf-8'),
        },
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.write(soapEnvelope);
      req.end();
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
