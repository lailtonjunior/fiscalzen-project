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
        target: 'jsonSchema7',
        $refStrategy: 'none', // Inline all refs for Fastify compatibility
    });

    sanitizeFastifySchema(jsonSchema);

    return jsonSchema;
}

function sanitizeFastifySchema(schema: unknown): void {
    if (!schema || typeof schema !== 'object') {
        return;
    }

    const record = schema as Record<string, unknown>;
    delete record.$schema;

    for (const key of Object.keys(record)) {
        if (record[key] === undefined) {
            delete record[key];
            continue;
        }

        sanitizeFastifySchema(record[key]);
    }
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
            meta: {
                type: 'object',
                properties: {
                    page: { type: 'integer' },
                    pageSize: { type: 'integer' },
                    total: { type: 'integer' },
                    hasNext: { type: 'boolean' },
                },
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
        required: ['success', 'data', 'meta'],
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
        type: 'object',
        properties: {
            success: { type: 'boolean' },
            data: {},
            meta: { type: 'object', additionalProperties: true },
            pagination: { type: 'object', additionalProperties: true },
        },
        required: ['success'],
    },
    201: {
        type: 'object',
        properties: {
            success: { type: 'boolean' },
            data: {},
        },
        required: ['success', 'data'],
    },
    204: {
        type: 'null',
        description: 'Operação realizada, sem conteúdo de retorno',
    },
    400: commonSchemas.errorResponse,
    401: commonSchemas.errorResponse,
    403: commonSchemas.errorResponse,
    404: commonSchemas.errorResponse,
    500: commonSchemas.errorResponse,
};
