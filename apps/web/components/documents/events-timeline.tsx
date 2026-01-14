'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@fiscalzen/ui';
import { Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import type { DocumentEvent } from '@/lib/types';

interface EventsTimelineProps {
  events?: DocumentEvent[];
}

const eventTypeLabels: Record<string, string> = {
  '110111': 'Cancelamento',
  '210200': 'Confirmacao da Operacao',
  '210210': 'Ciencia da Emissao',
  '210220': 'Desconhecimento da Operacao',
  '210240': 'Operacao nao Realizada',
};

const eventIcons: Record<string, typeof CheckCircle2> = {
  '110111': XCircle,
  '210200': CheckCircle2,
  '210210': AlertCircle,
  '210220': XCircle,
  '210240': XCircle,
};

const eventColors: Record<string, string> = {
  '110111': 'text-red-500 bg-red-100',
  '210200': 'text-green-500 bg-green-100',
  '210210': 'text-blue-500 bg-blue-100',
  '210220': 'text-orange-500 bg-orange-100',
  '210240': 'text-yellow-500 bg-yellow-100',
};

export function EventsTimeline({ events }: EventsTimelineProps) {
  if (!events || events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Eventos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Nenhum evento registrado</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Eventos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 h-full w-0.5 bg-gray-200" />

          {/* Events */}
          <div className="space-y-6">
            {events.map((event) => {
              const Icon = eventIcons[event.tpEvento] || AlertCircle;
              const colorClass = eventColors[event.tpEvento] || 'text-gray-500 bg-gray-100';

              return (
                <div key={event.id} className="relative flex gap-4">
                  {/* Icon */}
                  <div
                    className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full ${colorClass}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 pt-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">
                        {eventTypeLabels[event.tpEvento] || event.descEvento}
                      </h4>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(event.dhEvento), 'dd/MM/yyyy HH:mm')}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Protocolo: {event.nProt || 'N/A'}
                    </p>
                    {event.xMotivo && (
                      <p className="mt-1 text-sm">{event.xMotivo}</p>
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
