import type { FastifyInstance } from 'fastify';
import { eventsService } from './service.js';
import {
  documentIdSchema,
  listEventsQuerySchema,
  type DocumentIdParams,
  type ListEventsQuery,
} from './schemas.js';
import { getTenantId } from '../../plugins/auth.js';
import { sendSuccess, paginate } from '../../utils/response.js';

export async function eventsRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('preHandler', fastify.authenticate);

  // GET /api/v1/documents/:id/events - List events for a document
  fastify.get<{
    Params: DocumentIdParams;
    Querystring: ListEventsQuery;
  }>('/:id/events', async (request, reply) => {
    const tenantId = getTenantId(request);
    const { id } = documentIdSchema.parse(request.params);
    const query = listEventsQuerySchema.parse(request.query);

    const { items, total } = await eventsService.listByDocument(tenantId, id, query);
    const { data, pagination } = paginate(items, total, query.page, query.limit);

    return sendSuccess(reply, data, 200, pagination);
  });
}
