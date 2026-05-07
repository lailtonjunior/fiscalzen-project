import type { FastifyInstance } from 'fastify';
import { jobsService } from './service';
import {
  companyIdSchema,
  syncRequestSchema,
  type CompanyIdParams,
  type SyncRequestInput,
} from './schemas';
import { getTenantId } from '../../plugins/auth';
import { sendError, sendSuccess } from '../../utils/response';
import { zodToFastify, standardResponses } from '../../utils/schema-converter';
import { ForbiddenError } from '../../utils/errors';

export async function jobsRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('preHandler', fastify.authenticate);

  // GET /api/v1/jobs/status - Overall job status
  fastify.get('/status', {
    schema: {
      tags: ['Jobs'],
      summary: 'Status do sistema de jobs',
      description: 'Retorna métricas gerais das filas de processamento',
      response: {
        200: {
          description: 'Status dos jobs',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
          },
        },
        401: standardResponses[401],
      },
    },
  }, async (_request, reply) => {
    const status = await jobsService.getStatus();
    return sendSuccess(reply, status);
  });

  // GET /api/v1/jobs/company/:companyId - Jobs for a specific company
  fastify.get<{
    Params: CompanyIdParams;
  }>('/company/:companyId', {
    schema: {
      tags: ['Jobs'],
      summary: 'Listar jobs da empresa',
      description: 'Retorna jobs associados a uma empresa específica',
      params: zodToFastify(companyIdSchema),
      response: {
        200: {
          description: 'Lista de jobs',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'array', items: { type: 'object' } },
          },
        },
        401: standardResponses[401],
      },
    },
  }, async (request, reply) => {
    const tenantId = getTenantId(request);
    const { companyId } = companyIdSchema.parse(request.params);

    const jobs = await jobsService.getCompanyJobs(tenantId, companyId);
    return sendSuccess(reply, jobs);
  });

  // POST /api/v1/jobs/sync/:companyId - Trigger sync for company
  fastify.post<{
    Params: CompanyIdParams;
    Body: SyncRequestInput;
  }>('/sync/:companyId', {
    schema: {
      tags: ['Jobs'],
      summary: 'Iniciar sincronização',
      description: 'Agenda um job de sincronização de documentos para a empresa',
      params: zodToFastify(companyIdSchema),
      body: zodToFastify(syncRequestSchema),
      response: {
        200: {
          description: 'Job agendado',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
          },
        },
        401: standardResponses[401],
      },
    },
  }, async (request, reply) => {
    const tenantId = getTenantId(request);
    const { companyId } = companyIdSchema.parse(request.params);
    const { docTypes } = syncRequestSchema.parse(request.body ?? {});

    const result = await jobsService.triggerSync(tenantId, companyId, docTypes);
    return sendSuccess(reply, result);
  });

  // POST /api/v1/jobs/sync-all - Trigger sync for all companies
  fastify.post('/sync-all', {
    schema: {
      tags: ['Jobs'],
      summary: 'Sincronizar tudo',
      description: 'Inicia sincronização para todas as empresas do tenant',
      response: {
        200: {
          description: 'Jobs agendados',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
          },
        },
        401: standardResponses[401],
      },
    },
  }, async (request, reply) => {
    const tenantId = getTenantId(request);

    const result = await jobsService.triggerAllSync(tenantId);
    return sendSuccess(reply, result);
  });

  // GET /api/v1/jobs/queues/:queueName - Queue details
  fastify.get<{
    Params: { queueName: string };
  }>('/queues/:queueName', {
    schema: {
      tags: ['Jobs'],
      summary: 'Detalhes da fila',
      description: 'Retorna métricas detalhadas de uma fila específica',
      params: {
        type: 'object',
        properties: { queueName: { type: 'string' } },
        required: ['queueName'],
      },
      response: {
        200: {
          description: 'Detalhes da fila',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
          },
        },
        401: standardResponses[401],
      },
    },
  }, async (request, reply) => {
    const { queueName } = request.params;

    const details = await jobsService.getQueueDetails(queueName);
    return sendSuccess(reply, details);
  });

  // POST /api/v1/jobs/queues/:queueName/retry - Retry failed jobs
  fastify.post<{
    Params: { queueName: string };
  }>('/queues/:queueName/retry', {
    schema: {
      tags: ['Jobs'],
      summary: 'Re-executar falhas',
      description: 'Tenta re-processar jobs falhados em uma fila (Requer Admin)',
      params: {
        type: 'object',
        properties: { queueName: { type: 'string' } },
        required: ['queueName'],
      },
      response: {
        200: {
          description: 'Resultado da operação',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
          },
        },
        401: standardResponses[401],
        403: standardResponses[403],
      },
    },
  }, async (request, reply) => {
    const { queueName } = request.params;

    // Only admins can retry jobs
    if (request.user.role !== 'admin') {
      return sendError(reply, new ForbiddenError('Apenas administradores podem executar esta acao'));
    }

    const result = await jobsService.retryFailedJobs(queueName);
    return sendSuccess(reply, result);
  });

  // POST /api/v1/jobs/queues/:queueName/clean - Clean queue
  fastify.post<{
    Params: { queueName: string };
    Body: { status: 'completed' | 'failed' };
  }>('/queues/:queueName/clean', {
    schema: {
      tags: ['Jobs'],
      summary: 'Limpar fila',
      description: 'Remove jobs antigos da fila (Requer Admin)',
      params: {
        type: 'object',
        properties: { queueName: { type: 'string' } },
        required: ['queueName'],
      },
      body: {
        type: 'object',
        properties: { status: { type: 'string', enum: ['completed', 'failed'] } },
        required: ['status'],
      },
      response: {
        200: {
          description: 'Resultado da operação',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
          },
        },
        401: standardResponses[401],
        403: standardResponses[403],
      },
    },
  }, async (request, reply) => {
    const { queueName } = request.params;
    const { status } = request.body;

    // Only admins can clean queues
    if (request.user.role !== 'admin') {
      return sendError(reply, new ForbiddenError('Apenas administradores podem executar esta acao'));
    }

    const result = await jobsService.cleanQueue(queueName, status);
    return sendSuccess(reply, result);
  });
}
