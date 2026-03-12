'use client';

import { Pie } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';

import type { WinnerTypes } from '@/lib/db-stats';
import './chartSetup';

type WinnerTypesPieProps = {
  data: WinnerTypes;
};

export default function WinnerTypesPie({ data }: WinnerTypesPieProps) {
  if (data.total === 0) {
    return (
      <div className="bg-rore-card rounded-lg border border-rore-border p-6 text-center text-rore-textSubtle shadow">
        No winner type data available
      </div>
    );
  }

  const chartData: ChartData<'pie'> = {
    labels: ['Winner Takes All', 'Split'],
    datasets: [
      {
        data: [data.wta, data.split],
        backgroundColor: ['#3b82f6', '#fbbf24'],
        borderColor: '#111113',
        borderWidth: 2,
      },
    ],
  };

  const options: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#fafafa',
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = Number(context.raw ?? 0);
            const percent = data.total === 0 ? 0 : (value / data.total) * 100;
            return `${context.label}: ${value.toLocaleString()} rounds (${percent.toFixed(1)}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="bg-rore-card rounded-lg border border-rore-border p-6 shadow">
      <h2 className="mb-4 text-xl font-semibold text-rore-text">Winner Types</h2>
      <div className="h-[320px]">
        <Pie data={chartData} options={options} />
      </div>
      <p className="mt-3 text-center text-sm text-rore-textMuted">
        Last {data.total.toLocaleString()} rounds
      </p>
    </div>
  );
}
