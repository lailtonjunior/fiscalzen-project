import type { DocumentStatus } from '../types/documents.js';

export interface SituacaoInfo {
  code: DocumentStatus;
  label: string;
  description: string;
  color: string;
  bgColor: string;
}

export const SITUACOES: Record<DocumentStatus, SituacaoInfo> = {
  autorizada: {
    code: 'autorizada',
    label: 'Autorizada',
    description: 'Documento fiscal válido e autorizado pela SEFAZ',
    color: '#10B981',
    bgColor: '#D1FAE5',
  },
  cancelada: {
    code: 'cancelada',
    label: 'Cancelada',
    description: 'Documento fiscal cancelado após autorização',
    color: '#EF4444',
    bgColor: '#FEE2E2',
  },
  inutilizada: {
    code: 'inutilizada',
    label: 'Inutilizada',
    description: 'Numeração inutilizada antes da emissão',
    color: '#6B7280',
    bgColor: '#F3F4F6',
  },
  denegada: {
    code: 'denegada',
    label: 'Denegada',
    description: 'Documento denegado pela SEFAZ',
    color: '#F97316',
    bgColor: '#FFEDD5',
  },
};

export function getSituacaoInfo(status: DocumentStatus): SituacaoInfo {
  return SITUACOES[status];
}

export function getAllSituacoes(): SituacaoInfo[] {
  return Object.values(SITUACOES);
}

export function getSituacaoOptions(): Array<{ value: DocumentStatus; label: string }> {
  return Object.values(SITUACOES).map((info) => ({
    value: info.code,
    label: info.label,
  }));
}
