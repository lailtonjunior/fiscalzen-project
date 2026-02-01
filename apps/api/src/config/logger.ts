import pino from 'pino';
import { FastifyInstance } from 'fastify';

// Determine environment
const isDev = process.env.NODE_ENV === 'development';
const logLevel = process.env.LOG_LEVEL || 'info';

export const logger = pino({
    level: logLevel,
    transport: isDev
        ? {
            target: 'pino-pretty',
            options: {
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
            },
        }
        : undefined,
    base: {
        service: 'fiscalzen-api',
        version: process.env.npm_package_version || 'unknown',
    },
    serializers: {
        // Standard serializers to clean up internal objects
        req: pino.stdSerializers.req,
        res: pino.stdSerializers.res,
        err: pino.stdSerializers.err,
    },
    redact: {
        paths: [
            'req.headers.authorization',
            'req.headers["x-api-key"]',
            'body.password',
            'body.token',
            'body.refreshToken',
            'body.certificado.pfx',
            'body.certificado.password',
        ],
        remove: true,
    },
});

// Middleware to inject correlation ID and structured logger into request
export function requestLogger(app: FastifyInstance) {
    app.addHook('onRequest', async (request, reply) => {
        // Generate or use existing Correlation ID
        const requestId = (request.id as string) || crypto.randomUUID();

        // Attach child logger to request with context
        request.log = logger.child({
            requestId,
            // @ts-ignore - User might not be populated yet, but if auth runs before it will act
            userId: (request as any).user?.id,
            // @ts-ignore
            companyId: (request as any).user?.companyId,
        });
    });
}
