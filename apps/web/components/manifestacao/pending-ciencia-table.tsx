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
  Checkbox,
  Skeleton,
} from '@fiscalzen/ui';
import { AlertTriangle, Eye, FileCheck, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { usePendingManifestations, useDarCiencia, useManifestar } from '@/lib/hooks/use-manifestacao';
import { UrgencyBadge } from './manifestacao-badge';
import { ResumoModal } from './resumo-modal';
import { BatchManifestacaoDialog } from './batch-manifestacao-dialog';
import type { Document, PendingCiencia } from '@/lib/types';

function formatCurrency(value: string | number) {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numValue);
}

interface PendingCienciaTableProps {
  companyId?: string;
}

export function PendingCienciaTable({ companyId }: PendingCienciaTableProps) {
  const { data: pendingItems, isLoading } = usePendingManifestations(companyId);
  const darCiencia = useDarCiencia();
  const manifestar = useManifestar();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedItem, setSelectedItem] = useState<PendingCiencia | null>(null);
  const [showBatchDialog, setShowBatchDialog] = useState(false);

  const handleSelectAll = (checked: boolean) => {
    if (checked && pendingItems) {
      setSelectedIds(pendingItems.map((item) => item.document.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    }
  };

  const handleDarCiencia = async () => {
    if (!selectedItem) return;
    try {
      await darCiencia.mutateAsync(selectedItem.id);
      setSelectedItem(null);
    } catch (error) {
      console.error('Failed to dar ciencia:', error);
    }
  };

  const handleDesconhecer = async () => {
    if (!selectedItem) return;
    try {
      await manifestar.mutateAsync({
        documentId: selectedItem.id,
        tipo: '210220',
      });
      setSelectedItem(null);
    } catch (error) {
      console.error('Failed to desconhecer:', error);
    }
  };

  const handleBatchComplete = () => {
    setSelectedIds([]);
    setShowBatchDialog(false);
  };

  // Convert PendingManifestation to PendingCiencia for modal
  const convertToModalItem = (doc: Document, daysPending: number): PendingCiencia => ({
    id: doc.id,
    chave: doc.chave,
    emitCnpj: doc.emitCnpj,
    emitRazaoSocial: doc.emitRazaoSocial,
    valorTotal: doc.valorTotal,
    dataEmissao: doc.dataEmissao,
    nsu: doc.nsu ?? '',
    companyId: doc.companyId,
    companyName: '',
    daysPending,
    isUrgent: daysPending > 7,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!pendingItems || pendingItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-12">
        <FileCheck className="h-12 w-12 text-green-500" />
        <h2 className="mt-4 text-lg font-semibold">Tudo em dia!</h2>
        <p className="mt-1 text-muted-foreground">
          Nao ha documentos pendentes de ciencia.
        </p>
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            Pendentes de Ciencia
            <Badge variant="secondary">{pendingItems.length}</Badge>
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="select-all"
                checked={selectedIds.length === pendingItems.length}
                onCheckedChange={handleSelectAll}
              />
              <label htmlFor="select-all" className="text-sm">
                Selecionar todos
              </label>
            </div>
            {selectedIds.length > 0 && (
              <Button size="sm" onClick={() => setShowBatchDialog(true)}>
                Ciencia em Lote ({selectedIds.length})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {pendingItems.map(({ document, daysPending }) => {
              const isUrgent = daysPending > 7;

              return (
                <div
                  key={document.id}
                  className={`flex items-center gap-4 rounded-lg border p-4 ${
                    isUrgent ? 'border-red-200 bg-red-50' : ''
                  }`}
                >
                  <Checkbox
                    checked={selectedIds.includes(document.id)}
                    onCheckedChange={(checked) =>
                      handleSelectOne(document.id, checked as boolean)
                    }
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{document.emitRazaoSocial}</p>
                      <UrgencyBadge daysPending={daysPending} />
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span>NFe {document.numero}</span>
                      <span>{formatCurrency(document.valorTotal)}</span>
                      <span>
                        Emitida em {format(new Date(document.dataEmissao), 'dd/MM/yyyy')}
                      </span>
                      <span className={isUrgent ? 'text-red-600 font-medium' : ''}>
                        {daysPending === 0 ? 'Hoje' : `${daysPending} dias`}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setSelectedItem(convertToModalItem(document, daysPending))
                      }
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setSelectedItem(convertToModalItem(document, daysPending))
                      }
                    >
                      <FileCheck className="mr-2 h-4 w-4" />
                      Manifestar
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <ResumoModal
        item={selectedItem}
        open={!!selectedItem}
        onOpenChange={() => setSelectedItem(null)}
        onDarCiencia={handleDarCiencia}
        onDesconhecer={handleDesconhecer}
        isLoading={darCiencia.isPending || manifestar.isPending}
      />

      <BatchManifestacaoDialog
        selectedIds={selectedIds}
        open={showBatchDialog}
        onOpenChange={setShowBatchDialog}
        onComplete={handleBatchComplete}
        tipo="210210"
        title="Ciencia em Lote"
      />
    </>
  );
}
