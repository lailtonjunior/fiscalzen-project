import Fastify, { type FastifyInstance } from 'fastify';
import multipart from '@fastify/multipart';
import helmet from '@fastify/helmet';
import { env } from './config/env';

// Plugins
import authPlugin from './plugins/auth';
import corsPlugin from './plugins/cors';
import rateLimitPlugin from './plugins/rate-limit';

// Routes
import { companiesRoutes } from './modules/companies/index';
import { documentsRoutes } from './modules/documents/index';
import { eventsRoutes } from './modules/events/index';
import { dashboardRoutes } from './modules/dashboard/index';
import { manifestacaoRoutes } from './modules/manifestacao/index';
import { agentsRoutes } from './modules/agents/index';
import { jobsRoutes } from './modules/jobs/index';
import { nfseRoutes, companyNfseRoutes } from './modules/nfse/index';

// Utils
import { AppError } from './utils/errors';
import { sendError } from './utils/response';
import { ZodError } from 'zod';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      transport:
        env.NODE_ENV === 'development'
          ? {
              target: 'pino-pretty',
              options: {
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
              },
            }
          : undefined,
    },
    trustProxy: true,
  });

  // Register plugins
  await app.register(helmet, {
    contentSecurityPolicy: env.NODE_ENV === 'production',
  });

  await app.register(corsPlugin);
  await app.register(rateLimitPlugin);
  await app.register(authPlugin);

  await app.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    },
  });

  // Global error handler
  app.setErrorHandler((error, request, reply) => {
    request.log.error(error);

    // Zod validation errors
    if (error instanceof ZodError) {
      return sendError(reply, new AppError(
        'Erro de validacao',
        'VALIDATION_ERROR',
        400,
        error.errors
      ));
    }

    // App errors
    if (error instanceof AppError) {
      return sendError(reply, error);
    }

    // Fastify errors (validation, etc)
    if ('statusCode' in error && typeof error.statusCode === 'number') {
      return sendError(
        reply,
        new AppError(error.message, 'REQUEST_ERROR', error.statusCode)
      );
    }

    // Unknown errors
    return sendError(reply, error);
  });

  // Health check
  app.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? '0.1.0',
  }));

  // API routes
  await app.register(
    async (api) => {
      await api.register(companiesRoutes, { prefix: '/companies' });
      await api.register(documentsRoutes, { prefix: '/documents' });
      await api.register(eventsRoutes, { prefix: '/documents' }); // Nested under documents
      await api.register(dashboardRoutes, { prefix: '/dashboard' });
      await api.register(manifestacaoRoutes, { prefix: '/manifestacao' });
      await api.register(agentsRoutes, { prefix: '/agents' });
      await api.register(jobsRoutes, { prefix: '/jobs' });
      await api.register(nfseRoutes, { prefix: '/nfse' });
      await api.register(companyNfseRoutes, { prefix: '/companies/:companyId/nfse' });
    },
    { prefix: '/api/v1' }
  );

  // 404 handler
  app.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Rota ${request.method} ${request.url} nao encontrada`,
      },
    });
  });

  return app;
}
