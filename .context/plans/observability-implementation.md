# Plano: Implementar Observabilidade Completa

## Tarefas Sequenciais (Execute uma por vez)

### Tarefa 1: Logger Estruturado
```
@clawdbot implement: Logger Pino estruturado

ARQUIVOS:
- apps/api/src/config/logger.ts (criar/atualizar)
- apps/api/src/app.ts (integrar)

REQUISITOS:
- Usar Pino com pino-pretty em dev
- Redact de secrets (password, token, pfx, key)
- Correlation ID por request
- Base metadata (service, version)
```

### Tarefa 2: Metricas Prometheus
```
@clawdbot implement: Metricas customizadas Prometheus

INSTALAR:
pnpm add prom-client @fastify/metrics

CRIAR:
- apps/api/src/plugins/metrics.ts

METRICAS:
- sefaz_calls_total (Counter)
- sefaz_calls_duration_seconds (Histogram)
- documentos_processados_total (Counter)
- fila_documentos (Gauge)
- certificados_expirando (Gauge)

EXPOR:
- GET /metrics
```

### Tarefa 3: Tracing OpenTelemetry
```
@clawdbot implement: OpenTelemetry com Jaeger

INSTALAR:
pnpm add @opentelemetry/api @opentelemetry/sdk-node
pnpm add @opentelemetry/auto-instrumentations-node
pnpm add @opentelemetry/exporter-jaeger

CRIAR:
- apps/api/src/config/tracing.ts

CONFIGURAR:
- Auto-instrumentacao (exceto fs)
- Exporter Jaeger (env JAEGER_ENDPOINT)
- Resource com service.name e version
```

### Tarefa 4: Docker Compose Observability Stack
```
@clawdbot implement: Stack de observabilidade Docker

ADICIONAR AO docker-compose.yml:
- prometheus (prom/prometheus)
- grafana (grafana/grafana)
- jaeger (jaegertracing/all-in-one)

CRIAR:
- docker/prometheus/prometheus.yml
- docker/prometheus/alert-rules.yml
```

### Tarefa 5: Alertas Prometheus
```
@clawdbot implement: Regras de alerta Prometheus

CRIAR: docker/prometheus/alert-rules.yml

ALERTAS:
- HighErrorRate: > 5% por 5min (critical)
- HighLatency: p95 > 2s por 5min (warning)
- SefazCircuitBreakerOpen: aberto > 10min (critical)
- QueueBackedUp: > 1000 jobs por 10min (warning)
```

## Ordem de Execucao Recomendada
1. Logger (base para tudo)
2. Metricas (depende do logger)
3. Docker Stack (infra)
4. Alertas (depende do Prometheus)
5. Tracing (opcional, pode ser feito depois)

## Validacao
Apos cada tarefa, verificar:
- [ ] Build passa sem erros: `pnpm build`
- [ ] Testes passam: `pnpm test`
- [ ] Endpoint funciona (se aplicavel)
