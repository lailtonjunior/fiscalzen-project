# FiscalZen Observability Skill

Skill especializada para implementação de observabilidade completa no FiscalZen.

## Contexto

O FiscalZen precisa de observabilidade de nível empresarial para operação em produção.

## Pilares de Observabilidade

```
┌─────────────────────────────────────────────────────────┐
│                    OBSERVABILITY                        │
├─────────────┬─────────────┬─────────────┬───────────────┤
│    Logs     │  Métricas   │   Tracing   │   Alertas     │
│  (Pino)     │(Prometheus) │(OpenTelemetry)│(AlertManager)│
└─────────────┴─────────────┴─────────────┴───────────────┘
```

## Onde Mexer

```
fiscalzen-project/
├── apps/api/src/
│   ├── config/
│   │   ├── logger.ts           # Configuração Pino
│   │   ├── metrics.ts          # Métricas customizadas
│   │   └── tracing.ts          # OpenTelemetry
│   ├── plugins/
│   │   └── metrics.ts          # Plugin Fastify metrics
│   └── jobs/
│       └── metrics-reporter.ts # Reporter periódico
├── docker/
│   ├── prometheus/
│   │   ├── prometheus.yml      # Config Prometheus
│   │   └── alert-rules.yml     # Regras de alerta
│   ├── grafana/
│   │   └── dashboards/         # Dashboards JSON
│   └── docker-compose.yml      # Adicionar serviços
└── package.json                # Scripts de verificação
```

## Gates Obrigatórios

1. **Logs estruturados**
   - Correlation ID em todas as requisições
   - Nunca logar dados sensíveis
   - Níveis apropriados (debug, info, warn, error)

2. **Métricas**
   - HTTP: requests, latency, errors
   - Negócio: documentos, empresas, certificados
   - Infra: CPU, memória, conexões

3. **Tracing**
   - Spans para operações críticas
   - Propagação de contexto
   - Sampling configurável

4. **Alertas**
   - Acionáveis (actionable)
   - Prioridade adequada
   - Runbooks associados

## Métricas Obrigatórias

### HTTP
```typescript
http_requests_total{method, route, status}
http_request_duration_seconds{method, route}
http_request_size_bytes{method, route}
http_response_size_bytes{method, route}
```

### Negócio
```typescript
documentos_processados_total{tipo, status}
documentos_na_fila
documentos_processamento_duration_seconds
empresas_ativas
certificados_ativos
certificados_expirando_soon
```

### SEFAZ
```typescript
sefaz_calls_total{operation, status}
sefaz_calls_duration_seconds{operation}
sefaz_circuit_breaker_state
sefaz_retry_attempts_total
```

### Infra
```typescript
nodejs_heap_size_used_bytes
nodejs_event_loop_lag_seconds
db_connections_active
db_connections_idle
redis_connections_active
```

## Templates

### Logger Config

```typescript
// apps/api/src/config/logger.ts
import pino from 'pino'

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' 
    ? { target: 'pino-pretty' }
    : undefined,
  base: {
    service: 'fiscalzen-api',
    version: process.env.npm_package_version,
    environment: process.env.NODE_ENV,
  },
  redact: {
    paths: [
      'password',
      'token',
      'authorization',
      '*.pfx',
      '*.key',
      'cert_password',
      'cert_encryption_key',
    ],
    remove: true,
  },
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
})

// Middleware para correlation ID
export function requestLogger(app: FastifyInstance) {
  app.addHook('onRequest', async (request, reply) => {
    const requestId = request.headers['x-request-id'] || randomUUID()
    
    request.log = logger.child({
      requestId,
      userId: request.user?.id,
      companyId: request.user?.companyId,
      path: request.url,
      method: request.method,
    })
    
    reply.header('x-request-id', requestId)
  })
  
  app.addHook('onResponse', async (request, reply) => {
    request.log.info({
      statusCode: reply.statusCode,
      responseTime: reply.elapsedTime,
    }, 'request completed')
  })
}
```

### Métricas Config

