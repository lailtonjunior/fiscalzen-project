/**
 * Logger estruturado para o Frontend
 * Em produção, pode ser integrado com Sentry, LogRocket, etc.
 */

type LogContext = Record<string, unknown>;

interface Logger {
    error: (error: Error, context?: LogContext) => void;
    warn: (message: string, context?: LogContext) => void;
    info: (message: string, context?: LogContext) => void;
    debug: (message: string, context?: LogContext) => void;
}

const isDev = process.env.NODE_ENV === 'development';

export const logger: Logger = {
    error: (error: Error, context?: LogContext) => {
        const logData = {
            timestamp: new Date().toISOString(),
            level: 'error',
            message: error.message,
            name: error.name,
            stack: isDev ? error.stack : undefined,
            ...context,
        };

        console.error('[FiscalZen Error]', logData);

        // Em produção, enviar para serviço de monitoramento
        if (process.env.NODE_ENV === 'production') {
            // TODO: Integrar com Sentry, LogRocket, etc.
            // Exemplo Sentry:
            // Sentry.captureException(error, { extra: context });
        }
    },

    warn: (message: string, context?: LogContext) => {
        const logData = {
            timestamp: new Date().toISOString(),
            level: 'warn',
            message,
            ...context,
        };

        console.warn('[FiscalZen Warn]', logData);
    },

    info: (message: string, context?: LogContext) => {
        if (!isDev) return; // Só loga info em development

        const logData = {
            timestamp: new Date().toISOString(),
            level: 'info',
            message,
            ...context,
        };

        console.info('[FiscalZen Info]', logData);
    },

    debug: (message: string, context?: LogContext) => {
        if (!isDev) return; // Só loga debug em development

        const logData = {
            timestamp: new Date().toISOString(),
            level: 'debug',
            message,
            ...context,
        };

        console.debug('[FiscalZen Debug]', logData);
    },
};

export default logger;
