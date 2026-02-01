'use client';

import { useEffect } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@fiscalzen/ui';
import { AlertBadge } from './AlertBadge';
import { useAlerts } from '@/lib/hooks/useAlerts';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function AlertsDropdown() {
    const { alerts, fetchAlerts, markAsRead, loading } = useAlerts();
    const router = useRouter();

    useEffect(() => {
        fetchAlerts({ limit: 5, lido: false });
    }, [fetchAlerts]);

    const handleAlertClick = (alert: any) => {
        markAsRead(alert.id);
        if (alert.documentId) {
            router.push(`/documents/${alert.documentId}`);
        }
    };

    const getIcon = (type: string) => {
        if (type === 'INFO') return <AlertTriangle className="mr-2 h-4 w-4 text-blue-500" />;
        return <AlertTriangle className="mr-2 h-4 w-4 text-amber-500" />;
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <div>
                    <AlertBadge />
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Notificações</span>
                    <Link href="/alerts" className="text-xs font-normal text-blue-600 hover:underline">
                        Ver todas
                    </Link>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {loading ? (
                    <div className="p-4 text-center text-sm text-gray-500">Carregando...</div>
                ) : alerts.length === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-500">
                        Sem novas notificações.
                    </div>
                ) : (
                    alerts.map((alert) => (
                        <DropdownMenuItem
                            key={alert.id}
                            className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                            onClick={() => handleAlertClick(alert)}
                        >
                            <div className="flex w-full items-center justify-between">
                                <span className="font-semibold text-sm flex items-center">
                                    {getIcon(alert.type)}
                                    {alert.title}
                                </span>
                                <span className="text-[10px] text-gray-400">
                                    {new Date(alert.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            <p className="text-xs text-gray-600 line-clamp-2">
                                {alert.message}
                            </p>
                        </DropdownMenuItem>
                    ))
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="cursor-pointer justify-center text-center">
                    <Link href="/alerts">Ver painel de alertas</Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
