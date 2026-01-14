import { z } from 'zod';

// ============================================
// Parameter Schemas
// ============================================

export const companyIdSchema = z.object({
  companyId: z.string().uuid('ID de empresa invalido'),
});

export const municipioCodigoSchema = z.object({
  companyId: z.string().uuid('ID de empresa invalido'),
  codigoMunicipio: z.string().length(7, 'Codigo IBGE deve ter 7 digitos'),
});

// ============================================
// Body Schemas
// ============================================

export const createNfseConfigSchema = z.object({
  codigoMunicipio: z.string().length(7, 'Codigo IBGE deve ter 7 digitos'),
  inscricaoMunicipal: z.string().optional(),
  rpaLogin: z.string().optional(),
  rpaPassword: z.string().optional(),
});

export const updateNfseConfigSchema = z.object({
  inscricaoMunicipal: z.string().optional(),
  rpaLogin: z.string().optional(),
  rpaPassword: z.string().optional(),
});

export const toggleNfseConfigSchema = z.object({
  isActive: z.boolean(),
});

// ============================================
// Type Exports
// ============================================

export type CompanyIdParams = z.infer<typeof companyIdSchema>;
export type MunicipioCodigoParams = z.infer<typeof municipioCodigoSchema>;
export type CreateNfseConfigInput = z.infer<typeof createNfseConfigSchema>;
export type UpdateNfseConfigInput = z.infer<typeof updateNfseConfigSchema>;
export type ToggleNfseConfigInput = z.infer<typeof toggleNfseConfigSchema>;
