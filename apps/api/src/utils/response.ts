import type { FastifyReply } from 'fastify';
import { AppError } from './errors';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface SuccessResponse<T> {
  success: true;
  data: T;
  pagination?: PaginationMeta;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

export function sendSuccess<T>(
  reply: FastifyReply,
  data: T,
  statusCode: number = 200,
  pagination?: PaginationMeta
): FastifyReply {
  const response: SuccessResponse<T> = {
    success: true,
    data,
  };

  if (pagination) {
    response.pagination = pagination;
  }

  return reply.status(statusCode).send(response);
}

export function sendError(
  reply: FastifyReply,
  error: AppError | Error,
  statusCode?: number
): FastifyReply {
  if (error instanceof AppError) {
    const response: ErrorResponse = {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    };
    return reply.status(error.statusCode).send(response);
  }

  // Generic error
  const response: ErrorResponse = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production'
        ? 'Erro interno do servidor'
        : error.message,
    },
  };

  return reply.status(statusCode ?? 500).send(response);
}

export function sendCreated<T>(reply: FastifyReply, data: T): FastifyReply {
  return sendSuccess(reply, data, 201);
}

export function sendNoContent(reply: FastifyReply): FastifyReply {
  return reply.status(204).send();
}

export function paginate<T>(
  items: T[],
  total: number,
  page: number,
  limit: number
): { data: T[]; pagination: PaginationMeta } {
  return {
    data: items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export function getPaginationParams(
  page?: number,
  limit?: number,
  maxLimit: number = 100
): PaginationParams {
  const p = Math.max(1, page ?? 1);
  const l = Math.min(maxLimit, Math.max(1, limit ?? 50));
  return {
    page: p,
    limit: l,
    offset: (p - 1) * l,
  };
}
