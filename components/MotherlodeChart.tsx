'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface MotherlodePoint {
  timestamp: string;
  motherlode_ore: number;
}

interface MotherlodeChartProps {
  data: MotherlodePoint[];
}

export default function MotherlodeChart({ data }: MotherlodeChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-rore-card rounded-lg shadow p-6 border border-rore-border text-center text-rore-textSubtle">
        No motherlode data available
      </div>
    );
  }

  // Format data for chart
  const chartData = data.map((item) => ({
    ...item,
    time: new Date(item.timestamp).toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
  }));

  // Calculate useful stats for formatting
  const maxMotherlode = Math.max(...data.map(d => d.motherlode_ore));

  return (
    <div className="bg-rore-card rounded-lg shadow p-6 border border-rore-border">
      <h2 className="text-xl font-semibold mb-4 text-rore-text">Motherlode Over Time</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--relay-colors-gray-7)" />
          <XAxis 
            dataKey="time" 
            tick={{ fontSize: 12 }}
            tickLine={{ stroke: 'var(--relay-colors-gray-7)' }}
            angle={-45}
            textAnchor="end"
            height={80}
            className="text-rore-textMuted"
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            tickLine={{ stroke: 'var(--relay-colors-gray-7)' }}
            className="text-rore-textMuted"
            domain={['auto', 'auto']}
            tickFormatter={(value) => `${(value / 1e6).toFixed(1)}M`}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#111113',
              border: '1px solid #1a1a1f',
              borderRadius: '0.5rem',
              color: '#fafafa'
            }}
            labelStyle={{ color: '#fafafa', fontWeight: 'bold' }}
            formatter={(value: any) => [`${Number(value).toLocaleString()} ORE`, 'Motherlode']}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="motherlode_ore" 
            stroke="#a855f7" 
            name="Motherlode ORE"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="mt-2 text-sm text-rore-textMuted text-right">
        Peak: {maxMotherlode.toLocaleString()} ORE
      </div>
    </div>
  );
}