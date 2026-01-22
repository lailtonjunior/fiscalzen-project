import * as https from 'https';
import type { SefazClientConfig, SefazAmbiente } from './types';

// Logger interface for optional logging
export interface SefazLogger {
  warn: (message: string, context?: Record<string, unknown>) => void;
  info: (message: string, context?: Record<string, unknown>) => void;
}

// No-op logger for when no logger is provided
const noopLogger: SefazLogger = {
  warn: () => { },
  info: () => { },
};

export class SefazClient {
  private config: SefazClientConfig;
  private httpsAgent: https.Agent;
  private logger: SefazLogger;
  private disposed = false;

  constructor(config: SefazClientConfig, logger?: SefazLogger) {
    this.config = {
      timeout: 60000,
      retryAttempts: 3,
      retryDelay: 1000,
      ...config,
    };
    this.logger = logger || noopLogger;

    this.httpsAgent = new https.Agent({
      pfx: config.certificado.pfxBuffer,
      passphrase: config.certificado.password,
      rejectUnauthorized: true,
    });
  }

  get environment(): SefazAmbiente {
    return this.config.ambiente;
  }

  get uf(): string {
    return this.config.uf;
  }

  get cnpj(): string {
    return this.config.cnpj || this.config.certificado.cnpj || '';
  }

  get agent(): https.Agent {
    return this.httpsAgent;
  }

  get timeout(): number {
    return this.config.timeout || 60000;
  }

  /**
   * Destroys the HTTPS agent and releases resources.
   * Call this when the client is no longer needed.
   */
  dispose(): void {
    if (!this.disposed) {
      this.httpsAgent.destroy();
      this.disposed = true;
      this.logger.info('SefazClient disposed', { uf: this.uf, cnpj: this.cnpj });
    }
  }

  async request(url: string, soapEnvelope: string): Promise<string> {
    if (this.disposed) {
      throw new Error('SefazClient has been disposed');
    }

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
          this.logger.warn(`SEFAZ request failed, retrying...`, {
            attempt,
            maxAttempts: attempts,
            delayMs: delay,
            error: lastError.message,
            url,
          });
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