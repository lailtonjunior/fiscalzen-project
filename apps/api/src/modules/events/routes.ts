import type { FastifyInstance } from 'fastify';
import { eventsService } from './service';
import {
  documentIdSchema,
  listEventsQuerySchema,
  type DocumentIdParams,
  type ListEventsQuery,
} from './schemas';
import { getTenantId } from '../../plugins/auth';
import { sendSuccess, paginate } from '../../utils/response';

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
