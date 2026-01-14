'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import type { Company, CompanyWithStats, CompanyFormData, NsuControl } from '../types';

// ============================================
// Query Keys
// ============================================

export const companyKeys = {
  all: ['companies'] as const,
  lists: () => [...companyKeys.all, 'list'] as const,
  list: () => [...companyKeys.lists()] as const,
  details: () => [...companyKeys.all, 'detail'] as const,
  detail: (id: string) => [...companyKeys.details(), id] as const,
  nsuControl: (id: string) => [...companyKeys.detail(id), 'nsu'] as const,
};

// ============================================
// Hooks
// ============================================

export function useCompanies() {
  return useQuery({
    queryKey: companyKeys.list(),
    queryFn: async () => {
      const response = await api.get<CompanyWithStats[]>('/api/v1/companies');
      return response.data ?? [];
    },
  });
}

export function useCompany(id: string) {
  return useQuery({
    queryKey: companyKeys.detail(id),
    queryFn: async () => {
      const response = await api.get<Company>(`/api/v1/companies/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCompanyNsuControl(companyId: string) {
  return useQuery({
    queryKey: companyKeys.nsuControl(companyId),
    queryFn: async () => {
      const response = await api.get<NsuControl[]>(`/api/v1/companies/${companyId}/nsu`);
      return response.data ?? [];
    },
    enabled: !!companyId,
  });
}

export function useCreateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CompanyFormData) => {
      const response = await api.post<Company>('/api/v1/companies', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyKeys.all });
    },
  });
}

export function useUpdateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CompanyFormData> }) => {
      const response = await api.patch<Company>(`/api/v1/companies/${id}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: companyKeys.all });
      queryClient.invalidateQueries({ queryKey: companyKeys.detail(variables.id) });
    },
  });
}

export function useDeleteCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/v1/companies/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyKeys.all });
    },
  });
}

export function useUploadCertificate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ companyId, file, password }: { companyId: string; file: File; password: string }) => {
      const formData = new FormData();
      formData.append('certificate', file);
      formData.append('password', password);

      const response = await api.upload<{ expiry: string }>(
        `/api/v1/companies/${companyId}/certificate`,
        formData
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: companyKeys.all });
      queryClient.invalidateQueries({ queryKey: companyKeys.detail(variables.companyId) });
    },
  });
}
