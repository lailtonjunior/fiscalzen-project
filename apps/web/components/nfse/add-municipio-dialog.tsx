'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
} from '@fiscalzen/ui';
import { Plus, ArrowLeft, ArrowRight } from 'lucide-react';
import { MunicipioSelector } from './municipio-selector';
import { NfseConfigForm } from './nfse-config-form';
import type { MunicipioInfo, NfseConfigFormData } from '@/lib/types';

interface AddMunicipioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: NfseConfigFormData) => Promise<void>;
  onTest?: (codigoMunicipio: string) => Promise<{ success: boolean; message: string }>;
  excludeCodigos?: string[];
  loading?: boolean;
  testLoading?: boolean;
}

type Step = 'select' | 'configure';

export function AddMunicipioDialog({
  open,
  onOpenChange,
  onSubmit,
  onTest,
  excludeCodigos = [],
  loading,
  testLoading,
}: AddMunicipioDialogProps) {
  const [step, setStep] = useState<Step>('select');
  const [selectedMunicipio, setSelectedMunicipio] = useState<MunicipioInfo | null>(
    null
  );

  const handleClose = () => {
    setStep('select');
    setSelectedMunicipio(null);
    onOpenChange(false);
  };

  const handleSelect = (municipio: MunicipioInfo) => {
    setSelectedMunicipio(municipio);
  };

  const handleNext = () => {
    if (selectedMunicipio) {
      setStep('configure');
    }
  };

  const handleBack = () => {
    setStep('select');
  };

  const handleSubmit = async (data: NfseConfigFormData) => {
    await onSubmit(data);
    handleClose();
  };

  const handleTest = async () => {
    if (!selectedMunicipio || !onTest) {
      return { success: false, message: 'Municipio nao selecionado' };
    }
    return onTest(selectedMunicipio.codigo);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {step === 'select'
              ? 'Adicionar Municipio'
              : `Configurar ${selectedMunicipio?.nome}`}
          </DialogTitle>
          <DialogDescription>
            {step === 'select'
              ? 'Selecione o municipio para configurar a integracao NFSe'
              : 'Preencha os dados necessarios para a integracao'}
          </DialogDescription>
        </DialogHeader>

        {step === 'select' ? (
          <div className="space-y-4">
            <MunicipioSelector
              onSelect={handleSelect}
              selectedCodigo={selectedMunicipio?.codigo}
              excludeCodigos={excludeCodigos}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button onClick={handleNext} disabled={!selectedMunicipio}>
                Proximo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : selectedMunicipio ? (
          <div className="space-y-4">
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <NfseConfigForm
              municipio={selectedMunicipio}
              onSubmit={handleSubmit}
              onTest={onTest ? handleTest : undefined}
              loading={loading}
              testLoading={testLoading}
            />
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
