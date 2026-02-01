// Simple logger interface for cross-package logging
// Can be replaced with pino, winston, etc. in the app layer

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  [key: string]: unknown;
}

export interface Logger {
  debug: (context: LogContext, message?: string) => void;
  info: (context: LogContext, message?: string) => void;
  warn: (context: LogContext, message?: string) => void;
  error: (context: LogContext, message?: string) => void;
}

// Default console logger implementation
class ConsoleLogger implements Logger {
  private formatMessage(level: LogLevel, context: LogContext, message?: string): string {
    const timestamp = new Date().toISOString();
    const contextStr = Object.keys(context).length > 0
      ? ` ${JSON.stringify(context)}`
      : '';
    return `[${timestamp}] [${level.toUpperCase()}]${contextStr}${message ? ` ${message}` : ''}`;
  }

  debug(context: LogContext, message?: string): void {
    if (process.env.LOG_LEVEL === 'debug') {
      console.debug(this.formatMessage('debug', context, message));
    }
  }

  info(context: LogContext, message?: string): void {
    console.info(this.formatMessage('info', context, message));
  }

  warn(context: LogContext, message?: string): void {
    console.warn(this.formatMessage('warn', context, message));
  }

  error(context: LogContext, message?: string): void {
    console.error(this.formatMessage('error', context, message));
  }
}

// Singleton logger instance
export const logger: Logger = new ConsoleLogger();

// Allow replacing the logger at runtime
let currentLogger: Logger = new ConsoleLogger();

export function setLogger(newLogger: Logger): void {
  currentLogger = newLogger;
}

export function getLogger(): Logger {
  return currentLogger;
}
