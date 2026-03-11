'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface PricePoint {
  timestamp: string;
  ore_price_usd: number;
  weth_price_usd: number;
}

interface PriceChartProps {
  data: PricePoint[];
}

export default function PriceChart({ data }: PriceChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center text-gray-500 dark:text-gray-400">
        No price data available
      </div>
    );
  }

  // Format data for chart
  const chartData = data.map((item) => ({
    ...item,
    time: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  }));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Price History (24h)</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
          <XAxis 
            dataKey="time" 
            tick={{ fontSize: 12 }}
            tickLine={{ stroke: '#9ca3af' }}
            className="dark:text-gray-300"
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            tickLine={{ stroke: '#9ca3af' }}
            className="dark:text-gray-300"
            domain={['auto', 'auto']}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              color: '#111827'
            }}
            labelStyle={{ color: '#111827', fontWeight: 'bold' }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="ore_price_usd" 
            stroke="#f59e0b" 
            name="ORE Price (USD)"
            strokeWidth={2}
            dot={false}
          />
          <Line 
            type="monotone" 
            dataKey="weth_price_usd" 
            stroke="#6366f1" 
            name="WETH Price (USD)"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}