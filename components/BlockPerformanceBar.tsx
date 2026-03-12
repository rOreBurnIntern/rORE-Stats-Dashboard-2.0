'use client';

import { Bar } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';

import type { BlockPerformancePoint } from '@/lib/db-stats';
import './chartSetup';

type BlockPerformanceBarProps = {
  data: BlockPerformancePoint[];
};

export default function BlockPerformanceBar({ data }: BlockPerformanceBarProps) {
  const totalRounds = data.reduce((sum, point) => sum + point.count, 0);

  if (totalRounds === 0) {
    return (
      <div className="bg-rore-card rounded-lg border border-rore-border p-6 text-center text-rore-textSubtle shadow">
        No block performance data available
      </div>
    );
  }

  const chartData: ChartData<'bar'> = {
    labels: data.map((point) => point.block_number.toString()),
    datasets: [
      {
        label: 'Rounds',
        data: data.map((point) => point.count),
        backgroundColor: '#fbbf24',
        borderRadius: 4,
      },
    ],
  };

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => `${Number(context.raw ?? 0).toLocaleString()} rounds`,
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#a1a1aa',
        },
        grid: {
          color: '#1a1a1f',
        },
        title: {
          display: true,
          text: 'Block Number',
          color: '#fafafa',
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: '#a1a1aa',
          precision: 0,
        },
        grid: {
          color: '#1a1a1f',
        },
        title: {
          display: true,
          text: 'Rounds',
          color: '#fafafa',
        },
      },
    },
  };

  return (
    <div className="bg-rore-card rounded-lg border border-rore-border p-6 shadow">
      <h2 className="mb-4 text-xl font-semibold text-rore-text">Block Performance</h2>
      <div className="h-[320px]">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
}
