'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Alert,
  AlertDescription,
} from '@fiscalzen/ui';
import { AlertCircle, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useBatchCiencia, useManifestarBatch } from '@/lib/hooks/use-manifestacao';
import type { ManifestacaoTipo } from '@/lib/types';

interface BatchManifestacaoDialogProps {
  selectedIds: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
  tipo: ManifestacaoTipo;
  title?: string;
}

interface BatchResult {
  processed: number;
  failed: number;
  errors: Array<{ documentId: string; error: string }>;
}

export function BatchManifestacaoDialog({
  selectedIds,
  open,
  onOpenChange,
  onComplete,
  tipo,
  title,
}: BatchManifestacaoDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<BatchResult | null>(null);

  const batchCiencia = useBatchCiencia();
  const manifestarBatch = useManifestarBatch();

  const isCiencia = tipo === '210210';

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      let response;
      if (isCiencia) {
        response = await batchCiencia.mutateAsync(selectedIds);
      } else {
        response = await manifestarBatch.mutateAsync({
          documentIds: selectedIds,
          tipo,
        });
      }
      setResult({
        processed: response?.processed ?? selectedIds.length,
        failed: (response as Record<string, unknown>)?.failed as number ?? 0,
        errors: (response as Record<string, unknown>)?.errors as Array<{ documentId: string; error: string }> ?? [],
      });
    } catch (error) {
      setResult({
        processed: 0,
        failed: selectedIds.length,
        errors: [{ documentId: '', error: 'Erro ao processar lote' }],
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (result) {
      onComplete();
    }
    setResult(null);
    onOpenChange(false);
  };

  const tipoLabels: Record<ManifestacaoTipo, string> = {
    '210200': 'Confirmacao',
    '210210': 'Ciencia',
    '210220': 'Desconhecimento',
    '210240': 'Operacao Nao Realizada',
  };

  const dialogTitle = title ?? `${tipoLabels[tipo]} em Lote`;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>
            {result
              ? 'Processamento concluido'
              : `Processar ${selectedIds.length} documento(s)`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isProcessing ? (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
              <p className="text-center text-sm text-muted-foreground">
                Processando {selectedIds.length} documento(s)...
              </p>
              <p className="text-center text-xs text-muted-foreground">
                Aguarde, isso pode levar alguns segundos.
              </p>
            </div>
          ) : result ? (
            <div className="space-y-4 py-4">
              {result.failed === 0 ? (
                <div className="flex flex-col items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-12 w-12" />
                  <p className="font-medium">
                    {result.processed} documento(s) processado(s) com sucesso!
                  </p>
                </div>
              ) : result.processed === 0 ? (
                <div className="flex flex-col items-center gap-2 text-red-600">
                  <XCircle className="h-12 w-12" />
                  <p className="font-medium">Falha ao processar documentos</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-5 w-5" />
                    <span>{result.processed} processado(s)</span>
                  </div>
                  <div className="flex items-center gap-2 text-red-600">
                    <XCircle className="h-5 w-5" />
                    <span>{result.failed} com erro</span>
                  </div>
                </div>
              )}

              {result.errors.length > 0 && (
                <div className="max-h-32 overflow-y-auto rounded border p-2">
                  {result.errors.slice(0, 5).map((err, idx) => (
                    <p key={idx} className="text-xs text-red-600">
                      {err.error}
                    </p>
                  ))}
                  {result.errors.length > 5 && (
                    <p className="text-xs text-muted-foreground">
                      ... e mais {result.errors.length - 5} erro(s)
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <p>
                Voce esta prestes a registrar <strong>{tipoLabels[tipo]}</strong> em{' '}
                <strong>{selectedIds.length}</strong> documento(s).
              </p>

              {isCiencia && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Apos a ciencia, voce tera ate 180 dias para a manifestacao final.
                    Esta acao nao pode ser desfeita.
                  </AlertDescription>
                </Alert>
              )}

              {tipo === '210220' && (
                <Alert variant="warning">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Ao desconhecer a operacao, voce declara que nao efetuou a compra.
                    Use com cuidado.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {result ? (
            <Button onClick={handleClose}>Fechar</Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
                Cancelar
              </Button>
              <Button onClick={handleConfirm} disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  `Confirmar ${tipoLabels[tipo]}`
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
