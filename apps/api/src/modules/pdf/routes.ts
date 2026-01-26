import { FastifyPluginAsync } from 'fastify';
import { container } from 'tsyringe';
import { PdfService } from './service';

export const pdfRoutes: FastifyPluginAsync = async (fastify) => {
    const pdfService = container.resolve(PdfService);

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
                200: {
                    type: 'object',
                    properties: {
                        url: { type: 'string' },
                        cached: { type: 'boolean' },
                        metadata: { type: 'object', additionalProperties: true },
                    },
                },
            },
            security: [{ bearerAuth: [] }],
        },
        handler: async (request, reply) => {
            const { id } = request.params as { id: string };
            const { redirect } = request.query as { redirect?: boolean };
            // User is injected by auth middleware, usually request.user
            const user = (request as any).user;

            const result = await pdfService.generatePdf(id, user.tenantId);

            if (redirect) {
                return reply.redirect(result.url);
            }

            return reply.send(result);
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
        handler: async (request, reply) => {
            const { documentIds } = request.body as { documentIds: string[] };
            const user = (request as any).user;

            const result = await pdfService.generateBatchPdf(documentIds, user.tenantId);
            return reply.status(202).send(result);
        }
    })
};
