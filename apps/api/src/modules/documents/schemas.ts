import { z } from 'zod';

export const docTypeEnum = z.enum(['NFE', 'CTE', 'MDFE', 'NFSE', 'SAT', 'NFCE']);
export const situacaoEnum = z.enum(['autorizada', 'cancelada', 'denegada', 'inutilizada', 'pendente']);

export const listDocumentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).describe('Número da página'),
  limit: z.coerce.number().int().min(1).max(100).default(50).describe('Itens por página'),
  companyId: z.string().uuid().optional().describe('Filtro por ID da empresa'),
  search: z.string().trim().min(1).optional().describe('Busca textual por chave, numero, emitente ou destinatario'),
  docType: docTypeEnum.optional().describe('Tipo de documento (NFE, CTE, etc)'),
  situacao: situacaoEnum.optional().describe('Situação na SEFAZ'),
  dataInicio: z.string().datetime().optional().describe('Data inicial de emissão (ISO8601)'),
  dataFim: z.string().datetime().optional().describe('Data final de emissão (ISO8601)'),
  emitCnpj: z.string().length(14).optional().describe('CNPJ do emitente'),
  destCnpj: z.string().length(14).optional().describe('CNPJ do destinatário'),
  numero: z.string().optional().describe('Número do documento'),
  serie: z.string().optional().describe('Série do documento'),
  chave: z.string().length(44).optional().describe('Chave de Acesso (44 dígitos)'),
  sortBy: z.enum(['dataEmissao', 'valorTotal', 'numero', 'createdAt']).default('dataEmissao').describe('Campo de ordenação'),
  sortOrder: z.enum(['asc', 'desc']).default('desc').describe('Direção da ordenação'),
});

export const documentIdSchema = z.object({
  id: z.string().uuid('ID invalido').describe('UUID do documento'),
});

export const searchDocumentsQuerySchema = z.object({
  q: z.string().min(1, 'Termo de busca obrigatorio').describe('Termo de busca (full-text)'),
  page: z.coerce.number().int().min(1).default(1).describe('Número da página'),
  limit: z.coerce.number().int().min(1).max(100).default(50).describe('Itens por página'),
  companyId: z.string().uuid().optional().describe('Filtro por ID da empresa'),
  docType: docTypeEnum.optional().describe('Tipo de documento'),
  situacao: situacaoEnum.optional().describe('Situação'),
  dataInicio: z.string().datetime().optional().describe('Data inicial'),
  dataFim: z.string().datetime().optional().describe('Data final'),
});

export const uploadXmlSchema = z.object({
  companyId: z.string().uuid('Company ID invalido').describe('ID da empresa proprietária do XML'),
});

export const documentByChaveSchema = z.object({
  chave: z.string().length(44, 'Chave de acesso deve ter 44 digitos').describe('Chave de Acesso (44 dígitos)'),
});

export type ListDocumentsQuery = z.infer<typeof listDocumentsQuerySchema>;
export type DocumentIdParams = z.infer<typeof documentIdSchema>;
export type SearchDocumentsQuery = z.infer<typeof searchDocumentsQuerySchema>;
export type UploadXmlInput = z.infer<typeof uploadXmlSchema>;
export type DocumentByChaveParams = z.infer<typeof documentByChaveSchema>;
