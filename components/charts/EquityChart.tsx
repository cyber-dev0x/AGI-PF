'use client';

import { format } from 'date-fns';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { EquityPoint } from '@/lib/types';
import { formatUSD } from '@/lib/utils';

export function EquityChart({ data }: { data: EquityPoint[] }) {
  const normalized = data.map((point) => ({
    time: point.timestamp,
    equity: point.equityUsd,
  }));

  return (
    <div className="chart-shell">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={normalized} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#9dff37" stopOpacity={0.38} />
              <stop offset="100%" stopColor="#9dff37" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="4 6" stroke="rgba(175, 255, 112, 0.12)" />
          <XAxis
            dataKey="time"
            tickFormatter={(value) => format(new Date(value), 'HH:mm')}
            tick={{ fill: '#87a879', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            minTickGap={38}
          />
          <YAxis
            tickFormatter={(value) => formatUSD(Number(value), 0)}
            tick={{ fill: '#87a879', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={72}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: '1px solid rgba(165, 255, 97, 0.3)',
              background: 'rgba(6, 14, 9, 0.95)',
              boxShadow: '0 14px 40px rgba(0,0,0,0.4)',
            }}
            labelStyle={{ color: '#90b27e' }}
            formatter={(value) => {
              const normalized = Array.isArray(value) ? Number(value[0] ?? 0) : Number(value ?? 0);
              return [formatUSD(normalized), 'Equity'];
            }}
            labelFormatter={(value) => format(new Date(value), 'MMM d, HH:mm:ss')}
          />
          <Area type="monotone" dataKey="equity" stroke="#b4ff5f" strokeWidth={2} fill="url(#equityFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
