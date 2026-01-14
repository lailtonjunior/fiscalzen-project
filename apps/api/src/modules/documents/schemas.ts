import { z } from 'zod';

export const docTypeEnum = z.enum(['NFE', 'CTE', 'MDFE', 'NFSE', 'SAT', 'NFCE']);
export const situacaoEnum = z.enum(['autorizada', 'cancelada', 'denegada', 'inutilizada', 'pendente']);

export const listDocumentsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
  companyId: z.string().uuid().optional(),
  docType: docTypeEnum.optional(),
  situacao: situacaoEnum.optional(),
  dataInicio: z.string().datetime().optional(),
  dataFim: z.string().datetime().optional(),
  emitCnpj: z.string().length(14).optional(),
  destCnpj: z.string().length(14).optional(),
  numero: z.string().optional(),
  serie: z.string().optional(),
  chave: z.string().length(44).optional(),
  sortBy: z.enum(['dataEmissao', 'valorTotal', 'numero', 'createdAt']).default('dataEmissao'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const documentIdSchema = z.object({
  id: z.string().uuid('ID invalido'),
});

export const searchDocumentsQuerySchema = z.object({
  q: z.string().min(1, 'Termo de busca obrigatorio'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
  companyId: z.string().uuid().optional(),
  docType: docTypeEnum.optional(),
  situacao: situacaoEnum.optional(),
  dataInicio: z.string().datetime().optional(),
  dataFim: z.string().datetime().optional(),
});

export const uploadXmlSchema = z.object({
  companyId: z.string().uuid('Company ID invalido'),
});

export const documentByChaveSchema = z.object({
  chave: z.string().length(44, 'Chave de acesso deve ter 44 digitos'),
});

export type ListDocumentsQuery = z.infer<typeof listDocumentsQuerySchema>;
export type DocumentIdParams = z.infer<typeof documentIdSchema>;
export type SearchDocumentsQuery = z.infer<typeof searchDocumentsQuerySchema>;
export type UploadXmlInput = z.infer<typeof uploadXmlSchema>;
export type DocumentByChaveParams = z.infer<typeof documentByChaveSchema>;
