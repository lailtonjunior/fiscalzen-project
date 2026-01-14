'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import type { NfseConfig, NfseConfigFormData, MunicipioInfo, NfseTestResult } from '../types';

// ============================================
// Query Keys
// ============================================

export const nfseKeys = {
  all: ['nfse'] as const,
  configs: (companyId: string) => [...nfseKeys.all, 'configs', companyId] as const,
  config: (companyId: string, codigoMunicipio: string) =>
    [...nfseKeys.configs(companyId), codigoMunicipio] as const,
  municipios: () => [...nfseKeys.all, 'municipios'] as const,
  municipio: (codigo: string) => [...nfseKeys.municipios(), codigo] as const,
};

// ============================================
// Queries
// ============================================

export function useNfseConfigs(companyId: string) {
  return useQuery({
    queryKey: nfseKeys.configs(companyId),
    queryFn: async () => {
      const response = await api.get<NfseConfig[]>(`/companies/${companyId}/nfse`);
      return response.data;
    },
    enabled: !!companyId,
  });
}

export function useNfseConfig(companyId: string, codigoMunicipio: string) {
  return useQuery({
    queryKey: nfseKeys.config(companyId, codigoMunicipio),
    queryFn: async () => {
      const response = await api.get<NfseConfig>(
        `/companies/${companyId}/nfse/${codigoMunicipio}`
      );
      return response.data;
    },
    enabled: !!companyId && !!codigoMunicipio,
  });
}

export function useMunicipios() {
  return useQuery({
    queryKey: nfseKeys.municipios(),
    queryFn: async () => {
      const response = await api.get<MunicipioInfo[]>('/nfse/municipios');
      return response.data;
    },
    staleTime: 1000 * 60 * 60, // 1 hour - municipalities don't change often
  });
}

export function useMunicipio(codigo: string) {
  return useQuery({
    queryKey: nfseKeys.municipio(codigo),
    queryFn: async () => {
      const response = await api.get<MunicipioInfo>(`/nfse/municipios/${codigo}`);
      return response.data;
    },
    enabled: !!codigo,
  });
}

// ============================================
// Mutations
// ============================================

export function useCreateNfseConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      companyId,
      data,
    }: {
      companyId: string;
      data: NfseConfigFormData;
    }) => {
      const response = await api.post<NfseConfig>(
        `/companies/${companyId}/nfse`,
        data
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: nfseKeys.configs(variables.companyId),
      });
    },
  });
}

export function useUpdateNfseConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      companyId,
      codigoMunicipio,
      data,
    }: {
      companyId: string;
      codigoMunicipio: string;
      data: Partial<NfseConfigFormData>;
    }) => {
      const response = await api.patch<NfseConfig>(
        `/companies/${companyId}/nfse/${codigoMunicipio}`,
        data
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: nfseKeys.configs(variables.companyId),
      });
    },
  });
}

export function useDeleteNfseConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      companyId,
      codigoMunicipio,
    }: {
      companyId: string;
      codigoMunicipio: string;
    }) => {
      await api.delete(`/companies/${companyId}/nfse/${codigoMunicipio}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: nfseKeys.configs(variables.companyId),
      });
    },
  });
}

export function useToggleNfseConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      companyId,
      codigoMunicipio,
      isActive,
    }: {
      companyId: string;
      codigoMunicipio: string;
      isActive: boolean;
    }) => {
      const response = await api.patch<NfseConfig>(
        `/companies/${companyId}/nfse/${codigoMunicipio}/toggle`,
        { isActive }
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: nfseKeys.configs(variables.companyId),
      });
    },
  });
}

export function useTestNfseConnection() {
  return useMutation({
    mutationFn: async ({
      companyId,
      codigoMunicipio,
    }: {
      companyId: string;
      codigoMunicipio: string;
    }) => {
      const response = await api.post<NfseTestResult>(
        `/companies/${companyId}/nfse/${codigoMunicipio}/test`
      );
      return response.data;
    },
  });
}

export function useTriggerNfseSync() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      companyId,
      codigoMunicipio,
    }: {
      companyId: string;
      codigoMunicipio: string;
    }) => {
      const response = await api.post(
        `/companies/${companyId}/nfse/${codigoMunicipio}/sync`
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: nfseKeys.configs(variables.companyId),
      });
    },
  });
}
