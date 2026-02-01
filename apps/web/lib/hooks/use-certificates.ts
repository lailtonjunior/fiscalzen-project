'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from './useApiClient';

// ============================================
// Types
// ============================================

export interface CertificateStatus {
  companyId: string;
  companyName: string;
  cnpj: string;
  status: 'valid' | 'expiring' | 'expired' | 'missing';
  daysUntilExpiry: number | null;
  expiryDate: string | null;
  validFrom: string | null;
  issuer: string | null;
  thumbprint: string | null;
}

export interface CertificateSummary {
  total: number;
  valid: number;
  expiring: number;
  expired: number;
  missing: number;
}

// ============================================
// Query Keys
// ============================================

export const certificateKeys = {
  all: ['certificates'] as const,
  summary: () => [...certificateKeys.all, 'summary'] as const,
  list: () => [...certificateKeys.all, 'list'] as const,
  detail: (companyId: string) => [...certificateKeys.all, 'detail', companyId] as const,
};

// ============================================
// Hooks
// ============================================

export function useCertificateSummary() {
  const { getApiClient, isLoaded } = useApiClient();

  return useQuery({
    queryKey: certificateKeys.summary(),
    queryFn: async () => {
      const api = await getApiClient();
      const response = await api.get<CertificateSummary>('/certificates/summary');
      return response.data;
    },
    enabled: isLoaded,
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useCertificates() {
  const { getApiClient, isLoaded } = useApiClient();

  return useQuery({
    queryKey: certificateKeys.list(),
    queryFn: async () => {
      const api = await getApiClient();
      const response = await api.get<CertificateStatus[]>('/certificates');
      return response.data;
    },
    enabled: isLoaded,
    staleTime: 60 * 1000,
  });
}

export function useCertificateDetail(companyId: string) {
  const { getApiClient, isLoaded } = useApiClient();

  return useQuery({
    queryKey: certificateKeys.detail(companyId),
    queryFn: async () => {
      const api = await getApiClient();
      const response = await api.get<CertificateStatus>(`/certificates/${companyId}`);
      return response.data;
    },
    enabled: isLoaded && !!companyId,
  });
}

export function useUploadCertificate() {
  const { getApiClient } = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      companyId,
      file,
      password,
    }: {
      companyId: string;
      file: File;
      password: string;
    }) => {
      const api = await getApiClient();
      const formData = new FormData();
      formData.append('certificate', file);
      formData.append('password', password);

      const response = await api.upload<{ expiry: string }>(
        `/companies/${companyId}/certificate`,
        formData
      );
      return response.data;
    },
    onSuccess: (_, { companyId }) => {
      queryClient.invalidateQueries({ queryKey: certificateKeys.all });
      queryClient.invalidateQueries({ queryKey: ['companies', companyId] });
    },
  });
}

export function useValidateCertificate() {
  const { getApiClient } = useApiClient();

  return useMutation({
    mutationFn: async (companyId: string) => {
      const api = await getApiClient();
      const response = await api.post<CertificateStatus>(
        `/certificates/${companyId}/validate`
      );
      return response.data;
    },
  });
}
