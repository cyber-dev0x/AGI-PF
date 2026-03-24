'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Position } from '@/lib/types';
import { formatUSD } from '@/lib/utils';

const palette = ['#9dff37', '#2de1ff', '#ffc948', '#ff7d57', '#b48cff', '#5be6a7', '#8ec7ff'];

export function AllocationDonut({ positions }: { positions: Position[] }) {
  const data = positions
    .map((position) => ({
      name: position.symbol,
      value: position.valueUsd,
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="donut-wrap">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={72}
            outerRadius={106}
            paddingAngle={4}
            stroke="none"
          >
            {data.map((_, index) => (
              <Cell key={index} fill={palette[index % palette.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => {
              const normalized = Array.isArray(value) ? Number(value[0] ?? 0) : Number(value ?? 0);
              return [formatUSD(normalized), 'Value'];
            }}
            contentStyle={{
              borderRadius: 12,
              border: '1px solid rgba(165, 255, 97, 0.3)',
              background: 'rgba(6, 14, 9, 0.94)',
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="donut-legend">
        {data.map((entry, index) => (
          <div className="legend-row" key={entry.name}>
            <span className="legend-dot" style={{ background: palette[index % palette.length] }} />
            <span>{entry.name}</span>
            <strong>{formatUSD(entry.value)}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
