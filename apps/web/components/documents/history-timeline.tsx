'use client';

import { Card, CardContent, CardHeader, CardTitle, Badge } from '@fiscalzen/ui';
import { AlertCircle, CheckCircle2, Clock3, Download, FileArchive, RefreshCw, ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';
import type { DocumentHistoryItem } from '@/lib/types';

interface HistoryTimelineProps {
  items?: DocumentHistoryItem[];
  isLoading?: boolean;
  errorMessage?: string | null;
}

const eventStyles: Record<string, { icon: typeof Clock3; className: string; label?: string }> = {
  'document.synced': { icon: RefreshCw, className: 'text-blue-700 bg-blue-50', label: 'Sincronizacao' },
  'document.summary.synced': { icon: RefreshCw, className: 'text-blue-700 bg-blue-50', label: 'Resumo sincronizado' },
  'document.uploaded': { icon: RefreshCw, className: 'text-blue-700 bg-blue-50', label: 'Upload manual' },
  'download.batch.queued': { icon: FileArchive, className: 'text-amber-700 bg-amber-50', label: 'Lote enfileirado' },
  'download.batch.processing_started': { icon: FileArchive, className: 'text-amber-700 bg-amber-50', label: 'Lote em processamento' },
  'download.batch.completed': { icon: CheckCircle2, className: 'text-green-700 bg-green-50', label: 'Lote concluido' },
  'download.batch.accessed': { icon: Download, className: 'text-emerald-700 bg-emerald-50', label: 'ZIP acessado' },
  'download.batch.failed': { icon: ShieldAlert, className: 'text-red-700 bg-red-50', label: 'Falha no lote' },
  '110111': { icon: ShieldAlert, className: 'text-red-700 bg-red-50', label: 'Cancelamento' },
  '210200': { icon: CheckCircle2, className: 'text-green-700 bg-green-50', label: 'Confirmacao' },
  '210210': { icon: AlertCircle, className: 'text-blue-700 bg-blue-50', label: 'Ciencia' },
  '210220': { icon: AlertCircle, className: 'text-orange-700 bg-orange-50', label: 'Desconhecimento' },
  '210240': { icon: AlertCircle, className: 'text-yellow-700 bg-yellow-50', label: 'Nao realizada' },
  '610110': { icon: AlertCircle, className: 'text-orange-700 bg-orange-50', label: 'Desacordo' },
};

function eventLabel(item: DocumentHistoryItem) {
  return eventStyles[item.eventType]?.label ?? item.eventType.split('.').join(' ');
}

function formatDateTime(value?: string) {
  if (!value) {
    return 'Data indisponivel';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Data invalida';
  }

  return format(date, 'dd/MM/yyyy HH:mm');
}

export function HistoryTimeline({ items, isLoading, errorMessage }: HistoryTimelineProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock3 className="h-5 w-5" />
            Historico
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Carregando eventos do ciclo fiscal...</p>
        </CardContent>
      </Card>
    );
  }

  if (errorMessage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock3 className="h-5 w-5" />
            Historico
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{errorMessage}</p>
        </CardContent>
      </Card>
    );
  }

  if (!items || items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock3 className="h-5 w-5" />
            Historico
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Nenhum evento auditavel disponivel para este documento.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock3 className="h-5 w-5" />
          Historico
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div className="absolute left-4 top-0 h-full w-0.5 bg-border" />
          <div className="space-y-6">
            {items.map((item) => {
              const style = eventStyles[item.eventType] ?? {
                icon: item.kind === 'fiscal-event' ? CheckCircle2 : AlertCircle,
                className: item.kind === 'fiscal-event' ? 'text-sky-700 bg-sky-50' : 'text-slate-700 bg-slate-100',
              };
              const Icon = style.icon;
              const protocol = typeof item.details?.protocol === 'string' ? item.details.protocol : null;
              const motivo = typeof item.details?.xMotivo === 'string' ? item.details.xMotivo : null;
              const detailEntries = Object.entries(item.details ?? {})
                .filter(([key, value]) => !['protocol', 'xMotivo'].includes(key) && value !== null && value !== undefined)
                .slice(0, 4);

              return (
                <div key={item.id} className="relative flex gap-4">
                  <div className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full ${style.className}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1 pt-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-medium">{item.title}</h4>
                        <Badge variant="outline">{eventLabel(item)}</Badge>
                        <Badge variant="secondary">{item.kind === 'fiscal-event' ? 'SEFAZ' : item.source}</Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {formatDateTime(item.createdAt)}
                      </span>
                    </div>
                    {item.summary && <p className="mt-1 text-sm text-muted-foreground">{item.summary}</p>}
                    {protocol && <p className="mt-1 text-sm">Protocolo: {protocol}</p>}
                    {motivo && <p className="mt-1 text-sm">{motivo}</p>}
                    {detailEntries.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {detailEntries.map(([key, value]) => (
                          <span key={key} className="rounded bg-muted px-2 py-1">
                            {key}: {String(value)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
