import { z } from 'zod';

export const companySchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  cnpj: z.string().length(14),
  razaoSocial: z.string().max(255).nullable(),
  nomeFantasia: z.string().max(255).nullable(),
  uf: z.string().length(2).nullable(),
  inscricaoEstadual: z.string().max(20).nullable(),
  inscricaoMunicipal: z.string().max(20).nullable(),
  codigoMunicipio: z.string().max(7).nullable(),
  settings: z.record(z.unknown()).nullable(),
  active: z.boolean(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()).nullable(),
});

export type Company = z.infer<typeof companySchema>;

export const createCompanySchema = z.object({
  cnpj: z.string().length(14),
  razaoSocial: z.string().max(255).optional(),
  nomeFantasia: z.string().max(255).optional(),
  uf: z.string().length(2).optional(),
  inscricaoEstadual: z.string().max(20).optional(),
  inscricaoMunicipal: z.string().max(20).optional(),
  codigoMunicipio: z.string().max(7).optional(),
});

export type CreateCompany = z.infer<typeof createCompanySchema>;

export const updateCompanySchema = createCompanySchema.partial();

export type UpdateCompany = z.infer<typeof updateCompanySchema>;

export const tenantSchema = z.object({
  id: z.string().uuid(),
  name: z.string().max(255),
  cnpj: z.string().length(14).nullable(),
  plan: z.string().max(50),
  settings: z.record(z.unknown()).nullable(),
  active: z.boolean(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()).nullable(),
});

export type Tenant = z.infer<typeof tenantSchema>;
