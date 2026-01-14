export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, code: string, statusCode: number = 400, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} com ID ${id} nao encontrado` : `${resource} nao encontrado`;
    super(message, `${resource.toUpperCase()}_NOT_FOUND`, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Nao autorizado') {
    super(message, 'UNAUTHORIZED', 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Acesso negado') {
    super(message, 'FORBIDDEN', 403);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', 400, details);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 'CONFLICT', 409);
  }
}

export class RateLimitError extends AppError {
  constructor() {
    super('Muitas requisicoes. Tente novamente mais tarde.', 'RATE_LIMIT_EXCEEDED', 429);
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string) {
    super(`Erro no servico ${service}: ${message}`, 'EXTERNAL_SERVICE_ERROR', 502);
  }
}

export const ErrorCodes = {
  // Auth
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',

  // Resources
  COMPANY_NOT_FOUND: 'COMPANY_NOT_FOUND',
  DOCUMENT_NOT_FOUND: 'DOCUMENT_NOT_FOUND',
  TENANT_NOT_FOUND: 'TENANT_NOT_FOUND',
  AGENT_NOT_FOUND: 'AGENT_NOT_FOUND',

  // Business
  CERTIFICATE_EXPIRED: 'CERTIFICATE_EXPIRED',
  CERTIFICATE_INVALID: 'CERTIFICATE_INVALID',
  MANIFESTACAO_ALREADY_EXISTS: 'MANIFESTACAO_ALREADY_EXISTS',
  DOCUMENT_ALREADY_EXISTS: 'DOCUMENT_ALREADY_EXISTS',

  // External
  SEFAZ_ERROR: 'SEFAZ_ERROR',
  STORAGE_ERROR: 'STORAGE_ERROR',
  SEARCH_ERROR: 'SEARCH_ERROR',

  // Rate limit
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
} as const;
