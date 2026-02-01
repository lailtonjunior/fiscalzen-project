import { z } from 'zod';

// POST/PUT input schemas
export const createCommentSchema = z.object({
    content: z.string().min(1),
    isInternal: z.boolean().optional(),
    parentId: z.string().uuid().optional(),
});

export const updateCommentSchema = z.object({
    content: z.string().min(1),
});

// Output/Param schemas
export const commentIdParamsSchema = z.object({
    id: z.string().uuid(),
});

export const documentCommentsParamsSchema = z.object({
    documentId: z.string().uuid(),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
