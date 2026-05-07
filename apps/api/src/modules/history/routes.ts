import type { FastifyInstance } from 'fastify';
import { getTenantId } from '../../plugins/auth';
import { sendSuccess } from '../../utils/response';
import { standardResponses, zodToFastify } from '../../utils/schema-converter';
import { historyService } from './service';
import {
  historyDocumentParamsSchema,
  listHistoryQuerySchema,
  type HistoryDocumentParams,
  type ListHistoryQuery,
} from './schemas';

export async function historyRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.authenticate);

  fastify.get<{
    Params: HistoryDocumentParams;
    Querystring: ListHistoryQuery;
  }>('/:id/history', {
    schema: {
      tags: ['History'],
      summary: 'Timeline consolidada do documento',
      description: 'Retorna o historico auditavel consolidado do ciclo fiscal do documento',
      params: zodToFastify(historyDocumentParamsSchema),
      querystring: zodToFastify(listHistoryQuerySchema),
      response: {
        200: {
          description: 'Timeline consolidada do documento',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: { type: 'object' },
            },
          },
        },
        401: standardResponses[401],
        404: standardResponses[404],
      },
    },
  }, async (request, reply) => {
    const tenantId = getTenantId(request);
    const { id } = historyDocumentParamsSchema.parse(request.params);
    const { limit } = listHistoryQuerySchema.parse(request.query);

    const items = await historyService.listByDocument(tenantId, id, limit);
    return sendSuccess(reply, items);
  });
}
