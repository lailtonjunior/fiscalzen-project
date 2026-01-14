import { z } from 'zod';

export const documentIdSchema = z.object({
  id: z.string().uuid('ID invalido'),
});

export const listEventsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

export type DocumentIdParams = z.infer<typeof documentIdSchema>;
export type ListEventsQuery = z.infer<typeof listEventsQuerySchema>;
