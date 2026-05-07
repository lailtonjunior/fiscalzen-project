'use client';

import { useEffect, useState } from 'react';
import type { Alerta } from '@/lib/hooks/useAlerts';
import { useAlerts } from '@/lib/hooks/useAlerts';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    Button,
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent
} from '@fiscalzen/ui';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AlertsPage() {
    const { alerts, fetchAlerts, markAsRead, markAllAsRead, loading } = useAlerts();
    const [activeTab, setActiveTab] = useState('all');
    const router = useRouter();

    useEffect(() => {
        fetchAlerts({
            limit: 50,
            lido: activeTab === 'unread' ? false : undefined
        });
    }, [fetchAlerts, activeTab]);

    const handleAlertClick = (alert: Alerta) => {
        markAsRead(alert.id);
        if (alert.documentId) {
            router.push(`/documents/${alert.documentId}`);
        }
    };

    return (
        <div className="container mx-auto py-6">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Central de Notificações</h1>
                    <p className="text-gray-500">Gerencie seus alertas e notificações importantes.</p>
                </div>
                <Button variant="outline" onClick={() => markAllAsRead()}>
                    Marcar todas como lidas
                </Button>
            </div>

            <Tabs defaultValue="all" onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="all">Todas</TabsTrigger>
                    <TabsTrigger value="unread">Não lidas</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-4 space-y-4">
                    {loading ? (
                        <div className="py-8 text-center text-gray-500">Carregando...</div>
                    ) : alerts.length === 0 ? (
                        <div className="py-8 text-center text-gray-500">
                            Nenhuma notificação encontrada.
                        </div>
                    ) : (
                        alerts.map((alert) => (
                            <Card
                                key={alert.id}
                                className={`cursor-pointer transition-colors hover:bg-gray-50 ${!alert.lido ? 'border-l-4 border-l-blue-500' : ''}`}
                                onClick={() => handleAlertClick(alert)}
                            >
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-base font-medium flex items-center gap-2">
                                            {alert.priority === 'ALTA' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                                            {alert.title}
                                        </CardTitle>
                                        <span className="text-xs text-gray-400 flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {new Date(alert.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                    <CardDescription>{alert.message}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex gap-2">
                                        {alert.lido ? (
                                            <span className="flex items-center text-xs text-green-600">
                                                <CheckCircle className="mr-1 h-3 w-3" /> Lida
                                            </span>
                                        ) : (
                                            <span className="flex items-center text-xs text-blue-600">
                                                Nova
                                            </span>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
