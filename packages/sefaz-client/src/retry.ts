import { logger } from '@fiscalzen/shared';

export interface RetryConfig {
    maxAttempts: number;
    backoffMultiplier: number; // For exponential backoff
    initialDelayMs: number;
    maxDelayMs: number;
}

export const defaultRetryConfig: RetryConfig = {
    maxAttempts: 3,
    backoffMultiplier: 2,
    initialDelayMs: 1000,
    maxDelayMs: 30000,
};

// Retryable Errors: Network issues or temporary downtime (108/109)
const retryableErrors = [
    'ECONNRESET',
    'ETIMEDOUT',
    'ECONNREFUSED',
    '108', // Serviço Paralisado Momentaneamente (Curto Prazo)
    '109', // Serviço Paralisado sem Previsão (Pode tentar)
    'Request timeout', // Custom error from client
    'socket hang up'
];

export function isRetryableError(error: any): boolean {
    if (!error) return false;

    const message = error.message || '';
    const code = error.code || '';

    return retryableErrors.some(retryCode =>
        message.includes(retryCode) || code.includes(retryCode)
    );
}

export async function withRetry<T>(
    fn: () => Promise<T>,
    config: RetryConfig = defaultRetryConfig,
    context: string = 'operation'
): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
        try {
            if (attempt > 1) {
                logger.debug({ attempt, context }, 'Retry attempt executing');
            }
            return await fn();
        } catch (error) {
            lastError = error;

            if (!isRetryableError(error) || attempt === config.maxAttempts) {
                throw error;
            }

            // Calculate Backoff
            const rawDelay = config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt - 1);
            const delay = Math.min(rawDelay, config.maxDelayMs);

            // Add Jitter (±20% randomness to avoid thundering herd)
            const jitter = delay * 0.2 * (Math.random() * 2 - 1);
            const finalDelay = Math.floor(Math.max(0, delay + jitter));

            logger.warn({
                attempt,
                context,
                delay: finalDelay,
                error: (error as Error).message
            }, 'Operation failed, retrying...');

            await sleep(finalDelay);
        }
    }

    throw lastError;
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
