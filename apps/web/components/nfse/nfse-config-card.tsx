'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Switch,
  Alert,
  AlertDescription,
} from '@fiscalzen/ui';
import {
  Globe,
  Bot,
  RefreshCw,
  Trash2,
  Settings,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import type { NfseConfig } from '@/lib/types';

interface NfseConfigCardProps {
  config: NfseConfig;
  onToggle: (isActive: boolean) => void;
  onSync: () => void;
  onEdit: () => void;
  onDelete: () => void;
  toggleLoading?: boolean;
  syncLoading?: boolean;
}

export function NfseConfigCard({
  config,
  onToggle,
  onSync,
  onEdit,
  onDelete,
  toggleLoading,
  syncLoading,
}: NfseConfigCardProps) {
  const getSyncStatusBadge = () => {
    switch (config.syncStatus) {
      case 'syncing':
        return (
          <Badge variant="default" className="gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Sincronizando
          </Badge>
        );
      case 'success':
        return (
          <Badge variant="default" className="gap-1 bg-green-600">
            <CheckCircle className="h-3 w-3" />
            Sucesso
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            Erro
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            Aguardando
          </Badge>
        );
    }
  };

  return (
    <Card className={!config.isActive ? 'opacity-60' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              {config.tipo === 'abrasf' ? (
                <Globe className="h-5 w-5" />
              ) : (
                <Bot className="h-5 w-5" />
              )}
            </div>
            <div>
              <CardTitle className="text-base">
                {config.nomeMunicipio}
              </CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{config.uf}</span>
                <span>-</span>
                <span className="font-mono">{config.codigoMunicipio}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getSyncStatusBadge()}
            <Switch
              checked={config.isActive}
              onCheckedChange={onToggle}
              disabled={toggleLoading}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Config Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Tipo:</span>
            <p className="font-medium">
              {config.tipo === 'abrasf'
                ? `ABRASF ${config.versaoAbrasf || ''}`
                : 'RPA'}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Inscricao Municipal:</span>
            <p className="font-mono">
              {config.inscricaoMunicipal || 'Nao configurada'}
            </p>
          </div>
          {config.lastSync && (
            <div className="col-span-2">
              <span className="text-muted-foreground">Ultima sincronizacao:</span>
              <p>{format(new Date(config.lastSync), 'dd/MM/yyyy HH:mm')}</p>
            </div>
          )}
        </div>

        {/* Error Alert */}
        {config.lastError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="line-clamp-2">
              {config.lastError}
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 border-t pt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Settings className="mr-2 h-4 w-4" />
            Editar
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={onSync}
            disabled={!config.isActive || syncLoading}
          >
            {syncLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Sincronizar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
