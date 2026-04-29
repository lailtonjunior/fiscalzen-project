# Runbook: Configuração FiscalZen

## Objetivo
Este documento descreve as correções aplicadas na configuração do projeto e como verificar sua conformidade.

## Mudanças Realizadas (Fev 2026)

1.  **Padronização de Portas PostgreSQL**:
    - Todos os ambientes (Docker, Local, .env) devem usar a porta **5432**.
    - Foi corrigida uma inconsistência em `apps/api/.env` que apontava para 5433.

2.  **Scripts Atualizados**:
    - Scripts `drizzle-kit generate:pg` foram substituídos por `drizzle-kit generate` para compatibilidade com versões recentes do Drizzle.

3.  **Dependências**:
    - Conformidade verificada para `drizzle-orm` (^0.35.0), `next` (^15.0.0), e `bullmq` (^5.40.0).

## Como Verificar a Configuração

O projeto inclui um script automatizado para validação.

### 1. Executar verificação
```bash
node scripts/verify-config.mjs
```
**Saída Esperada:**
- Portas PostgreSQL configuradas para 5432.
- Sem comandos depreciados em `package.json`.
- Todas as variáveis de ambiente requeridas presentes.

### 2. Verificação Manual de Portas
Se o script falhar, verifique manualmente:

```bash
# Deve retornar vazio (nenhuma ocorrência de 5433)
grep -r "5433" .env .env.example docker/ apps/api/.env
```

## Solução de Problemas

### Erro: "Connection refused" no PostgreSQL
1. Verifique se o container está rodando:
   ```bash
   docker ps | grep postgres
   ```
2. Verifique se o `.env` local da API aponta para 5432:
   ```bash
   cat apps/api/.env | grep DATABASE_URL
   ```
   Deve ser: `...localhost:5432...`

### Erro: "Command not found: drizzle-kit generate:pg"
Atualize seu `package.json` para usar `drizzle-kit generate`.
