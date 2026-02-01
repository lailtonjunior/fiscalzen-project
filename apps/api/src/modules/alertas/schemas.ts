import { z } from 'zod';

// POST/PUT/PATCH input schemas
export const markAsReadSchema = z.object({
    id: z.string().uuid(),
});

// Query schemas
export const listAlertasQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    lido: z.enum(['true', 'false']).optional().transform((v) => v === 'true' ? true : v === undefined ? undefined : false),
    prioridade: z.enum(['baixa', 'media', 'alta', 'critica']).optional(),
});

// Output/Param schemas
export const alertIdParamsSchema = z.object({
    id: z.string().uuid(),
});

export type MarkAsReadParams = z.infer<typeof alertIdParamsSchema>;
export type ListAlertasQuery = z.infer<typeof listAlertasQuerySchema>;
