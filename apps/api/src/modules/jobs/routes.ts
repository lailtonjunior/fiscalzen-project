import type { FastifyInstance } from 'fastify';
import { jobsService } from './service';
import {
  companyIdSchema,
  syncRequestSchema,
  type CompanyIdParams,
  type SyncRequestInput,
} from './schemas';
import { getTenantId } from '../../plugins/auth';
import { sendSuccess } from '../../utils/response';

export async function jobsRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('preHandler', fastify.authenticate);

  // GET /api/v1/jobs/status - Overall job status
  fastify.get('/status', async (request, reply) => {
    const status = await jobsService.getStatus();
    return sendSuccess(reply, status);
  });

  // GET /api/v1/jobs/company/:companyId - Jobs for a specific company
  fastify.get<{
    Params: CompanyIdParams;
  }>('/company/:companyId', async (request, reply) => {
    const tenantId = getTenantId(request);
    const { companyId } = companyIdSchema.parse(request.params);

    const jobs = await jobsService.getCompanyJobs(tenantId, companyId);
    return sendSuccess(reply, jobs);
  });

  // POST /api/v1/jobs/sync/:companyId - Trigger sync for company
  fastify.post<{
    Params: CompanyIdParams;
    Body: SyncRequestInput;
  }>('/sync/:companyId', async (request, reply) => {
    const tenantId = getTenantId(request);
    const { companyId } = companyIdSchema.parse(request.params);
    const { docTypes } = syncRequestSchema.parse(request.body ?? {});

    const result = await jobsService.triggerSync(tenantId, companyId, docTypes);
    return sendSuccess(reply, result);
  });

  // POST /api/v1/jobs/sync-all - Trigger sync for all companies
  fastify.post('/sync-all', async (request, reply) => {
    const tenantId = getTenantId(request);

    const result = await jobsService.triggerAllSync(tenantId);
    return sendSuccess(reply, result);
  });

  // GET /api/v1/jobs/queues/:queueName - Queue details
  fastify.get<{
    Params: { queueName: string };
  }>('/queues/:queueName', async (request, reply) => {
    const { queueName } = request.params;

    const details = await jobsService.getQueueDetails(queueName);
    return sendSuccess(reply, details);
  });

  // POST /api/v1/jobs/queues/:queueName/retry - Retry failed jobs
  fastify.post<{
    Params: { queueName: string };
  }>('/queues/:queueName/retry', async (request, reply) => {
    const { queueName } = request.params;

    // Only admins can retry jobs
    if (request.user.role !== 'admin') {
      return reply.status(403).send({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Apenas administradores podem executar esta acao' },
      });
    }

    const result = await jobsService.retryFailedJobs(queueName);
    return sendSuccess(reply, result);
  });

  // POST /api/v1/jobs/queues/:queueName/clean - Clean queue
  fastify.post<{
    Params: { queueName: string };
    Body: { status: 'completed' | 'failed' };
  }>('/queues/:queueName/clean', async (request, reply) => {
    const { queueName } = request.params;
    const { status } = request.body;

    // Only admins can clean queues
    if (request.user.role !== 'admin') {
      return reply.status(403).send({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Apenas administradores podem executar esta acao' },
      });
    }

    const result = await jobsService.cleanQueue(queueName, status);
    return sendSuccess(reply, result);
  });
}
