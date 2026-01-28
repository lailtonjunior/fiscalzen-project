import { FastifyPluginAsync } from 'fastify';

// TODO: Re-enable once pdfmake ESM compatibility is fixed
// import { container } from 'tsyringe';
// import { PdfService } from './service';

export const pdfRoutes: FastifyPluginAsync = async (fastify) => {
    // PDF generation temporarily disabled due to pdfmake ESM compatibility issues

    fastify.get('/:id/pdf', {
        schema: {
            tags: ['PDF'],
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                },
                required: ['id'],
            },
            querystring: {
                type: 'object',
                properties: {
                    redirect: { type: 'boolean' },
                },
            },
            response: {
                503: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        message: { type: 'string' },
                    },
                },
            },
            security: [{ bearerAuth: [] }],
        },
        handler: async (_request, reply) => {
            return reply.status(503).send({
                error: 'Service Unavailable',
                message: 'Geracao de PDF temporariamente indisponivel',
            });
        },
    });

    fastify.post('/pdf/batch', {
        schema: {
            tags: ['PDF'],
            body: {
                type: 'object',
                properties: {
                    documentIds: { type: 'array', items: { type: 'string' } }
                },
                required: ['documentIds']
            },
            security: [{ bearerAuth: [] }]
        },
        handler: async (_request, reply) => {
            return reply.status(503).send({
                error: 'Service Unavailable',
                message: 'Geracao de PDF temporariamente indisponivel',
            });
        }
    });
};
