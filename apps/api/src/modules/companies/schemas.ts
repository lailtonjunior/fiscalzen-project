import { z } from 'zod';

export const createCompanySchema = z.object({
  cnpj: z.string().length(14, 'CNPJ deve ter 14 digitos').regex(/^\d+$/, 'CNPJ deve conter apenas numeros'),
  razaoSocial: z.string().min(1).max(255),
  nomeFantasia: z.string().max(255).optional(),
  ie: z.string().max(20).optional(),
  im: z.string().max(20).optional(),
  endereco: z.object({
    logradouro: z.string().max(255).optional(),
    numero: z.string().max(20).optional(),
    complemento: z.string().max(100).optional(),
    bairro: z.string().max(100).optional(),
    cep: z.string().length(8).optional(),
    municipio: z.string().max(100).optional(),
    uf: z.string().length(2).optional(),
    codigoMunicipio: z.string().max(10).optional(),
  }).optional(),
  telefone: z.string().max(20).optional(),
  email: z.string().email().max(255).optional(),
  regimeTributario: z.enum(['simples_nacional', 'lucro_presumido', 'lucro_real']).optional(),
  ativo: z.boolean().default(true),
});

export const updateCompanySchema = createCompanySchema.partial();

export const companyIdSchema = z.object({
  id: z.string().uuid('ID invalido'),
});

export const uploadCertificateSchema = z.object({
  password: z.string().min(1, 'Senha do certificado e obrigatoria'),
});

export const listCompaniesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
  ativo: z.enum(['true', 'false']).optional().transform((v) => v === 'true'),
  search: z.string().optional(),
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
export type CompanyIdParams = z.infer<typeof companyIdSchema>;
export type UploadCertificateInput = z.infer<typeof uploadCertificateSchema>;
export type ListCompaniesQuery = z.infer<typeof listCompaniesQuerySchema>;
