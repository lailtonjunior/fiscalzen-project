# Implementação Swagger/OpenAPI

## Resumo
Foi implementada a documentação API interativa usando Swagger UI e OpenAPI 3.0. A documentação é gerada automaticamente a partir dos schemas Zod utilizados na validação das rotas.

## Componentes

### 1. Plugin (`apps/api/src/plugins/swagger.ts`)
- Configurado com `@fastify/swagger` e `@fastify/swagger-ui`.
- Rota: `/documentation`
- Define esquemas de segurança (Bearer Auth).
- Agrupa endpoints por Tags (Companies, Documents, etc.).

### 2. Schemas Zod (`apps/api/src/modules/*/schemas.ts`)
- Adicionados métodos `.describe()` aos campos dos schemas.
- Isso enriquece a documentação gerada com descrições humanas para campos de input (Query, Body, Params).

### 3. Rotas
- As rotas utilizam `zodToFastify` para converter schemas Zod em JSON Schema compatível com OpenAPI.
- Exemplo em `apps/api/src/modules/companies/routes.ts`.

## Como Verificar

1. **Reinicie o servidor API**:
   Como novas dependências e plugins foram registrados, é necessário reiniciar o processo `pnpm dev`.

2. **Acesse a Interface**:
   Abra `http://localhost:3001/documentation` no navegador.

3. **Validação JSON**:
   O schema JSON cru pode ser obtido em: `http://localhost:3001/documentation/json`

## Status da Verificação
- **Configuração Estática:** ✅ Concluída e verificada no código.
- **Teste Dinâmico:** ⚠️ Servidor responsivo pendente de reinício (timeout detectado durante a implementação).
