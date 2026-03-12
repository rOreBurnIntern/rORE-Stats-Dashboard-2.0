'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DailyCount {
  date: string;
  count: number;
}

interface RoundsPerDayBarProps {
  initialData?: { daily: DailyCount[]; total: number };
}

export default function RoundsPerDayBar({ initialData }: RoundsPerDayBarProps) {
  const [dailyData, setDailyData] = useState<DailyCount[]>(initialData?.daily || []);
  const [loading, setLoading] = useState(!initialData);

  useEffect(() => {
    if (initialData) {
      setDailyData(initialData.daily);
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        const res = await fetch('/api/rounds/daily?days=30');
        if (!res.ok) throw new Error('Failed to fetch daily rounds');
        const data = await res.json();
        setDailyData(data.daily || []);
      } catch (err) {
        console.error('Error loading daily rounds:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [initialData]);

  if (loading) {
    return (
      <div className="bg-rore-card rounded-lg shadow p-6 border border-rore-border text-center text-rore-textSubtle">
        Loading rounds per day...
      </div>
    );
  }

  if (dailyData.length === 0) {
    return (
      <div className="bg-rore-card rounded-lg shadow p-6 border border-rore-border text-center text-rore-textSubtle">
        No round data available
      </div>
    );
  }

  // Format date for display: e.g., "Mar 10"
  const chartData = dailyData.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));

  return (
    <div className="bg-rore-card rounded-lg shadow p-6 border border-rore-border">
      <h2 className="text-xl font-semibold mb-4 text-rore-text">Rounds per Day (Last 30 Days)</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--relay-colors-gray-7)" />
          <XAxis 
            dataKey="label" 
            tick={{ fontSize: 12 }}
            tickLine={{ stroke: 'var(--relay-colors-gray-7)' }}
            className="text-rore-textMuted"
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            tickLine={{ stroke: 'var(--relay-colors-gray-7)' }}
            className="text-rore-textMuted"
            allowDecimals={false}
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
          <Bar 
            dataKey="count" 
            name="Rounds" 
            fill="#fbbf24" 
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
