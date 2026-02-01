import { z } from 'zod';

// POST/PUT input schemas
export const createTagSchema = z.object({
    name: z.string().min(1).max(50),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    description: z.string().max(255).optional(),
    icon: z.string().optional(),
});

export const updateTagSchema = createTagSchema.partial();

export const addTagsToDocumentSchema = z.object({
    tagIds: z.array(z.string().uuid()),
});

// Query schemas
export const listDocumentsByTagQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
});

// Output/Param schemas
export const tagIdParamsSchema = z.object({
    id: z.string().uuid(),
});

export const documentTagParamsSchema = z.object({
    documentId: z.string().uuid(),
    tagId: z.string().uuid(),
});

export const documentTagsParamsSchema = z.object({
    documentId: z.string().uuid(),
});

export const tagSlugParamsSchema = z.object({
    slug: z.string(),
});

export type CreateTagInput = z.infer<typeof createTagSchema>;
export type UpdateTagInput = z.infer<typeof updateTagSchema>;
export type AddTagsInput = z.infer<typeof addTagsToDocumentSchema>;
export type ListDocumentsByTagQuery = z.infer<typeof listDocumentsByTagQuerySchema>;
