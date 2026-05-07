'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, apiRaw, type ApiEnvelope } from '../api';
import type {
  Document,
  ManifestacaoTipo,
  PendingManifestation,
  AwaitingFinal,
  ManifestacaoHistoryItem,
} from '../types';
import { documentKeys } from './use-documents';

interface PendingManifestacaoApiItem {
  id: string;
  chave: string;
  numero: string;
  serie: string;
  dataEmissao: string;
  valorTotal: string;
  emitRazaoSocial: string;
  emitCnpj: string;
  createdAt: string;
  companyId?: string;
  nsu?: string;
}

interface BatchManifestacaoResult {
  processed: number;
  failed: number;
  errors: Array<{ documentId: string; error: string }>;
}

interface PendingManifestacaoCountResponse {
  count: number;
}

const DAY_IN_MS = 24 * 60 * 60 * 1000;

// ============================================
// Query Keys
// ============================================

export const manifestacaoKeys = {
  all: ['manifestacao'] as const,
  pending: (companyId?: string) => [...manifestacaoKeys.all, 'pending', companyId] as const,
  pendingCiencia: (companyId?: string) => [...manifestacaoKeys.all, 'pending-ciencia', companyId] as const,
  awaitingFinal: (companyId?: string) => [...manifestacaoKeys.all, 'awaiting-final', companyId] as const,
  history: (filters?: { companyId?: string; page?: number }) =>
    [...manifestacaoKeys.all, 'history', filters] as const,
  count: (companyId?: string) => [...manifestacaoKeys.all, 'count', companyId] as const,
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Erro desconhecido';
}

function toPendingDocument(item: PendingManifestacaoApiItem): Document {
  return {
    id: item.id,
    tenantId: '',
    companyId: item.companyId ?? '',
    chave: item.chave,
    numero: item.numero,
    serie: item.serie,
    docType: 'NFE',
    situacao: 'pendente',
    dataEmissao: item.dataEmissao,
    valorTotal: item.valorTotal,
    emitCnpj: item.emitCnpj,
    emitRazaoSocial: item.emitRazaoSocial,
    uf: '',
    nsu: item.nsu,
    createdAt: item.createdAt,
    updatedAt: item.createdAt,
  };
}

function getDaysPending(date: string) {
  const emissionDate = new Date(date).getTime();
  const now = Date.now();
  return Math.max(0, Math.floor((now - emissionDate) / DAY_IN_MS));
}

async function fetchPendingManifestacoes(companyId?: string): Promise<PendingManifestation[]> {
  const response = await api.get<PendingManifestacaoApiItem[]>('/api/v1/manifestacao/pendentes', {
    params: {
      companyId,
      page: 1,
      limit: 100,
    },
  });

  const items = response.data ?? [];
  return items.map((item) => ({
    document: toPendingDocument(item),
    daysPending: getDaysPending(item.dataEmissao),
  }));
}

async function submitManifestacao({
  documentId,
  tipo,
  justificativa,
}: {
  documentId: string;
  tipo: ManifestacaoTipo;
  justificativa?: string;
}) {
  const response = await api.post(`/api/v1/manifestacao/${documentId}`, {
    tipo,
    justificativa,
  });
  return response.data;
}

async function processBatchManifestacao({
  documentIds,
  tipo,
}: {
  documentIds: string[];
  tipo: ManifestacaoTipo;
}): Promise<BatchManifestacaoResult> {
  const results = await Promise.allSettled(
    documentIds.map(async (documentId) =>
      submitManifestacao({
        documentId,
        tipo,
      })
    )
  );

  const errors = results.flatMap((result, index) =>
    result.status === 'rejected'
      ? [{ documentId: documentIds[index], error: getErrorMessage(result.reason) }]
      : []
  );

  return {
    processed: results.length - errors.length,
    failed: errors.length,
    errors,
  };
}

// ============================================
// Queries
// ============================================

export function usePendingManifestations(companyId?: string) {
  return useQuery({
    queryKey: manifestacaoKeys.pending(companyId),
    queryFn: () => fetchPendingManifestacoes(companyId),
    refetchInterval: 5 * 60 * 1000,
  });
}

export function usePendingCiencia(companyId?: string) {
  return useQuery({
    queryKey: manifestacaoKeys.pendingCiencia(companyId),
    queryFn: async () => {
      const pendingItems = await fetchPendingManifestacoes(companyId);
      return pendingItems.map(({ document, daysPending }) => ({
        id: document.id,
        chave: document.chave,
        emitCnpj: document.emitCnpj,
        emitRazaoSocial: document.emitRazaoSocial,
        valorTotal: document.valorTotal,
        dataEmissao: document.dataEmissao,
        nsu: document.nsu ?? '',
        companyId: document.companyId,
        companyName: '',
        daysPending,
        isUrgent: daysPending > 7,
      }));
    },
    refetchInterval: 5 * 60 * 1000,
  });
}

