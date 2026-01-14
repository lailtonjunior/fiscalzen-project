'use client';

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
import { AlertCircle, Eye, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import type { PendingCiencia } from '@/lib/types';

interface ResumoModalProps {
  item: PendingCiencia | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDarCiencia: () => void;
  onDesconhecer: () => void;
  isLoading?: boolean;
}

function formatCurrency(value: string | number) {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numValue);
}

function formatCnpj(cnpj: string) {
  return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

export function ResumoModal({
  item,
  open,
  onOpenChange,
  onDarCiencia,
  onDesconhecer,
  isLoading,
}: ResumoModalProps) {
  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Resumo da NF-e
          </DialogTitle>
          <DialogDescription>
            Informacoes do resumo (resNFe) recebido da SEFAZ
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <InfoItem label="Chave de Acesso" value={item.chave} />
            </div>
            <InfoItem label="Emitente" value={item.emitRazaoSocial} />
            <InfoItem label="CNPJ Emitente" value={formatCnpj(item.emitCnpj)} />
            <InfoItem label="Valor Total" value={formatCurrency(item.valorTotal)} />
            <InfoItem
              label="Data Emissao"
              value={format(new Date(item.dataEmissao), 'dd/MM/yyyy')}
            />
            <InfoItem label="NSU" value={item.nsu} />
            <InfoItem
              label="Pendente ha"
              value={item.daysPending === 0 ? 'Hoje' : `${item.daysPending} dia(s)`}
            />
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Para visualizar os itens e detalhes completos da NF-e, e necessario
              registrar a <strong>Ciencia da Operacao</strong>.
            </AlertDescription>
          </Alert>

          {item.isUrgent && (
            <Alert variant="warning">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Este documento esta pendente ha mais de 7 dias. O prazo maximo para
                manifestacao e de 180 dias.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onDesconhecer}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <XCircle className="h-4 w-4" />
            Desconhecer
          </Button>
          <Button onClick={onDarCiencia} disabled={isLoading}>
            {isLoading ? 'Processando...' : 'Dar Ciencia'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
