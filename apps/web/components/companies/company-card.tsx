'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from '@fiscalzen/ui';
import {
  Building2,
  FileText,
  RefreshCw,
  Settings,
  Shield,
  ShieldAlert,
  ShieldX,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { CompanyWithStats } from '@/lib/types';

interface CompanyCardProps {
  company: CompanyWithStats;
  onSync?: () => void;
  syncing?: boolean;
}

function formatCnpj(cnpj: string) {
  return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

function getCertificateStatus(company: CompanyWithStats) {
  if (!company.hasCertificate) {
    return {
      icon: ShieldX,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      label: 'Sem certificado',
    };
  }

  if (company.certificateExpiry) {
    const expiryDate = new Date(company.certificateExpiry);
    const now = new Date();
    const daysUntilExpiry = Math.ceil(
      (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilExpiry <= 0) {
      return {
        icon: ShieldX,
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        label: 'Expirado',
      };
    }

    if (daysUntilExpiry <= 30) {
      return {
        icon: ShieldAlert,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        label: `Expira em ${daysUntilExpiry} dias`,
      };
    }
  }

  return {
    icon: Shield,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    label: 'Valido',
  };
}

export function CompanyCard({ company, onSync, syncing }: CompanyCardProps) {
  const certStatus = getCertificateStatus(company);
  const CertIcon = certStatus.icon;

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="line-clamp-1 text-base">
              {company.razaoSocial}
            </CardTitle>
            <p className="font-mono text-sm text-muted-foreground">
              {formatCnpj(company.cnpj)}
            </p>
          </div>
        </div>
        <Badge variant="outline">{company.uf}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Documentos</span>
          </div>
          <span className="font-semibold">
            {company.documentsCount.toLocaleString('pt-BR')}
          </span>
        </div>

        {/* Certificate Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`rounded-full p-1 ${certStatus.bgColor}`}>
              <CertIcon className={`h-4 w-4 ${certStatus.color}`} />
            </div>
            <span className="text-sm">{certStatus.label}</span>
          </div>
        </div>

        {/* Monitoring badges */}
        <div className="flex flex-wrap gap-2">
          {company.monitorNfe && (
            <Badge variant="secondary" className="bg-green-50 text-green-700">
              NFe
            </Badge>
          )}
          {company.monitorCte && (
            <Badge variant="secondary" className="bg-blue-50 text-blue-700">
              CTe
            </Badge>
          )}
          {company.monitorMdfe && (
            <Badge variant="secondary" className="bg-orange-50 text-orange-700">
              MDFe
            </Badge>
          )}
        </div>

        {/* Last sync */}
        {company.lastSync && (
          <p className="text-xs text-muted-foreground">
            Ultima sincronizacao:{' '}
            {formatDistanceToNow(new Date(company.lastSync), {
              addSuffix: true,
              locale: ptBR,
            })}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onSync}
            disabled={syncing || !company.hasCertificate}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`}
            />
            Sincronizar
          </Button>
          <Link href={`/empresas/${company.id}`}>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
