'use client';

import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '@fiscalzen/ui';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import type { TimelineData } from '@/lib/types';

// ============================================
// Timeline Chart
// ============================================

interface TimelineChartProps {
  data?: TimelineData[];
  loading?: boolean;
}

export function TimelineChart({ data, loading }: TimelineChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Documentos por Dia</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const chartData = data?.map((item) => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    }),
  })) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Documentos por Dia</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                />
                <YAxis tick={{ fontSize: 12 }} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="NFE"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  name="NFe"
                />
                <Line
                  type="monotone"
                  dataKey="CTE"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  name="CTe"
                />
                <Line
                  type="monotone"
                  dataKey="MDFE"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={false}
                  name="MDFe"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              Nenhum dado disponivel
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// Docs By Type Chart
// ============================================

interface DocsByTypeChartProps {
  data?: {
    NFE: number;
    CTE: number;
    MDFE: number;
  };
  loading?: boolean;
}

const COLORS = {
  NFE: '#10b981',
  CTE: '#3b82f6',
  MDFE: '#f59e0b',
};

export function DocsByTypeChart({ data, loading }: DocsByTypeChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Documentos por Tipo</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="mx-auto h-[200px] w-[200px] rounded-full" />
        </CardContent>
      </Card>
    );
  }

  const chartData = data
    ? [
        { name: 'NFe', value: data.NFE, color: COLORS.NFE },
        { name: 'CTe', value: data.CTE, color: COLORS.CTE },
        { name: 'MDFe', value: data.MDFE, color: COLORS.MDFE },
      ].filter((item) => item.value > 0)
    : [];

  const total = chartData.reduce((acc, item) => acc + item.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Documentos por Tipo</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          {total > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => value.toLocaleString('pt-BR')}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              Nenhum documento
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
