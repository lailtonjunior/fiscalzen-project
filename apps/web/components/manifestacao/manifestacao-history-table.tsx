'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Skeleton,
} from '@fiscalzen/ui';
import { History, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { useManifestacaoHistory } from '@/lib/hooks/use-manifestacao';
import { ManifestacaoTipoBadge } from './manifestacao-badge';

function formatCurrency(value: string | number) {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numValue);
}

interface ManifestacaoHistoryTableProps {
  companyId?: string;
}

export function ManifestacaoHistoryTable({ companyId }: ManifestacaoHistoryTableProps) {
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data, isLoading } = useManifestacaoHistory({
    companyId,
    page,
    pageSize,
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / pageSize);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-12">
        <History className="h-12 w-12 text-muted-foreground" />
        <h2 className="mt-4 text-lg font-semibold">Nenhum historico</h2>
        <p className="mt-1 text-muted-foreground">
          Nao ha manifestacoes registradas.
        </p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Historico de Manifestacoes
        </CardTitle>
        <p className="text-sm text-muted-foreground">{total} registro(s)</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.document.id}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{item.document.emitRazaoSocial}</p>
                  <ManifestacaoTipoBadge tipo={item.tipo} />
                  {item.status === 'failed' ? (
                    <Badge variant="destructive">Falhou</Badge>
                  ) : (
                    <Badge variant="secondary">Concluida</Badge>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span>NFe {item.document.numero}</span>
                  <span>{formatCurrency(item.document.valorTotal)}</span>
                  <span>
                    Manifestado em {format(new Date(item.data), 'dd/MM/yyyy HH:mm')}
                  </span>
                  {item.protocolo && <span>Protocolo {item.protocolo}</span>}
                </div>
                {item.justificativa && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Justificativa: {item.justificativa}
                  </p>
                )}
                {item.erro && (
                  <p className="mt-1 text-sm text-destructive">
                    Erro: {item.erro}
                  </p>
                )}
              </div>

              <Link href={`/documentos/${item.document.id}`}>
                <Button variant="ghost" size="icon">
                  <Eye className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Pagina {page} de {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
