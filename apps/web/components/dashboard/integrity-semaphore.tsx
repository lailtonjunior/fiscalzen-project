'use client';

import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '@fiscalzen/ui';
import { AlertCircle, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { IntegrityStatus } from '@/lib/types';

interface IntegritySemaphoreProps {
  status?: IntegrityStatus;
  loading?: boolean;
}

const statusConfig = {
  green: {
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    dotColor: 'bg-green-500',
    label: 'Tudo OK',
    description: 'Nenhuma lacuna detectada',
  },
  yellow: {
    icon: AlertTriangle,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    dotColor: 'bg-yellow-500',
    label: 'Atencao',
    description: 'Lacunas menores detectadas',
  },
  red: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    dotColor: 'bg-red-500',
    label: 'Problema',
    description: 'Lacunas criticas detectadas',
  },
};

export function IntegritySemaphore({ status, loading }: IntegritySemaphoreProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Integridade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentStatus = status?.status || 'green';
  const config = statusConfig[currentStatus];
  const Icon = config.icon;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Integridade
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className={cn('flex h-16 w-16 items-center justify-center rounded-full', config.bgColor)}>
            <div className={cn('h-10 w-10 rounded-full', config.dotColor)} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Icon className={cn('h-5 w-5', config.color)} />
              <p className={cn('text-lg font-semibold', config.color)}>
                {status?.message || config.label}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              {status?.gaps?.length
                ? `${status.gaps.length} lacuna(s) detectada(s)`
                : config.description}
            </p>
          </div>
        </div>

        {/* Gaps list */}
        {status?.gaps && status.gaps.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium">Lacunas:</p>
            <div className="max-h-32 overflow-y-auto rounded-lg border p-2">
              {status.gaps.slice(0, 5).map((gap, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between border-b py-2 text-sm last:border-0"
                >
                  <span className="font-medium">{gap.companyName}</span>
                  <span className="text-muted-foreground">
                    {gap.docType}: NSU {gap.startNsu} - {gap.endNsu}
                  </span>
                </div>
              ))}
              {status.gaps.length > 5 && (
                <p className="py-2 text-center text-sm text-muted-foreground">
                  +{status.gaps.length - 5} lacunas
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
