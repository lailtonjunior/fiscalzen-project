import { logger } from './logger';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { resourceFromAttributes } from '@opentelemetry/resources';

let tracingSdk: NodeSDK | undefined;

const isEnabled = (value: string | undefined) => value === 'true' || value === '1';

export const startTracing = () => {
    if (!isEnabled(process.env.ENABLE_TRACING)) {
        logger.info('OpenTelemetry tracing disabled (ENABLE_TRACING is not true)');
        return;
    }

    if (tracingSdk) {
        return;
    }

    try {
        const traceExporter = process.env.JAEGER_ENDPOINT
            ? new JaegerExporter({ endpoint: process.env.JAEGER_ENDPOINT })
            : undefined;

        tracingSdk = new NodeSDK({
            resource: resourceFromAttributes({
                'service.name': 'fiscalzen-api',
                'service.version': process.env.npm_package_version ?? '0.1.0',
                'deployment.environment': process.env.NODE_ENV ?? 'development',
            }),
            traceExporter,
            instrumentations: [getNodeAutoInstrumentations()],
        });

        tracingSdk.start();
        logger.info(
            { exporter: traceExporter ? 'jaeger' : 'default' },
            'OpenTelemetry tracing enabled'
        );
    } catch (err) {
        tracingSdk = undefined;
        logger.warn({ err }, 'OpenTelemetry tracing failed to start; continuing without tracing');
    }
};

export const stopTracing = async () => {
    if (!tracingSdk) {
        return;
    }

    try {
        await tracingSdk.shutdown();
        logger.info('OpenTelemetry tracing stopped');
    } catch (err) {
        logger.warn({ err }, 'OpenTelemetry tracing failed to stop cleanly');
    } finally {
        tracingSdk = undefined;
    }
};

startTracing();
