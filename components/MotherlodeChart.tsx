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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center text-gray-500 dark:text-gray-400">
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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Motherlode Over Time</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
          <XAxis 
            dataKey="time" 
            tick={{ fontSize: 12 }}
            tickLine={{ stroke: '#9ca3af' }}
            angle={-45}
            textAnchor="end"
            height={80}
            className="dark:text-gray-300"
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            tickLine={{ stroke: '#9ca3af' }}
            className="dark:text-gray-300"
            domain={['auto', 'auto']}
            tickFormatter={(value) => `${(value / 1e6).toFixed(1)}M`}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              color: '#111827'
            }}
            labelStyle={{ color: '#111827', fontWeight: 'bold' }}
            formatter={(value: any) => [`${Number(value).toLocaleString()} ORE`, 'Motherlode']}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="motherlode_ore" 
            stroke="#10b981" 
            name="Motherlode ORE"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 text-right">
        Peak: {maxMotherlode.toLocaleString()} ORE
      </div>
    </div>
  );
}