```typescript
// apps/api/src/config/metrics.ts
import { Counter, Histogram, Gauge, register } from 'prom-client'

// HTTP metrics
export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
})

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration',
  labelNames: ['method', 'route'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
})

// Business metrics
export const documentosProcessados = new Counter({
  name: 'documentos_processados_total',
  help: 'Total de documentos processados',
  labelNames: ['tipo', 'status'],
})

export const filaDocumentos = new Gauge({
  name: 'documentos_na_fila',
  help: 'Documentos aguardando processamento',
})

export const certificadosExpirando = new Gauge({
  name: 'certificados_expirando_soon',
  help: 'Certificados expirando em 30 dias',
})

// SEFAZ metrics
export const sefazCallsTotal = new Counter({
  name: 'sefaz_calls_total',
  help: 'Total de chamadas SEFAZ',
  labelNames: ['operation', 'status'],
})

export const sefazCallsDuration = new Histogram({
  name: 'sefaz_calls_duration_seconds',
  help: 'Duração das chamadas SEFAZ',
  labelNames: ['operation'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
})

export const circuitBreakerState = new Gauge({
  name: 'sefaz_circuit_breaker_state',
  help: 'Estado do circuit breaker (0=closed, 1=open, 2=half-open)',
  labelNames: ['name'],
})

// Export registry
export { register }
```

### Tracing Config

```typescript
// apps/api/src/config/tracing.ts
import { NodeSDK } from '@opentelemetry/sdk-node'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { JaegerExporter } from '@opentelemetry/exporter-jaeger'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { Resource } from '@opentelemetry/resources'
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'

const isProduction = process.env.NODE_ENV === 'production'

const exporter = isProduction
  ? new OTLPTraceExporter({
      url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
    })
  : new JaegerExporter({
      endpoint: process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces',
    })

const sdk = new NodeSDK({
  traceExporter: exporter,
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': { enabled: false },
      '@opentelemetry/instrumentation-net': { enabled: true },
      '@opentelemetry/instrumentation-http': { enabled: true },
    }),
  ],
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'fiscalzen-api',
    [SemanticResourceAttributes.SERVICE_VERSION]: process.env.npm_package_version,
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV,
  }),
})

sdk.start()

process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('Tracing terminated'))
    .catch((err) => console.error('Error terminating tracing', err))
    .finally(() => process.exit(0))
})
```

### Alert Rules

```yaml
# docker/prometheus/alert-rules.yml
groups:
  - name: fiscalzen-alerts
    rules:
      - alert: HighErrorRate
        expr: |
          (
            sum(rate(http_requests_total{status=~"5.."}[5m]))
            /
            sum(rate(http_requests_total[5m]))
          ) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Taxa de erro alta: {{ $value | humanizePercentage }}"
          description: "Taxa de erro 5xx acima de 5% nos últimos 5 minutos"
          runbook_url: "https://wiki.fiscalzen.com/runbooks/high-error-rate"

      - alert: HighLatency
        expr: |
          histogram_quantile(0.95,
            sum(rate(http_request_duration_seconds_bucket[5m])) by (le)
          ) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Latência alta: {{ $value }}s"
          description: "P95 de latência acima de 2 segundos"

      - alert: SefazCircuitBreakerOpen
        expr: sefaz_circuit_breaker_state{name="sefaz"} == 1
        for: 10m
        labels:
          severity: critical
        annotations:
          summary: "Circuit breaker SEFAZ aberto"
          description: "Circuit breaker está aberto há mais de 10 minutos"

      - alert: QueueBackedUp
        expr: documentos_na_fila > 1000
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Fila de documentos acumulada"
          description: "{{ $value }} documentos na fila"

      - alert: CertificatesExpiring
        expr: certificados_expirando_soon > 0
        for: 1h
        labels:
          severity: warning
        annotations:
          summary: "Certificados próximos da expiração"
          description: "{{ $value }} certificados expiram em breve"

      - alert: DatabaseConnectionsHigh
        expr: |
          db_connections_active / (db_connections_active + db_connections_idle) > 0.8
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Conexões de banco altas"
          description: "Mais de 80% das conexões em uso"
```

## Comandos de Verificação

```bash
# Verificar métricas
curl http://localhost:3001/metrics

# Verificar health
curl http://localhost:3001/health

# Verificar Jaeger UI
open http://localhost:16686

# Verificar Grafana
open http://localhost:3003

# Verificar Prometheus
open http://localhost:9090
```

## Checklist de Implementação

- [ ] Logger estruturado configurado
- [ ] Correlation ID em todas as requisições
- [ ] Métricas Prometheus expostas
- [ ] Tracing OpenTelemetry funcionando
- [ ] Dashboards Grafana criados
- [ ] Alertas configurados
- [ ] Runbooks documentados
- [ ] Testes de carga realizados
