'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Skeleton } from '@fiscalzen/ui';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { PendingManifestation } from '@/lib/types';

interface PendingAlertsProps {
  pendingItems?: PendingManifestation[];
  loading?: boolean;
}

function formatCurrency(value: string | number) {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numValue);
}

export function PendingAlerts({ pendingItems, loading }: PendingAlertsProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            Pendentes de Manifestacao
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const urgentItems = pendingItems?.filter((item) => item.daysPending > 7) || [];
  const recentItems = pendingItems?.filter((item) => item.daysPending <= 7) || [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          Pendentes de Manifestacao
          {pendingItems && pendingItems.length > 0 && (
            <Badge variant="destructive">{pendingItems.length}</Badge>
          )}
        </CardTitle>
        {pendingItems && pendingItems.length > 0 && (
          <Link href="/manifestacao">
            <Button variant="outline" size="sm">
              Ver todos
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        )}
      </CardHeader>
      <CardContent>
        {pendingItems && pendingItems.length > 0 ? (
          <div className="space-y-3">
            {/* Urgent items */}
            {urgentItems.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium text-red-600">
                  Urgente (+ de 7 dias)
                </p>
                {urgentItems.slice(0, 3).map(({ document, daysPending }) => (
                  <Link
                    key={document.id}
                    href={`/documentos/${document.id}`}
                    className="mb-2 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-3 transition-colors hover:bg-red-100"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{document.emitRazaoSocial}</p>
                      <p className="text-sm text-muted-foreground">
                        NFe {document.numero} - {formatCurrency(document.valorTotal)}
                      </p>
                    </div>
                    <Badge variant="destructive">{daysPending} dias</Badge>
                  </Link>
                ))}
              </div>
            )}

            {/* Recent items */}
            {recentItems.length > 0 && (
              <div>
                {urgentItems.length > 0 && (
                  <p className="mb-2 text-sm font-medium text-yellow-600">
                    Recentes
                  </p>
                )}
                {recentItems.slice(0, 3).map(({ document, daysPending }) => (
                  <Link
                    key={document.id}
                    href={`/documentos/${document.id}`}
                    className="mb-2 flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-gray-50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{document.emitRazaoSocial}</p>
                      <p className="text-sm text-muted-foreground">
                        NFe {document.numero} - {formatCurrency(document.valorTotal)}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {daysPending === 0 ? 'Hoje' : `${daysPending} dia(s)`}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">
              Nenhum documento pendente de manifestacao.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
