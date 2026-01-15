import type { FastifyInstance } from 'fastify';
import { dashboardService } from './service';
import {
  summaryQuerySchema,
  timelineQuerySchema,
  gapsQuerySchema,
  recentQuerySchema,
  type SummaryQuery,
  type TimelineQuery,
  type GapsQuery,
  type RecentQuery,
} from './schemas';
import { getTenantId } from '../../plugins/auth';
import { sendSuccess } from '../../utils/response';

export async function dashboardRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('preHandler', fastify.authenticate);

  // GET /api/v1/dashboard/summary - Totals by document type
  fastify.get<{
    Querystring: SummaryQuery;
  }>('/summary', async (request, reply) => {
    const tenantId = getTenantId(request);
    const query = summaryQuerySchema.parse(request.query);

    const summary = await dashboardService.getSummary(tenantId, query);

    return sendSuccess(reply, summary);
  });

  // GET /api/v1/dashboard/integrity - Integrity semaphore
  fastify.get<{
    Querystring: { companyId?: string };
  }>('/integrity', async (request, reply) => {
    const tenantId = getTenantId(request);
    const companyId = request.query.companyId;

    const integrity = await dashboardService.getIntegrity(tenantId, companyId);

    return sendSuccess(reply, integrity);
  });

  // GET /api/v1/dashboard/gaps - Detected numbering gaps
  fastify.get<{
    Querystring: GapsQuery;
  }>('/gaps', async (request, reply) => {
    const tenantId = getTenantId(request);
    const query = gapsQuerySchema.parse(request.query);

    const gaps = await dashboardService.getGaps(tenantId, query);

    return sendSuccess(reply, gaps);
  });

  // GET /api/v1/dashboard/timeline - Documents over time (for charts)
  fastify.get<{
    Querystring: TimelineQuery;
  }>('/timeline', async (request, reply) => {
    const tenantId = getTenantId(request);
    const query = timelineQuerySchema.parse(request.query);

    const timeline = await dashboardService.getTimeline(tenantId, query);

    return sendSuccess(reply, timeline);
  });

  // GET /api/v1/dashboard/recent - Recent documents
  fastify.get<{
    Querystring: RecentQuery;
  }>('/recent', async (request, reply) => {
    const tenantId = getTenantId(request);
    const query = recentQuerySchema.parse(request.query);

    const recent = await dashboardService.getRecent(tenantId, query);

    return sendSuccess(reply, recent);
  });
}
