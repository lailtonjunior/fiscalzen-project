import fp from 'fastify-plugin';
import swagger, { type FastifyDynamicSwaggerOptions } from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import type { FastifyInstance } from 'fastify';

const isEnabled = (value: string | undefined) => value === 'true' || value === '1';

const swaggerOptions: FastifyDynamicSwaggerOptions = {
    openapi: {
        openapi: '3.0.3',
        info: {
            title: 'FiscalZen API',
            description: `
# FiscalZen - API de Gestão Fiscal

API REST para gestão de documentos fiscais eletrônicos (NF-e, CT-e, MDF-e, NFS-e).

## Autenticação

Todas as rotas (exceto health checks) requerem autenticação via Bearer Token JWT.

\`\`\`
Authorization: Bearer <token>
\`\`\`

## Paginação

Endpoints que retornam listas suportam paginação:

- \`page\`: Número da página (default: 1)
- \`limit\`: Itens por página (default: 50, max: 100)

## Códigos de Erro

| Código | Descrição |
|--------|-----------|
| 400 | Erro de validação |
| 401 | Não autenticado |
| 403 | Acesso negado |
| 404 | Recurso não encontrado |
| 500 | Erro interno |
      `,
            version: '1.0.0',
            contact: {
                name: 'FiscalZen Team',
                email: 'suporte@fiscalzen.com.br',
            },
        },
        servers: [
            { url: 'http://localhost:3001', description: 'Desenvolvimento' },
            { url: 'https://api.fiscalzen.com.br', description: 'Produção' },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Token JWT obtido via Clerk',
                },
            },
        },
        security: [{ bearerAuth: [] }],
        tags: [
            { name: 'Health', description: 'Health checks e status da API' },
            { name: 'Companies', description: 'Gestão de empresas e certificados' },
            { name: 'Documents', description: 'Documentos fiscais (NF-e, CT-e, MDF-e)' },
            { name: 'Dashboard', description: 'Estatísticas e KPIs' },
            { name: 'Manifestação', description: 'Manifestação do Destinatário' },
            { name: 'NFS-e', description: 'Notas Fiscais de Serviço' },
            { name: 'Tags', description: 'Gestão de tags para documentos' },
            { name: 'Alerts', description: 'Sistema de alertas' },
            { name: 'Webhooks', description: 'Configuração de webhooks' },
            { name: 'Jobs', description: 'Jobs e filas de processamento' },
            { name: 'Downloads', description: 'Download em lote' },
        ],
    },
};

const swaggerUiOptions = {
    routePrefix: '/documentation',
    uiConfig: {
        docExpansion: 'list' as const,
        deepLinking: true,
        persistAuthorization: true,
    },
    staticCSP: true,
};

async function swaggerPlugin(fastify: FastifyInstance) {
    if (!isEnabled(process.env.ENABLE_SWAGGER)) {
        fastify.log.info('Swagger documentation disabled (ENABLE_SWAGGER is not true)');
        return;
    }

    try {
        await fastify.register(swagger, swaggerOptions);
        await fastify.register(swaggerUi, swaggerUiOptions);

        fastify.log.info(
            { route: swaggerUiOptions.routePrefix },
            'Swagger documentation enabled'
        );
    } catch (err) {
        fastify.log.warn({ err }, 'Swagger registration failed; continuing without Swagger');
    }
}

export default fp(swaggerPlugin, {
    name: 'swagger',
    dependencies: [],
});
