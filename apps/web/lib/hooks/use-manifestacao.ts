'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import type {
  Document,
  ManifestacaoTipo,
  PendingManifestation,
  PendingCiencia,
  AwaitingFinal,
  ManifestacaoHistoryItem,
} from '../types';
import { documentKeys } from './use-documents';

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
  count: () => [...manifestacaoKeys.all, 'count'] as const,
};

// ============================================
// Queries
// ============================================

export function usePendingManifestations(companyId?: string) {
  return useQuery({
    queryKey: manifestacaoKeys.pending(companyId),
    queryFn: async () => {
      const response = await api.get<PendingManifestation[]>('/api/v1/manifestacao/pending', {
        companyId,
      });
      return response.data ?? [];
    },
    refetchInterval: 5 * 60 * 1000,
  });
}

export function usePendingCiencia(companyId?: string) {
  return useQuery({
    queryKey: manifestacaoKeys.pendingCiencia(companyId),
    queryFn: async () => {
      const response = await api.get<PendingCiencia[]>('/api/v1/manifestacao/pending-ciencia', {
        companyId,
      });
      return response.data ?? [];
    },
    refetchInterval: 5 * 60 * 1000,
  });
}

export function useAwaitingFinal(companyId?: string) {
  return useQuery({
    queryKey: manifestacaoKeys.awaitingFinal(companyId),
    queryFn: async () => {
      const response = await api.get<AwaitingFinal[]>('/api/v1/manifestacao/awaiting-final', {
        companyId,
      });
      return response.data ?? [];
    },
    refetchInterval: 5 * 60 * 1000,
  });
}

export function useManifestacaoHistory(filters?: { companyId?: string; page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: manifestacaoKeys.history(filters),
    queryFn: async () => {
      const response = await api.get<{
        items: ManifestacaoHistoryItem[];
        total: number;
        page: number;
        pageSize: number;
      }>('/api/v1/manifestacao/history', filters);
      return response.data ?? { items: [], total: 0, page: 1, pageSize: 20 };
    },
  });
}

export function usePendingCount() {
  return useQuery({
    queryKey: manifestacaoKeys.count(),
    queryFn: async () => {
      const response = await api.get<{
        pendingCiencia: number;
        awaitingFinal: number;
        total: number;
      }>('/api/v1/manifestacao/count');
      return response.data ?? { pendingCiencia: 0, awaitingFinal: 0, total: 0 };
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
    }) => {
      const response = await api.post<Document>(`/api/v1/manifestacao/${documentId}`, {
        tipo,
        justificativa,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: manifestacaoKeys.all });
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
    },
  });
}

export function useDarCiencia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentId: string) => {
      const response = await api.post<Document>(`/api/v1/manifestacao/${documentId}`, {
        tipo: '210210',
      });
      return response.data;
    },
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
    }) => {
      const response = await api.post<{ processed: number; errors: string[] }>(
        '/api/v1/manifestacao/batch',
        {
          documentIds,
          tipo,
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: manifestacaoKeys.all });
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
    },
  });
}

export function useBatchCiencia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentIds: string[]) => {
      const response = await api.post<{
        processed: number;
        failed: number;
        errors: Array<{ documentId: string; error: string }>;
      }>('/api/v1/manifestacao/batch-ciencia', {
        documentIds,
      });
      return response.data;
    },
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
