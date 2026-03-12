'use client';

import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface DonutData {
  name: string;
  value: number;
  color: string;
}

interface MotherlodeAllocationDonutProps {
  roundData?: {
    vaulted: number;
    winnings: number;
    motherlode_value: number | null;
  } | null;
}

export default function MotherlodeAllocationDonut({ roundData }: MotherlodeAllocationDonutProps) {
  const [data, setData] = useState<DonutData[]>([]);

  useEffect(() => {
    if (!roundData) return;

    const { vaulted, winnings, motherlode_value } = roundData;
    // Only include non-zero segments
    const segments: DonutData[] = [];
    if (vaulted && vaulted > 0) segments.push({ name: 'Vault', value: vaulted, color: '#6366f1' });
    if (winnings && winnings > 0) segments.push({ name: 'Winnings', value: winnings, color: '#10b981' });
    if (motherlode_value && motherlode_value > 0) segments.push({ name: 'Motherlode', value: motherlode_value, color: '#ff6b35' });

    if (segments.length === 0) {
      setData([]);
    } else {
      setData(segments);
    }
  }, [roundData]);

  if (!roundData || data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center text-gray-500 dark:text-gray-400">
        No allocation data available
      </div>
    );
  }

  const total = data.reduce((sum, seg) => sum + seg.value, 0);

  // Custom tooltip formatter to show ORE and percentage
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      const percent = ((item.value / total) * 100).toFixed(1);
      return (
        <div className="bg-white dark:bg-gray-800 p-2 border border-gray-200 dark:border-gray-700 rounded shadow">
          <p className="font-medium">{item.name}</p>
          <p>{Number(item.value).toLocaleString()} ORE ({percent}%)</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Motherlode Allocation (Latest Round)</h2>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            fill="#8884d8"
            label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 text-center">
        Total: {total.toLocaleString()} ORE
      </div>
    </div>
  );
}
