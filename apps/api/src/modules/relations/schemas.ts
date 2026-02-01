import { z } from 'zod';

// Output/Param schemas
export const documentIdParamsSchema = z.object({
    id: z.string().uuid(),
});

export const listRelationsQuerySchema = z.object({
    direction: z.enum(['source', 'target', 'both']).default('both'),
});

export const orphanNfesQuerySchema = z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const chaveParamsSchema = z.object({
    chave: z.string().length(44),
});

export type ListRelationsQuery = z.infer<typeof listRelationsQuerySchema>;
export type OrphanNfesQuery = z.infer<typeof orphanNfesQuerySchema>;
