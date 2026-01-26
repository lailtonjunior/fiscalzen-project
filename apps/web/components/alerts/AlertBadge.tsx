'use client';

import { useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useAlerts } from '@/lib/hooks/useAlerts';
import {
    Button
} from '@fiscalzen/ui';

interface AlertBadgeProps {
    onClick?: () => void;
}

export function AlertBadge({ onClick }: AlertBadgeProps) {
    const { summary, fetchSummary } = useAlerts();

    useEffect(() => {
        fetchSummary();
        const interval = setInterval(fetchSummary, 60000); // Poll every minute
        return () => clearInterval(interval);
    }, [fetchSummary]);

    return (
        <Button
            variant="ghost"
            size="icon"
            className="relative rounded-full"
            onClick={onClick}
        >
            <Bell className="h-5 w-5" />
            {summary.naoLidos > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                    {summary.naoLidos > 9 ? '9+' : summary.naoLidos}
                </span>
            )}
        </Button>
    );
}
