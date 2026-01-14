'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, Badge, Skeleton } from '@fiscalzen/ui';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Document } from '@/lib/types';

interface RecentDocumentsProps {
  documents?: Document[];
  loading?: boolean;
}

const docTypeColors = {
  NFE: 'bg-green-100 text-green-800',
  CTE: 'bg-blue-100 text-blue-800',
  MDFE: 'bg-orange-100 text-orange-800',
};

const situacaoColors = {
  autorizada: 'bg-green-100 text-green-800',
  cancelada: 'bg-red-100 text-red-800',
  denegada: 'bg-red-100 text-red-800',
  pendente: 'bg-yellow-100 text-yellow-800',
};

function formatCurrency(value: string | number) {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numValue);
}

export function RecentDocuments({ documents, loading }: RecentDocumentsProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ultimos Documentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Ultimos Documentos</CardTitle>
        <Link
          href="/documentos"
          className="text-sm text-primary hover:underline"
        >
          Ver todos
        </Link>
      </CardHeader>
      <CardContent>
        {documents && documents.length > 0 ? (
          <div className="space-y-4">
            {documents.slice(0, 10).map((doc) => (
              <Link
                key={doc.id}
                href={`/documentos/${doc.id}`}
                className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-gray-50"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge className={docTypeColors[doc.docType]}>
                      {doc.docType}
                    </Badge>
                    <span className="font-medium">
                      {doc.numero}/{doc.serie}
                    </span>
                    <Badge variant="outline" className={situacaoColors[doc.situacao]}>
                      {doc.situacao}
                    </Badge>
                  </div>
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    {doc.emitRazaoSocial}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(doc.dataEmissao), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </p>
                </div>
                <div className="ml-4 text-right">
                  <p className="font-medium">{formatCurrency(doc.valorTotal)}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="py-4 text-center text-muted-foreground">
            Nenhum documento capturado ainda.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
