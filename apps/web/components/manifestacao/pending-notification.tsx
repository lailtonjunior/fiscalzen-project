'use client';

import Link from 'next/link';
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@fiscalzen/ui';
import { Bell, FileText, AlertTriangle, ChevronRight } from 'lucide-react';
import { usePendingCount, usePendingManifestations } from '@/lib/hooks/use-manifestacao';

function formatCurrency(value: string | number) {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numValue);
}

export function PendingNotification() {
  const { data: counts } = usePendingCount();
  const { data: pendingItems } = usePendingManifestations();

  const totalPending = counts?.total ?? 0;
  const recentItems = pendingItems?.slice(0, 5) ?? [];

  if (totalPending === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {totalPending > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center animate-pulse"
            >
              {totalPending > 99 ? '99+' : totalPending}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            Manifestacoes Pendentes
          </span>
          <Badge variant="secondary">{totalPending}</Badge>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {recentItems.length > 0 ? (
          <>
            {recentItems.map(({ document, daysPending }) => (
              <DropdownMenuItem key={document.id} asChild>
                <Link
                  href={`/documentos/${document.id}`}
                  className="flex flex-col items-start gap-1 cursor-pointer"
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="font-medium text-sm truncate max-w-[180px]">
                      {document.emitRazaoSocial}
                    </span>
                    {daysPending > 7 && (
                      <Badge variant="destructive" className="text-xs">
                        Urgente
                      </Badge>
                    )}
                  </div>
                  <div className="flex w-full items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      NFe {document.numero}
                    </span>
                    <span>{formatCurrency(document.valorTotal)}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {daysPending === 0
                      ? 'Recebida hoje'
                      : `Ha ${daysPending} dia${daysPending > 1 ? 's' : ''}`}
                  </span>
                </Link>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </>
        ) : (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Carregando...
          </div>
        )}

        <DropdownMenuItem asChild>
          <Link
            href="/manifestacao"
            className="flex items-center justify-center gap-2 cursor-pointer font-medium text-primary"
          >
            Ver todas as pendencias
            <ChevronRight className="h-4 w-4" />
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function PendingBadge() {
  const { data: counts } = usePendingCount();
  const totalPending = counts?.total ?? 0;

  if (totalPending === 0) {
    return null;
  }

  return (
    <Link href="/manifestacao">
      <Badge
        variant="destructive"
        className="animate-pulse cursor-pointer hover:bg-red-600"
      >
        {totalPending} pendente{totalPending > 1 ? 's' : ''}
      </Badge>
    </Link>
  );
}
