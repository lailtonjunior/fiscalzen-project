import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { Resource } from '@opentelemetry/resources';
import { semanticConventions } from '@opentelemetry/semantic-conventions';
import { logger } from './logger';

// Do not start tracing in test environments to avoid port conflicts or noise
if (process.env.NODE_ENV !== 'test') {
    const sdk = new NodeSDK({
        traceExporter: new JaegerExporter({
            endpoint: process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces',
        }),
        instrumentations: [
            getNodeAutoInstrumentations({
                // Disable filesystem tracing as it's too noisy
                '@opentelemetry/instrumentation-fs': { enabled: false },
                '@opentelemetry/instrumentation-pino': { enabled: true },
                '@opentelemetry/instrumentation-fastify': { enabled: true },
                '@opentelemetry/instrumentation-http': { enabled: true },
            }),
        ],
        resource: new Resource({
            [semanticConventions.SERVICE_NAME]: 'fiscalzen-api',
            [semanticConventions.SERVICE_VERSION]: process.env.npm_package_version || '1.0.0',
            environment: process.env.NODE_ENV || 'development',
        }),
    });

    sdk.start()
        .then(() => logger.info('Tracing initialized'))
        .catch((error) => logger.error({ error: error.message }, 'Error initializing tracing'));

    process.on('SIGTERM', () => {
        sdk.shutdown()
            .then(() => logger.info('Tracing terminated'))
            .catch((error) => logger.error({ error: error.message }, 'Error terminating tracing'));
    });
}
