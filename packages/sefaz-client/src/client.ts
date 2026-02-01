import * as https from 'https';
import type { SefazClientConfig, SefazAmbiente } from './types';
import { CircuitBreaker } from './circuit-breaker';
import { withRetry } from './retry';

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
  private circuitBreaker: CircuitBreaker;

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

    this.circuitBreaker = new CircuitBreaker('sefaz-soap', {
      failureThreshold: 5,
      resetTimeoutMs: 60000,
      halfOpenMaxCalls: 3
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

    // Wrap the request logic in CircuitBreaker -> Retry
    return this.circuitBreaker.execute(() =>
      withRetry(
        () => this.doRequest(url, soapEnvelope),
        {
          maxAttempts: this.config.retryAttempts || 3,
          initialDelayMs: this.config.retryDelay || 1000,
          backoffMultiplier: 2,
          maxDelayMs: 30000
        },
        `SefazClient.request(${url})`
      )
    );
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
            // Include status code in error message for retry checking
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