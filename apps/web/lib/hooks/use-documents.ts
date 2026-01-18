'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import type { Document, DocumentWithEvents, DocumentFilters } from '../types';

// ============================================
// Query Keys
// ============================================

export const documentKeys = {
  all: ['documents'] as const,
  lists: () => [...documentKeys.all, 'list'] as const,
  list: (filters: DocumentFilters) => [...documentKeys.lists(), filters] as const,
  details: () => [...documentKeys.all, 'detail'] as const,
  detail: (id: string) => [...documentKeys.details(), id] as const,
  search: (query: string) => [...documentKeys.all, 'search', query] as const,
};

// ============================================
// Hooks
// ============================================

export function useDocuments(filters: DocumentFilters = {}) {
  return useQuery({
    queryKey: documentKeys.list(filters),
    queryFn: async () => {
      const response = await api.get<Document[]>('/api/v1/documents', {
        companyId: filters.companyId,
        docType: filters.docType,
        situacao: filters.situacao,
        startDate: filters.startDate,
        endDate: filters.endDate,
        search: filters.search,
        page: filters.page,
        pageSize: filters.pageSize,
      });
      return response;
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
        q: query,
      });
      return response;
    },
    enabled: query.length >= 3,
  });
}

export function useDownloadXml() {
  return useMutation({
    mutationFn: async (documentId: string) => {
      const response = await api.get<{ url: string }>(`/api/v1/documents/${documentId}/xml`);
      if (response.data?.url) {
        window.open(response.data.url, '_blank');
      }
      return response.data;
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

      const response = await api.upload<{ uploaded: number; errors: string[] }>(
        '/api/v1/documents/upload',
        formData
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
    },
  });
}
