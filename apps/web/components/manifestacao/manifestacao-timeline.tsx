'use client';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  FileCheck,
  Eye,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
} from 'lucide-react';
import type { DocumentEvent, ManifestacaoTipo } from '@/lib/types';

interface TimelineItemProps {
  date: string;
  title: string;
  description?: string;
  icon: React.ReactNode;
  isLast?: boolean;
  variant?: 'default' | 'success' | 'error' | 'warning';
}

function TimelineItem({
  date,
  title,
  description,
  icon,
  isLast = false,
  variant = 'default',
}: TimelineItemProps) {
  const variantStyles = {
    default: 'bg-gray-100 text-gray-600',
    success: 'bg-green-100 text-green-600',
    error: 'bg-red-100 text-red-600',
    warning: 'bg-yellow-100 text-yellow-600',
  };

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full ${variantStyles[variant]}`}
        >
          {icon}
        </div>
        {!isLast && <div className="h-full w-0.5 bg-gray-200" />}
      </div>
      <div className="flex-1 pb-6">
        <p className="font-medium">{title}</p>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          {format(new Date(date), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })}
        </p>
      </div>
    </div>
  );
}

interface ManifestacaoTimelineProps {
  events: DocumentEvent[];
  manifestacao?: ManifestacaoTipo;
  manifestacaoData?: string;
  dataAutorizacao?: string;
}

export function ManifestacaoTimeline({
  events,
  manifestacao,
  manifestacaoData,
  dataAutorizacao,
}: ManifestacaoTimelineProps) {
  // Filter and sort manifestacao events
  const manifestacaoEvents = events
    .filter((e) =>
      ['210200', '210210', '210220', '210240'].includes(e.tpEvento)
    )
    .sort(
      (a, b) => new Date(a.dhEvento).getTime() - new Date(b.dhEvento).getTime()
    );

  const getEventIcon = (tpEvento: string) => {
    switch (tpEvento) {
      case '210200':
        return <CheckCircle2 className="h-5 w-5" />;
      case '210210':
        return <Eye className="h-5 w-5" />;
      case '210220':
        return <XCircle className="h-5 w-5" />;
      case '210240':
        return <AlertCircle className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  const getEventVariant = (
    tpEvento: string
  ): 'default' | 'success' | 'error' | 'warning' => {
    switch (tpEvento) {
      case '210200':
        return 'success';
      case '210210':
        return 'default';
      case '210220':
        return 'error';
      case '210240':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getEventTitle = (tpEvento: string) => {
    switch (tpEvento) {
      case '210200':
        return 'Operacao Confirmada';
      case '210210':
        return 'Ciencia Registrada';
      case '210220':
        return 'Operacao Desconhecida';
      case '210240':
        return 'Operacao Nao Realizada';
      default:
        return 'Evento';
    }
  };

  const items: Array<{
    date: string;
    title: string;
    description?: string;
    icon: React.ReactNode;
    variant: 'default' | 'success' | 'error' | 'warning';
  }> = [];

  // Add authorization event
  if (dataAutorizacao) {
    items.push({
      date: dataAutorizacao,
      title: 'NF-e Autorizada',
      description: 'Documento autorizado pela SEFAZ',
      icon: <FileCheck className="h-5 w-5" />,
      variant: 'success',
    });
  }

  // Add manifestacao events
  manifestacaoEvents.forEach((event) => {
    items.push({
      date: event.dhEvento,
      title: getEventTitle(event.tpEvento),
      description: `Evento ${event.tpEvento} - ${event.descEvento}`,
      icon: getEventIcon(event.tpEvento),
      variant: getEventVariant(event.tpEvento),
    });
  });

  // If no events but we have manifestacao data, show it
  if (manifestacaoEvents.length === 0 && manifestacao && manifestacaoData) {
    items.push({
      date: manifestacaoData,
      title: getEventTitle(manifestacao),
      description: `Evento ${manifestacao}`,
      icon: getEventIcon(manifestacao),
      variant: getEventVariant(manifestacao),
    });
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <Clock className="h-8 w-8" />
        <p className="mt-2 text-sm">Nenhum evento de manifestacao registrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {items.map((item, index) => (
        <TimelineItem
          key={index}
          date={item.date}
          title={item.title}
          description={item.description}
          icon={item.icon}
          variant={item.variant}
          isLast={index === items.length - 1}
        />
      ))}
    </div>
  );
}
