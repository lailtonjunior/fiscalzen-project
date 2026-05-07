'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, apiRaw, type ApiEnvelope } from '../api';
import type {
  DocumentAttachment,
  Document,
  DocumentFilters,
  DocumentHistoryItem,
  DocumentWithEvents,
  PaginatedCollection,
} from '../types';

// ============================================
// Query Keys
// ============================================

export const documentKeys = {
  all: ['documents'] as const,
  lists: () => [...documentKeys.all, 'list'] as const,
  list: (filters: DocumentFilters) => [...documentKeys.lists(), filters] as const,
  details: () => [...documentKeys.all, 'detail'] as const,
  detail: (id: string) => [...documentKeys.details(), id] as const,
  history: (id: string) => [...documentKeys.detail(id), 'history'] as const,
  attachments: (id: string) => [...documentKeys.detail(id), 'attachments'] as const,
  search: (query: string) => [...documentKeys.all, 'search', query] as const,
};

async function extractBlobErrorMessage(error: unknown, fallback: string) {
  const responseData = (error as { response?: { data?: unknown } })?.response?.data;

  if (responseData instanceof Blob) {
    try {
      const text = await responseData.text();
      const parsed = JSON.parse(text) as { error?: { message?: string } };
      return parsed.error?.message || fallback;
    } catch {
      return fallback;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

// ============================================
// Hooks
// ============================================

export function useDocuments(filters: DocumentFilters = {}) {
  return useQuery({
    queryKey: documentKeys.list(filters),
    queryFn: async () => {
      const response = await apiRaw.get<ApiEnvelope<Document[]>>('/api/v1/documents', {
        params: {
          companyId: filters.companyId,
          docType: filters.docType,
          situacao: filters.situacao,
          dataInicio: filters.startDate ? new Date(`${filters.startDate}T00:00:00.000Z`).toISOString() : undefined,
          dataFim: filters.endDate ? new Date(`${filters.endDate}T23:59:59.999Z`).toISOString() : undefined,
          search: filters.search,
          page: filters.page,
          limit: filters.pageSize,
        },
      });

      return {
        items: response.data.data ?? [],
        meta: response.data.meta,
        pagination: response.data.pagination,
      } satisfies PaginatedCollection<Document>;
    },
  });
}

export function useDocument(id: string) {
  return useQuery({
    queryKey: documentKeys.detail(id),
    queryFn: async () => {
      const response = await api.get<DocumentWithEvents>(`/api/v1/documents/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useDocumentSearch(query: string) {
  return useQuery({
    queryKey: documentKeys.search(query),
    queryFn: async () => {
      const response = await api.get<Document[]>('/api/v1/documents/search', {
        params: { q: query },
      });
      return response.data ?? [];
    },
    enabled: query.length >= 3,
  });
}

export function useDocumentHistory(id: string) {
  return useQuery({
    queryKey: documentKeys.history(id),
    queryFn: async () => {
      const response = await api.get<DocumentHistoryItem[]>(`/api/v1/documents/${id}/history`);
      return response.data ?? [];
    },
    enabled: !!id,
  });
}

export function useDocumentAttachments(id: string) {
  return useQuery({
    queryKey: documentKeys.attachments(id),
    queryFn: async () => {
      const response = await api.get<DocumentAttachment[]>(`/api/v1/documents/${id}/attachments`);
      return response.data ?? [];
    },
    enabled: !!id,
  });
}

export function useDownloadXml() {
  return useMutation({
    mutationFn: async (documentId: string) => {
      try {
        const response = await api.get<Blob>(`/api/v1/documents/${documentId}/xml`, {
          responseType: 'blob',
        });
        const blob = response.data;
        const url = window.URL.createObjectURL(blob);
        const anchor = window.document.createElement('a');
        anchor.href = url;
        anchor.download = `${documentId}.xml`;
        window.document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        window.URL.revokeObjectURL(url);
        return true;
      } catch (error) {
        throw new Error(await extractBlobErrorMessage(error, 'Falha ao baixar XML do documento.'));
      }
    },
  });
}

export function useDownloadPdf() {
  return useMutation({
    mutationFn: async (documentId: string) => {
      try {
        const response = await api.get<Blob>(`/api/v1/documents/${documentId}/pdf/download`, {
          responseType: 'blob',
        });
        const blob = response.data;
        const url = window.URL.createObjectURL(blob);
        const anchor = window.document.createElement('a');
        anchor.href = url;
        anchor.download = `${documentId}.pdf`;
        window.document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        window.URL.revokeObjectURL(url);
        return true;
      } catch (error) {
        throw new Error(await extractBlobErrorMessage(error, 'Falha ao gerar ou baixar PDF do documento.'));
      }
    },
  });
}

export function useUploadDocuments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });

      const response = await api.post<{ uploaded: number; errors: string[] }>(
        '/api/v1/documents/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
    },
  });
}
