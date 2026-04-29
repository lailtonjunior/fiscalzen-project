import { z } from 'zod';

export const createCompanySchema = z.object({
  cnpj: z.string().length(14, 'CNPJ deve ter 14 digitos').regex(/^\d+$/, 'CNPJ deve conter apenas numeros').describe('CNPJ da empresa (apenas números)'),
  razaoSocial: z.string().min(1).max(255).describe('Razão Social da empresa'),
  nomeFantasia: z.string().max(255).optional().describe('Nome Fantasia'),
  ie: z.string().max(20).optional().describe('Inscrição Estadual'),
  im: z.string().max(20).optional().describe('Inscrição Municipal'),
  endereco: z.object({
    logradouro: z.string().max(255).optional().describe('Rua / Logradouro'),
    numero: z.string().max(20).optional().describe('Número'),
    complemento: z.string().max(100).optional().describe('Complemento'),
    bairro: z.string().max(100).optional().describe('Bairro'),
    cep: z.string().length(8).optional().describe('CEP (apenas números)'),
    municipio: z.string().max(100).optional().describe('Nome do Município'),
    uf: z.string().length(2).optional().describe('Sigla da UF (ex: SP)'),
    codigoMunicipio: z.string().max(10).optional().describe('Código IBGE do município'),
  }).optional().describe('Endereço completo'),
  telefone: z.string().max(20).optional().describe('Telefone de contato'),
  email: z.string().email().max(255).optional().describe('Email principal'),
  regimeTributario: z.enum(['simples_nacional', 'lucro_presumido', 'lucro_real']).optional().describe('Regime Tributário'),
  ativo: z.boolean().default(true).describe('Status da empresa'),
});

export const updateCompanySchema = createCompanySchema.partial();

export const companyIdSchema = z.object({
  id: z.string().uuid('ID invalido').describe('UUID da empresa'),
});

export const uploadCertificateSchema = z.object({
  password: z.string().min(1, 'Senha do certificado e obrigatoria').describe('Senha do arquivo PFX'),
});

export const listCompaniesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1).describe('Número da página'),
  limit: z.coerce.number().int().positive().max(100).default(50).describe('Itens por página'),
  ativo: z.enum(['true', 'false']).optional().transform((v) => v === 'true').describe('Filtrar por status ativo'),
  search: z.string().optional().describe('Busca por CNPJ ou Razão Social'),
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
export type CompanyIdParams = z.infer<typeof companyIdSchema>;
export type UploadCertificateInput = z.infer<typeof uploadCertificateSchema>;
export type ListCompaniesQuery = z.infer<typeof listCompaniesQuerySchema>;
