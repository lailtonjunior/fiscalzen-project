'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@fiscalzen/ui';
import { NfseConfigForm } from './nfse-config-form';
import type { NfseConfig, NfseConfigFormData, MunicipioInfo } from '@/lib/types';

interface EditNfseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: NfseConfig | null;
  onSubmit: (data: Partial<NfseConfigFormData>) => Promise<void>;
  onTest?: () => Promise<{ success: boolean; message: string } | undefined>;
  loading?: boolean;
  testLoading?: boolean;
}

export function EditNfseDialog({
  open,
  onOpenChange,
  config,
  onSubmit,
  onTest,
  loading,
  testLoading,
}: EditNfseDialogProps) {
  if (!config) return null;

  const municipio: MunicipioInfo = {
    codigo: config.codigoMunicipio,
    nome: config.nomeMunicipio,
    uf: config.uf,
    tipo: config.tipo,
    versaoAbrasf: config.versaoAbrasf,
    requiresRpa: config.tipo === 'rpa',
  };

  const handleSubmit = async (data: NfseConfigFormData) => {
    await onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar {config.nomeMunicipio}</DialogTitle>
          <DialogDescription>
            Atualize as configuracoes de integracao NFSe
          </DialogDescription>
        </DialogHeader>

        <NfseConfigForm
          municipio={municipio}
          initialData={{
            codigoMunicipio: config.codigoMunicipio,
            inscricaoMunicipal: config.inscricaoMunicipal || '',
            rpaLogin: config.rpaLogin || '',
            rpaPassword: '', // Don't show existing password
          }}
          onSubmit={handleSubmit}
          onTest={onTest}
          loading={loading}
          testLoading={testLoading}
        />
      </DialogContent>
    </Dialog>
  );
}
