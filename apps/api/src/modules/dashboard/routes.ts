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
import { zodToFastify, standardResponses } from '../../utils/schema-converter';

export async function dashboardRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('preHandler', fastify.authenticate);

  // GET /api/v1/dashboard/summary - Totals by document type
  fastify.get<{
    Querystring: SummaryQuery;
  }>('/summary', {
    schema: {
      tags: ['Dashboard'],
      summary: 'Resumo de documentos',
      description: 'Retorna totais de documentos por tipo (NF-e, CT-e, MDF-e, NFS-e)',
      querystring: zodToFastify(summaryQuerySchema),
      response: {
        200: {
          description: 'Resumo de documentos',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                NFE: { type: 'integer' },
                CTE: { type: 'integer' },
                MDFE: { type: 'integer' },
                NFSE: { type: 'integer' },
                total: { type: 'integer' },
              },
            },
          },
        },
        401: standardResponses[401],
      },
    },
  }, async (request, reply) => {
    const tenantId = getTenantId(request);
    const query = summaryQuerySchema.parse(request.query);

    const summary = await dashboardService.getSummary(tenantId, query);

    return sendSuccess(reply, summary);
  });

  // GET /api/v1/dashboard/integrity - Integrity semaphore
  fastify.get<{
    Querystring: { companyId?: string };
  }>('/integrity', {
    schema: {
      tags: ['Dashboard'],
      summary: 'Status de integridade',
      description: 'Retorna semáforo de integridade fiscal (verde/amarelo/vermelho)',
      querystring: {
        type: 'object',
        properties: {
          companyId: { type: 'string', format: 'uuid', description: 'Filtrar por empresa' },
        },
      },
      response: {
        200: {
          description: 'Status de integridade',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                status: { type: 'string', enum: ['green', 'yellow', 'red'] },
                gaps: { type: 'integer' },
                pendingManifestations: { type: 'integer' },
                expiringCertificates: { type: 'integer' },
              },
            },
          },
        },
        401: standardResponses[401],
      },
    },
  }, async (request, reply) => {
    const tenantId = getTenantId(request);
    const companyId = request.query.companyId;

    const integrity = await dashboardService.getIntegrity(tenantId, companyId);

    return sendSuccess(reply, integrity);
  });

  // GET /api/v1/dashboard/gaps - Detected numbering gaps
  fastify.get<{
    Querystring: GapsQuery;
  }>('/gaps', {
    schema: {
      tags: ['Dashboard'],
      summary: 'Gaps de numeração',
      description: 'Retorna gaps detectados na numeração de documentos',
      querystring: zodToFastify(gapsQuerySchema),
      response: {
        200: {
          description: 'Lista de gaps',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  from: { type: 'integer' },
                  to: { type: 'integer' },
                  serie: { type: 'string' },
                  type: { type: 'string' },
                },
              },
            },
          },
        },
        401: standardResponses[401],
      },
    },
  }, async (request, reply) => {
    const tenantId = getTenantId(request);
    const query = gapsQuerySchema.parse(request.query);

    const gaps = await dashboardService.getGaps(tenantId, query);

    return sendSuccess(reply, gaps);
  });

  // GET /api/v1/dashboard/timeline - Documents over time (for charts)
  fastify.get<{
    Querystring: TimelineQuery;
  }>('/timeline', {
    schema: {
      tags: ['Dashboard'],
      summary: 'Timeline de documentos',
      description: 'Retorna documentos ao longo do tempo para gráficos',
      querystring: zodToFastify(timelineQuerySchema),
      response: {
        200: {
          description: 'Dados de timeline',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  date: { type: 'string', format: 'date' },
                  count: { type: 'integer' },
                  value: { type: 'number' },
                },
              },
            },
          },
        },
        401: standardResponses[401],
      },
    },
  }, async (request, reply) => {
    const tenantId = getTenantId(request);
    const query = timelineQuerySchema.parse(request.query);

    const timeline = await dashboardService.getTimeline(tenantId, query);

    return sendSuccess(reply, timeline);
  });

  // GET /api/v1/dashboard/recent - Recent documents
  fastify.get<{
    Querystring: RecentQuery;
  }>('/recent', {
    schema: {
      tags: ['Dashboard'],
      summary: 'Documentos recentes',
      description: 'Retorna os documentos mais recentes',
      querystring: zodToFastify(recentQuerySchema),
      response: {
        200: {
          description: 'Lista de documentos recentes',
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
    const query = recentQuerySchema.parse(request.query);

    const recent = await dashboardService.getRecent(tenantId, query);

    return sendSuccess(reply, recent);
  });
}
