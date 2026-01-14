import { z } from 'zod';

export const timelineQuerySchema = z.object({
  companyId: z.string().uuid().optional(),
  dataInicio: z.string().datetime().optional(),
  dataFim: z.string().datetime().optional(),
  groupBy: z.enum(['day', 'week', 'month']).default('day'),
});

export const gapsQuerySchema = z.object({
  companyId: z.string().uuid().optional(),
  docType: z.enum(['NFE', 'CTE', 'MDFE', 'NFSE', 'SAT', 'NFCE']).optional(),
  serie: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

export const summaryQuerySchema = z.object({
  companyId: z.string().uuid().optional(),
  dataInicio: z.string().datetime().optional(),
  dataFim: z.string().datetime().optional(),
});

export const recentQuerySchema = z.object({
  companyId: z.string().uuid().optional(),
  limit: z.coerce.number().int().positive().max(50).default(10),
});

export type TimelineQuery = z.infer<typeof timelineQuerySchema>;
export type GapsQuery = z.infer<typeof gapsQuerySchema>;
export type SummaryQuery = z.infer<typeof summaryQuerySchema>;
export type RecentQuery = z.infer<typeof recentQuerySchema>;
