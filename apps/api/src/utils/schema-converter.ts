/**
 * Schema conversion utilities for Fastify + Zod + OpenAPI integration
 */

import { zodToJsonSchema } from 'zod-to-json-schema';
import type { z } from 'zod';

/**
 * Converts a Zod schema to a JSON Schema compatible with Fastify/OpenAPI
 */
export function zodToFastify<T extends z.ZodType>(schema: T) {
    const jsonSchema = zodToJsonSchema(schema, {
        target: 'openApi3',
        $refStrategy: 'none', // Inline all refs for Fastify compatibility
    });

    // Remove $schema property that Fastify doesn't need
    if ('$schema' in jsonSchema) {
        delete jsonSchema.$schema;
    }

    return jsonSchema;
}

/**
 * Common response schemas for OpenAPI documentation
 */
export const commonSchemas = {
    // Success response wrapper
    successResponse: (dataSchema: object) => ({
        type: 'object',
        properties: {
            success: { type: 'boolean', const: true },
            data: dataSchema,
        },
        required: ['success', 'data'],
    }),

    // Success with pagination
    paginatedResponse: (itemSchema: object) => ({
        type: 'object',
        properties: {
            success: { type: 'boolean', const: true },
            data: {
                type: 'array',
                items: itemSchema,
            },
            pagination: {
                type: 'object',
                properties: {
                    page: { type: 'integer' },
                    limit: { type: 'integer' },
                    total: { type: 'integer' },
                    pages: { type: 'integer' },
                },
            },
        },
        required: ['success', 'data', 'pagination'],
    }),

    // Error response
    errorResponse: {
        type: 'object',
        properties: {
            success: { type: 'boolean', const: false },
            error: {
                type: 'object',
                properties: {
                    code: { type: 'string' },
                    message: { type: 'string' },
                    details: { type: 'object' },
                },
                required: ['code', 'message'],
            },
        },
        required: ['success', 'error'],
    },

    // Common parameter schemas
    uuidParam: {
        type: 'object',
        properties: {
            id: { type: 'string', format: 'uuid' },
        },
        required: ['id'],
    },

    paginationQuery: {
        type: 'object',
        properties: {
            page: { type: 'integer', minimum: 1, default: 1 },
            limit: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
        },
    },
};

/**
 * Standard HTTP response definitions for route schemas
 */
export const standardResponses = {
    200: {
        description: 'Operação realizada com sucesso',
    },
    201: {
        description: 'Recurso criado com sucesso',
    },
    204: {
        description: 'Operação realizada, sem conteúdo de retorno',
    },
    400: {
        description: 'Erro de validação',
        content: {
            'application/json': {
                schema: commonSchemas.errorResponse,
            },
        },
    },
    401: {
        description: 'Não autenticado',
        content: {
            'application/json': {
                schema: commonSchemas.errorResponse,
            },
        },
    },
    403: {
        description: 'Acesso negado',
        content: {
            'application/json': {
                schema: commonSchemas.errorResponse,
            },
        },
    },
    404: {
        description: 'Recurso não encontrado',
        content: {
            'application/json': {
                schema: commonSchemas.errorResponse,
            },
        },
    },
    500: {
        description: 'Erro interno do servidor',
        content: {
            'application/json': {
                schema: commonSchemas.errorResponse,
            },
        },
    },
};
