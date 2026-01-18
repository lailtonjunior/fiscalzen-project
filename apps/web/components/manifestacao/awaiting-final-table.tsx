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
import { Clock, Eye, FileCheck } from 'lucide-react';
import { format } from 'date-fns';
import { useAwaitingFinal, useManifestar } from '@/lib/hooks/use-manifestacao';
import { ManifestacaoModal } from './manifestacao-modal';
import { BatchManifestacaoDialog } from './batch-manifestacao-dialog';
import type { Document, ManifestacaoTipo } from '@/lib/types';

function formatCurrency(value: string | number) {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numValue);
}

interface AwaitingFinalTableProps {
  companyId?: string;
}

export function AwaitingFinalTable({ companyId }: AwaitingFinalTableProps) {
  const { data: awaitingItems, isLoading } = useAwaitingFinal(companyId);
  const manifestar = useManifestar();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [batchTipo, setBatchTipo] = useState<ManifestacaoTipo>('210200');

  const handleSelectAll = (checked: boolean) => {
    if (checked && awaitingItems) {
      setSelectedIds(awaitingItems.map((item) => item.document.id));
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

  const handleManifestar = async (tipo: ManifestacaoTipo, justificativa?: string) => {
    if (!selectedDocument) return;
    try {
      await manifestar.mutateAsync({
        documentId: selectedDocument.id,
        tipo,
        justificativa,
      });
      setSelectedDocument(null);
    } catch (error) {
      console.error('Failed to manifestar:', error);
    }
  };

  const handleBatchConfirm = () => {
    setBatchTipo('210200');
    setShowBatchDialog(true);
  };

  const handleBatchComplete = () => {
    setSelectedIds([]);
    setShowBatchDialog(false);
  };

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

  if (!awaitingItems || awaitingItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-12">
        <FileCheck className="h-12 w-12 text-green-500" />
        <h2 className="mt-4 text-lg font-semibold">Nenhum documento aguardando</h2>
        <p className="mt-1 text-muted-foreground">
          Nao ha documentos aguardando manifestacao final.
        </p>
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Aguardando Manifestacao Final
            <Badge variant="secondary">{awaitingItems.length}</Badge>
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="select-all-awaiting"
                checked={selectedIds.length === awaitingItems.length}
                onCheckedChange={handleSelectAll}
              />
              <label htmlFor="select-all-awaiting" className="text-sm">
                Selecionar todos
              </label>
            </div>
            {selectedIds.length > 0 && (
              <Button size="sm" onClick={handleBatchConfirm}>
                Confirmar em Lote ({selectedIds.length})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {awaitingItems.map(({ document, cienciaData, daysUntilDeadline, isNearDeadline }) => (
              <div
                key={document.id}
                className={`flex items-center gap-4 rounded-lg border p-4 ${
                  isNearDeadline ? 'border-yellow-200 bg-yellow-50' : ''
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
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      Ciencia OK
                    </Badge>
                    {isNearDeadline && (
                      <Badge variant="default" className="bg-yellow-100 text-yellow-800">
                        {daysUntilDeadline} dias restantes
                      </Badge>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span>NFe {document.numero}</span>
                    <span>{formatCurrency(document.valorTotal)}</span>
                    <span>
                      Emitida em {format(new Date(document.dataEmissao), 'dd/MM/yyyy')}
                    </span>
                    <span>
                      Ciencia em {format(new Date(cienciaData), 'dd/MM/yyyy')}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link href={`/documentos/${document.id}`}>
                    <Button variant="ghost" size="icon">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDocument(document)}
                  >
                    <FileCheck className="mr-2 h-4 w-4" />
                    Manifestar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <ManifestacaoModal
        document={selectedDocument}
        open={!!selectedDocument}
        onOpenChange={() => setSelectedDocument(null)}
        onManifestar={handleManifestar}
        isLoading={manifestar.isPending}
      />

      <BatchManifestacaoDialog
        selectedIds={selectedIds}
        open={showBatchDialog}
        onOpenChange={setShowBatchDialog}
        onComplete={handleBatchComplete}
        tipo={batchTipo}
        title="Confirmacao em Lote"
      />
    </>
  );
}
