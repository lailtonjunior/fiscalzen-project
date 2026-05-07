import { z } from 'zod';

export const historyDocumentParamsSchema = z.object({
  id: z.string().uuid('ID invalido'),
});

export const listHistoryQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(200).default(100),
});

export type HistoryDocumentParams = z.infer<typeof historyDocumentParamsSchema>;
export type ListHistoryQuery = z.infer<typeof listHistoryQuerySchema>;
