import { z } from 'zod';

export const docTypes = ['NFE', 'NFSE', 'CTE', 'MDFE', 'SAT', 'NFCE'] as const;
export type DocType = (typeof docTypes)[number];

export const documentStatuses = ['autorizada', 'cancelada', 'inutilizada', 'denegada'] as const;
export type DocumentStatus = (typeof documentStatuses)[number];

export const documentSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  companyId: z.string().uuid(),
  docType: z.enum(docTypes),
  chave: z.string().length(44).nullable(),
  numero: z.number().int().positive(),
  serie: z.number().int().min(0),
  emitCnpj: z.string().length(14),
  emitRazao: z.string().max(255),
  destCnpjCpf: z.string().max(14).nullable(),
  destRazao: z.string().max(255).nullable(),
  valorTotal: z.number().min(0),
  dataEmissao: z.string().or(z.date()),
  dataAutorizacao: z.string().or(z.date()).nullable(),
  dataCaptura: z.string().or(z.date()),
  situacao: z.enum(documentStatuses),
  xmlStorageKey: z.string().nullable(),
  xmlHashSha256: z.string().length(64).nullable(),
  xmlSizeBytes: z.number().int().positive().nullable(),
  metadata: z.record(z.unknown()).nullable(),
  searchContent: z.string().nullable(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
});

export type Document = z.infer<typeof documentSchema>;

export const documentEventSchema = z.object({
  id: z.string().uuid(),
  documentId: z.string().uuid(),
  eventType: z.string().max(50),
  eventSeq: z.number().int().nullable(),
  eventDate: z.string().or(z.date()).nullable(),
  protocol: z.string().max(50).nullable(),
  description: z.string().nullable(),
  xmlStorageKey: z.string().nullable(),
  metadata: z.record(z.unknown()).nullable(),
  createdAt: z.string().or(z.date()),
});

export type DocumentEvent = z.infer<typeof documentEventSchema>;

export const createDocumentSchema = documentSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  dataCaptura: true,
});

export type CreateDocument = z.infer<typeof createDocumentSchema>;
