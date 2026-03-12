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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center text-gray-500 dark:text-gray-400">
        Loading rounds per day...
      </div>
    );
  }

  if (dailyData.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center text-gray-500 dark:text-gray-400">
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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Rounds per Day (Last 30 Days)</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
          <XAxis 
            dataKey="label" 
            tick={{ fontSize: 12 }}
            tickLine={{ stroke: '#9ca3af' }}
            className="dark:text-gray-300"
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            tickLine={{ stroke: '#9ca3af' }}
            className="dark:text-gray-300"
            allowDecimals={false}
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
          <Bar 
            dataKey="count" 
            name="Rounds" 
            fill="#ff6b35" 
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
