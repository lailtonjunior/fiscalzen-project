import { z } from 'zod';

export const manifestacaoBaseSchema = z.object({
  chNFe: z.string().length(44, 'Chave de acesso deve ter 44 digitos'),
  companyId: z.string().uuid('Company ID invalido'),
});

export const cienciaSchema = manifestacaoBaseSchema;

export const confirmacaoSchema = manifestacaoBaseSchema;

export const desconhecimentoSchema = manifestacaoBaseSchema;

export const naoRealizadaSchema = manifestacaoBaseSchema.extend({
  justificativa: z
    .string()
    .min(15, 'Justificativa deve ter no minimo 15 caracteres')
    .max(255, 'Justificativa deve ter no maximo 255 caracteres'),
});

// CTe - Prestação em Desacordo (610110)
export const desacordoSchema = z.object({
  chCTe: z.string().length(44, 'Chave de acesso deve ter 44 digitos'),
  companyId: z.string().uuid('Company ID invalido'),
  observacao: z
    .string()
    .min(15, 'Observacao deve ter no minimo 15 caracteres')
    .max(255, 'Observacao deve ter no maximo 255 caracteres'),
  indDesacordoOper: z.enum(['1', '2', '3', '4'], {
    errorMap: () => ({
      message:
        'Indicador invalido. Use: 1-Servico nao prestado, 2-Dados incorretos, 3-Valor divergente, 4-Outros',
    }),
  }),
});

export const pendentesQuerySchema = z.object({
  companyId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

export type CienciaInput = z.infer<typeof cienciaSchema>;
export type ConfirmacaoInput = z.infer<typeof confirmacaoSchema>;
export type DesconhecimentoInput = z.infer<typeof desconhecimentoSchema>;
export type NaoRealizadaInput = z.infer<typeof naoRealizadaSchema>;
export type DesacordoInput = z.infer<typeof desacordoSchema>;
export type PendentesQuery = z.infer<typeof pendentesQuerySchema>;
