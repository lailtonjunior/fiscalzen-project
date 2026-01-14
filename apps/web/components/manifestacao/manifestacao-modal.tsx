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
  RadioGroup,
  RadioGroupItem,
  Label,
  Textarea,
} from '@fiscalzen/ui';
import { FileCheck } from 'lucide-react';
import { format } from 'date-fns';
import type { Document, ManifestacaoTipo } from '@/lib/types';
import { MANIFESTACAO_TIPOS } from '@/lib/hooks/use-manifestacao';

interface ManifestacaoModalProps {
  document: Document | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onManifestar: (tipo: ManifestacaoTipo, justificativa?: string) => void;
  isLoading?: boolean;
}

function formatCurrency(value: string | number) {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numValue);
}

export function ManifestacaoModal({
  document: doc,
  open,
  onOpenChange,
  onManifestar,
  isLoading,
}: ManifestacaoModalProps) {
  const [selectedTipo, setSelectedTipo] = useState<ManifestacaoTipo>('210200');
  const [justificativa, setJustificativa] = useState('');

  const handleSubmit = () => {
    if (selectedTipo === '210240' && justificativa.length < 15) {
      return;
    }
    onManifestar(selectedTipo, selectedTipo === '210240' ? justificativa : undefined);
  };

  const handleClose = () => {
    setSelectedTipo('210200');
    setJustificativa('');
    onOpenChange(false);
  };

  if (!doc) return null;

  const canSubmit =
    selectedTipo !== '210240' ||
    (justificativa.length >= 15 && justificativa.length <= 255);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            Manifestar Documento
          </DialogTitle>
          <DialogDescription>
            Selecione o tipo de manifestacao para o documento
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Document info */}
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="font-medium">{doc.emitRazaoSocial}</p>
            <div className="mt-1 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span>NFe {doc.numero}</span>
              <span>{formatCurrency(doc.valorTotal)}</span>
              <span>{format(new Date(doc.dataEmissao), 'dd/MM/yyyy')}</span>
            </div>
          </div>

          {/* Tipo selection */}
          <div className="space-y-3">
            <Label>Tipo de Manifestacao</Label>
            <RadioGroup
              value={selectedTipo}
              onValueChange={(value) => setSelectedTipo(value as ManifestacaoTipo)}
              className="space-y-3"
            >
              {/* Confirmation */}
              <div className="flex items-start space-x-3 rounded-lg border p-3 hover:bg-gray-50">
                <RadioGroupItem value="210200" id="210200" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="210200" className="cursor-pointer font-medium">
                    {MANIFESTACAO_TIPOS['210200'].nome}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Confirmo o recebimento da mercadoria/servico
                  </p>
                </div>
              </div>

              {/* Unknown */}
              <div className="flex items-start space-x-3 rounded-lg border p-3 hover:bg-gray-50">
                <RadioGroupItem value="210220" id="210220" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="210220" className="cursor-pointer font-medium">
                    {MANIFESTACAO_TIPOS['210220'].nome}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Desconheco esta operacao
                  </p>
                </div>
              </div>

              {/* Not performed */}
              <div className="flex items-start space-x-3 rounded-lg border p-3 hover:bg-gray-50">
                <RadioGroupItem value="210240" id="210240" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="210240" className="cursor-pointer font-medium">
                    {MANIFESTACAO_TIPOS['210240'].nome}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    A operacao foi acordada mas nao concluida
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Justificativa for 210240 */}
          {selectedTipo === '210240' && (
            <div className="space-y-2">
              <Label>
                Justificativa <span className="text-red-500">*</span>
              </Label>
              <Textarea
                placeholder="Informe o motivo da operacao nao realizada (min. 15 caracteres)"
                value={justificativa}
                onChange={(e) => setJustificativa(e.target.value)}
                minLength={15}
                maxLength={255}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                {justificativa.length}/255 caracteres (minimo 15)
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !canSubmit}>
            {isLoading ? 'Processando...' : 'Confirmar Manifestacao'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
