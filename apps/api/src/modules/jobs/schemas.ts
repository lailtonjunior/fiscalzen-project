import { z } from 'zod';

export const companyIdSchema = z.object({
  companyId: z.string().uuid('Company ID invalido'),
});

export const syncRequestSchema = z.object({
  docTypes: z.array(z.enum(['NFE', 'CTE', 'MDFE'])).optional(),
});

export const jobIdSchema = z.object({
  jobId: z.string(),
});

export type CompanyIdParams = z.infer<typeof companyIdSchema>;
export type SyncRequestInput = z.infer<typeof syncRequestSchema>;
export type JobIdParams = z.infer<typeof jobIdSchema>;
