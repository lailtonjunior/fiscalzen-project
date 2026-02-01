import { z } from 'zod';

// POST /batch input schema
export const batchDownloadSchema = z.object({
    documentIds: z.array(z.string().uuid()).max(5000).optional(),
    filters: z.record(z.any()).optional(),
    format: z.enum(['xml', 'pdf', 'both']).default('both'),
    includeMetadata: z.boolean().default(true),
    organizacao: z.enum(['flat', 'by-date', 'by-type', 'by-company']).default('by-date'),
});

// GET /batch/:jobId input schema
export const downloadJobParamsSchema = z.object({
    jobId: z.string(),
});

export type BatchDownloadInput = z.infer<typeof batchDownloadSchema>;
