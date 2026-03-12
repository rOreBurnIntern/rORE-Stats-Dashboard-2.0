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
      <div className="bg-rore-card rounded-lg shadow p-6 border border-rore-border text-center text-rore-textSubtle">
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
    <div className="bg-rore-card rounded-lg shadow p-6 border border-rore-border">
      <h2 className="text-xl font-semibold mb-4 text-rore-text">Price History (24h)</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--relay-colors-gray-7)" />
          <XAxis 
            dataKey="time" 
            tick={{ fontSize: 12 }}
            tickLine={{ stroke: 'var(--relay-colors-gray-7)' }}
            className="text-rore-textMuted"
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            tickLine={{ stroke: 'var(--relay-colors-gray-7)' }}
            className="text-rore-textMuted"
            domain={['auto', 'auto']}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#111113',
              border: '1px solid #1a1a1f',
              borderRadius: '0.5rem',
              color: '#fafafa'
            }}
            labelStyle={{ color: '#fafafa', fontWeight: 'bold' }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="ore_price_usd" 
            stroke="#3b82f6" 
            name="ORE Price (USD)"
            strokeWidth={2}
            dot={false}
          />
          <Line 
            type="monotone" 
            dataKey="weth_price_usd" 
            stroke="#fbbf24" 
            name="WETH Price (USD)"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}