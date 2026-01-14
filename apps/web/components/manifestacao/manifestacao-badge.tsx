'use client';

import { Badge } from '@fiscalzen/ui';
import { cn } from '@fiscalzen/ui';
import type { ManifestacaoStatus, ManifestacaoTipo } from '@/lib/types';

interface ManifestacaoBadgeProps {
  status: ManifestacaoStatus;
  className?: string;
}

const statusConfig: Record<
  ManifestacaoStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }
> = {
  nao_aplicavel: {
    label: 'N/A',
    variant: 'secondary',
    className: 'bg-gray-100 text-gray-600',
  },
  pendente_ciencia: {
    label: 'Aguardando Ciencia',
    variant: 'default',
    className: 'bg-yellow-100 text-yellow-800 animate-pulse',
  },
  ciencia_registrada: {
    label: 'Ciencia OK',
    variant: 'default',
    className: 'bg-blue-100 text-blue-800',
  },
  confirmada: {
    label: 'Confirmada',
    variant: 'default',
    className: 'bg-green-100 text-green-800',
  },
  desconhecida: {
    label: 'Desconhecida',
    variant: 'destructive',
    className: 'bg-red-100 text-red-800',
  },
  nao_realizada: {
    label: 'Nao Realizada',
    variant: 'default',
    className: 'bg-orange-100 text-orange-800',
  },
};

export function ManifestacaoBadge({ status, className }: ManifestacaoBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}

interface ManifestacaoTipoBadgeProps {
  tipo: ManifestacaoTipo;
  className?: string;
}

const tipoConfig: Record<ManifestacaoTipo, { label: string; className: string }> = {
  '210200': {
    label: 'Confirmada',
    className: 'bg-green-100 text-green-800',
  },
  '210210': {
    label: 'Ciencia',
    className: 'bg-blue-100 text-blue-800',
  },
  '210220': {
    label: 'Desconhecida',
    className: 'bg-red-100 text-red-800',
  },
  '210240': {
    label: 'Nao Realizada',
    className: 'bg-orange-100 text-orange-800',
  },
};

export function ManifestacaoTipoBadge({ tipo, className }: ManifestacaoTipoBadgeProps) {
  const config = tipoConfig[tipo];

  return (
    <Badge variant="secondary" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}

interface UrgencyBadgeProps {
  daysPending: number;
  className?: string;
}

export function UrgencyBadge({ daysPending, className }: UrgencyBadgeProps) {
  if (daysPending <= 5) {
    return null;
  }

  if (daysPending > 8) {
    return (
      <Badge variant="destructive" className={cn('animate-pulse', className)}>
        Critico ({daysPending} dias)
      </Badge>
    );
  }

  return (
    <Badge variant="default" className={cn('bg-yellow-100 text-yellow-800', className)}>
      Urgente ({daysPending} dias)
    </Badge>
  );
}
