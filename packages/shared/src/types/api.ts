import { z } from 'zod';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type PaginationParams = z.infer<typeof paginationSchema>;

export const documentFiltersSchema = z.object({
  companyId: z.string().uuid().optional(),
  docType: z.string().optional(),
  situacao: z.string().optional(),
  dataInicio: z.string().optional(),
  dataFim: z.string().optional(),
  emitCnpj: z.string().optional(),
  destCnpjCpf: z.string().optional(),
  search: z.string().optional(),
});

export type DocumentFilters = z.infer<typeof documentFiltersSchema>;

export const sortSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type SortParams = z.infer<typeof sortSchema>;
