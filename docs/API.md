# FiscalZen API Documentation

**Base URL:** `http://localhost:3001/api/v1`
**Authentication:** Bearer JWT Token (via Clerk)

---

## Companies

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/companies` | List companies |
| POST | `/companies` | Create company |
| GET | `/companies/:id` | Get company details |
| PUT | `/companies/:id` | Update company |
| DELETE | `/companies/:id` | Soft delete company |
| POST | `/companies/:id/certificate` | Upload A1 certificate (.pfx) |
| GET | `/companies/:id/nsu-status` | Get NSU sync status |

---

## Documents

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/documents` | List documents with filters |
| GET | `/documents/search` | Full-text search (Meilisearch) |
| POST | `/documents/upload` | Upload XML manually |
| GET | `/documents/chave/:chave` | Get by chave de acesso |
| GET | `/documents/:id` | Get document details |
| GET | `/documents/:id/xml` | Download original XML |
| GET | `/documents/:id/pdf` | Get PDF download URL |

---

## Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard/summary` | Totals by document type |
| GET | `/dashboard/integrity` | Integrity semaphore |
| GET | `/dashboard/gaps` | Detected numbering gaps |
| GET | `/dashboard/timeline` | Documents over time (charts) |
| GET | `/dashboard/recent` | Recent documents |

---

## Manifestação

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/manifestacao/ciencia` | Registrar ciência (210210) |
| POST | `/manifestacao/confirmacao` | Confirmar operação (210200) |
| POST | `/manifestacao/desconhecimento` | Desconhecer operação (210220) |
| POST | `/manifestacao/nao-realizada` | Operação não realizada (210240) |
| GET | `/manifestacao/pendentes` | Docs aguardando manifestação |

---

## NFS-e

### Municipios
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/nfse/municipios` | List supported municipalities |
| GET | `/nfse/municipios/:codigo` | Get municipality info |

### Company NFS-e Config
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/companies/:id/nfse` | List company NFS-e configs |
| POST | `/companies/:id/nfse` | Create NFS-e config |
| GET | `/companies/:id/nfse/:codigo` | Get NFS-e config |
| PATCH | `/companies/:id/nfse/:codigo` | Update NFS-e config |
| DELETE | `/companies/:id/nfse/:codigo` | Delete NFS-e config |
| PATCH | `/companies/:id/nfse/:codigo/toggle` | Toggle NFS-e config |
| POST | `/companies/:id/nfse/:codigo/test` | Test connection |
| POST | `/companies/:id/nfse/:codigo/sync` | Trigger sync |

---

## Health Check

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/health` | Basic health check | ❌ |
| GET | `/health/live` | Liveness probe | ❌ |
| GET | `/health/ready` | Readiness probe (DB/Redis) | ❌ |

---

## Response Format

### Success
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "total": 100,
    "page": 1,
    "pageSize": 20,
    "totalPages": 5
  }
}
```

### Error
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Campo obrigatório não informado",
    "details": { ... }
  }
}
```

---

## Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `UNAUTHORIZED` | 401 | Token inválido ou expirado |
| `FORBIDDEN` | 403 | Permissão insuficiente |
| `NOT_FOUND` | 404 | Recurso não encontrado |
| `VALIDATION_ERROR` | 400 | Dados inválidos |
| `RATE_LIMIT_EXCEEDED` | 429 | Muitas requisições |
| `SEFAZ_ERROR` | 502 | Erro na comunicação SEFAZ |
