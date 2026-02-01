import fp from 'fastify-plugin';
import metrics from '@fastify/metrics';
import { Counter, Histogram, Gauge } from 'prom-client';

// Métricas customizadas de Negócio e SEFAZ
export const sefazCallsTotal = new Counter({
    name: 'sefaz_calls_total',
    help: 'Total de chamadas realizadas para a SEFAZ',
    labelNames: ['operation', 'status'], // operation: distDFe, manifestacao; status: success, error
});

export const sefazCallsDuration = new Histogram({
    name: 'sefaz_calls_duration_seconds',
    help: 'Duração das chamadas SEFAZ em segundos',
    labelNames: ['operation'],
    buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
});

export const documentosProcessados = new Counter({
    name: 'documentos_processados_total',
    help: 'Total de documentos processados (importados/baixados)',
    labelNames: ['tipo', 'status'], // tipo: NFe, CTe; status: success, error
});

export const filaDocumentos = new Gauge({
    name: 'fila_documentos',
    help: 'Número atual de documentos na fila de processamento',
});

export const certificadosExpirando = new Gauge({
    name: 'certificados_expirando_soon',
    help: 'Número de certificados expirando nos próximos 30 dias',
});

// Circuit Breaker State (0=Closed/OK, 1=Open/Failure)
export const circuitBreakerState = new Gauge({
    name: 'circuit_breaker_state',
    help: 'Estado do Circuit Breaker (0=Closed, 1=Open, 0.5=Half-Open)',
    labelNames: ['name'],
});

export default fp(async (fastify) => {
    await fastify.register(metrics, {
        endpoint: '/metrics',
        defaultMetrics: {
            enabled: true, // CPU, Memory, GC, etc.
        },
        routeMetrics: {
            enabled: true, // HTTP request duration/count per route
            overrides: {
                histogram: {
                    buckets: [0.05, 0.1, 0.5, 1, 3, 5],
                },
            },
        },
    });
});