export function useAwaitingFinal(companyId?: string) {
  return useQuery({
    queryKey: manifestacaoKeys.awaitingFinal(companyId),
    queryFn: async () => {
      const response = await api.get<Array<Document & { manifestacaoData?: string }>>('/api/v1/manifestacao/awaiting-final', {
        params: {
          companyId,
          page: 1,
          limit: 100,
        },
      });

      const items = response.data ?? [];
      return items.map((document) => {
        const cienciaData = document.manifestacaoData ?? document.updatedAt;
        const remainingMs = new Date(cienciaData).getTime() + 180 * DAY_IN_MS - Date.now();
        const daysUntilDeadline = Math.max(0, Math.ceil(remainingMs / DAY_IN_MS));

        return {
          document,
          cienciaData,
          daysUntilDeadline,
          isNearDeadline: daysUntilDeadline <= 15,
        } satisfies AwaitingFinal;
      });
    },
    refetchInterval: 5 * 60 * 1000,
  });
}

export function useManifestacaoHistory(filters?: { companyId?: string; page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: manifestacaoKeys.history(filters),
    queryFn: async () => {
      const response = await apiRaw.get<ApiEnvelope<ManifestacaoHistoryItem[]>>('/api/v1/manifestacao/history', {
        params: {
          companyId: filters?.companyId,
          page: filters?.page ?? 1,
          limit: filters?.pageSize ?? 20,
        },
      });

      return {
        items: response.data.data ?? [],
        total: response.data.pagination?.total ?? response.data.meta?.total ?? 0,
        page: filters?.page ?? 1,
        pageSize: filters?.pageSize ?? 20,
      };
    },
  });
}

export function usePendingCount(companyId?: string) {
  return useQuery({
    queryKey: manifestacaoKeys.count(companyId),
    queryFn: async () => {
      const response = await api.get<PendingManifestacaoCountResponse & { pendingCiencia?: number; awaitingFinal?: number; total?: number }>('/api/v1/manifestacao/count', {
        params: { companyId },
      });
      const pendingCiencia = response.data.pendingCiencia ?? response.data.count;
      const awaitingFinal = response.data.awaitingFinal ?? 0;

      return {
        pendingCiencia,
        awaitingFinal,
        total: response.data.total ?? pendingCiencia + awaitingFinal,
      };
    },
    refetchInterval: 2 * 60 * 1000,
  });
}

// ============================================
// Mutations
// ============================================

export function useManifestar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      documentId,
      tipo,
      justificativa,
    }: {
      documentId: string;
      tipo: ManifestacaoTipo;
      justificativa?: string;
    }) =>
      submitManifestacao({
        documentId,
        tipo,
        justificativa,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: manifestacaoKeys.all });
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
    },
  });
}

export function useDarCiencia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentId: string) =>
      submitManifestacao({
        documentId,
        tipo: '210210',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: manifestacaoKeys.all });
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
    },
  });
}

export function useManifestarBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      documentIds,
      tipo,
    }: {
      documentIds: string[];
      tipo: ManifestacaoTipo;
    }) =>
      processBatchManifestacao({
        documentIds,
        tipo,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: manifestacaoKeys.all });
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
    },
  });
}

export function useBatchCiencia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentIds: string[]) =>
      processBatchManifestacao({
        documentIds,
        tipo: '210210',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: manifestacaoKeys.all });
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
    },
  });
}

// ============================================
// Helper Constants
// ============================================

export const MANIFESTACAO_TIPOS = {
  '210200': {
    codigo: '210200',
    nome: 'Confirmacao da Operacao',
    descricao: 'Confirma que a operacao foi realizada',
  },
  '210210': {
    codigo: '210210',
    nome: 'Ciencia da Emissao',
    descricao: 'Ciencia de que a NFe foi emitida (permite download do XML completo)',
  },
  '210220': {
    codigo: '210220',
    nome: 'Desconhecimento da Operacao',
    descricao: 'Desconhece a operacao (nao efetuou a compra)',
  },
  '210240': {
    codigo: '210240',
    nome: 'Operacao nao Realizada',
    descricao: 'A operacao foi acordada mas nao concluida',
    requiresJustificativa: true,
  },
} as const;

// ============================================
// Helper Functions
// ============================================

export function getManifestacaoStatusLabel(tipo: ManifestacaoTipo): string {
  return MANIFESTACAO_TIPOS[tipo]?.nome ?? 'Desconhecido';
}

export function getManifestacaoStatusColor(tipo: ManifestacaoTipo): string {
  switch (tipo) {
    case '210200':
      return 'bg-green-100 text-green-800';
    case '210210':
      return 'bg-blue-100 text-blue-800';
    case '210220':
      return 'bg-red-100 text-red-800';
    case '210240':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}
