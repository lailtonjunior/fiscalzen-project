import { logger } from '@fiscalzen/shared';
import { EventEmitter } from 'events';

export enum CircuitState {
    CLOSED = 'CLOSED',       // Normal operation
    OPEN = 'OPEN',           // Failing, reject calls
    HALF_OPEN = 'HALF_OPEN', // Testing if recovered
}

export interface CircuitBreakerConfig {
    failureThreshold: number;
    resetTimeoutMs: number;
    halfOpenMaxCalls: number;
}

export const defaultCircuitConfig: CircuitBreakerConfig = {
    failureThreshold: 5,
    resetTimeoutMs: 60000,
    halfOpenMaxCalls: 3,
};

export class CircuitBreaker extends EventEmitter {
    private state: CircuitState = CircuitState.CLOSED;
    private failureCount = 0;
    private successCount = 0;
    private nextAttempt = Date.now();
    private halfOpenCalls = 0;

    constructor(
        private name: string,
        private config: CircuitBreakerConfig = defaultCircuitConfig
    ) {
        super();
    }

    async execute<T>(fn: () => Promise<T>): Promise<T> {
        if (this.state === CircuitState.OPEN) {
            if (Date.now() < this.nextAttempt) {
                throw new CircuitBreakerError(
                    `Circuit breaker '${this.name}' is OPEN`
                );
            }
            this.state = CircuitState.HALF_OPEN;
            this.halfOpenCalls = 0;
            logger.info({ breaker: this.name }, 'Circuit breaker entering HALF_OPEN');
            this.emit('halfOpen');
        }

        if (this.state === CircuitState.HALF_OPEN) {
            if (this.halfOpenCalls >= this.config.halfOpenMaxCalls) {
                throw new CircuitBreakerError(
                    `Circuit breaker '${this.name}' half-open limit reached. Waiting for current probes.`
                );
            }
            this.halfOpenCalls++;
        }

        try {
            const result = await fn();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure();
            throw error;
        }
    }

    private onSuccess() {
        this.failureCount = 0;

        if (this.state === CircuitState.HALF_OPEN) {
            this.successCount++;
            if (this.successCount >= this.config.halfOpenMaxCalls) {
                this.state = CircuitState.CLOSED;
                this.successCount = 0;
                this.halfOpenCalls = 0;
                logger.info({ breaker: this.name }, 'Circuit breaker CLOSED (Recovered)');
                this.emit('closed');
            }
        }
    }

    private onFailure() {
        this.failureCount++;

        if (this.state !== CircuitState.OPEN && this.failureCount >= this.config.failureThreshold) {
            this.state = CircuitState.OPEN;
            this.nextAttempt = Date.now() + this.config.resetTimeoutMs;
            logger.error({
                breaker: this.name,
                failures: this.failureCount,
                retryAfter: this.config.resetTimeoutMs
            }, 'Circuit breaker OPENED');
            this.emit('open');
        }
    }

    getState(): CircuitState {
        return this.state;
    }
}

export class CircuitBreakerError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'CircuitBreakerError';
    }
}
