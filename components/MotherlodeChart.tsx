'use client';

import { useRef } from 'react';
import { Line } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';

import { ChartJS } from './chartSetup';

interface MotherlodePoint {
  round_number: number;
  motherlode_ore: number;
  timestamp: string;
}

interface MotherlodeChartProps {
  data: MotherlodePoint[];
}

export default function MotherlodeChart({ data }: MotherlodeChartProps) {
  const chartRef = useRef<ChartJS<'line'> | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="bg-rore-card rounded-lg shadow p-6 border border-rore-border text-center text-rore-textSubtle">
        No motherlode data available
      </div>
    );
  }

  const maxMotherlode = Math.max(...data.map((d) => d.motherlode_ore));
  const chartData: ChartData<'line'> = {
    datasets: [
      {
        label: 'Motherlode rORE',
        data: data.map((item) => ({
          x: item.round_number,
          y: item.motherlode_ore,
        })),
        borderColor: '#a855f7',
        backgroundColor: 'rgba(168, 85, 247, 0.16)',
        fill: true,
        tension: 0.15,
        pointRadius: 0,
        pointHitRadius: 8,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'nearest',
    },
    scales: {
      x: {
        type: 'linear',
        ticks: {
          color: '#a1a1aa',
        },
        grid: {
          color: '#1a1a1f',
        },
        title: {
          display: true,
          text: 'Round Number',
          color: '#fafafa',
        },
      },
      y: {
        ticks: {
          color: '#a1a1aa',
          callback: (value) => `${Number(value).toLocaleString()} rORE`,
        },
        grid: {
          color: '#1a1a1f',
        },
        title: {
          display: true,
          text: 'Motherlode',
          color: '#fafafa',
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          title: (items) => {
            const firstItem = items[0];
            return firstItem ? `Round #${Number(firstItem.parsed.x).toLocaleString()}` : '';
          },
          label: (context) => `${Number(context.parsed.y).toLocaleString()} rORE`,
          footer: (items) => {
            const point = data[items[0]?.dataIndex ?? -1];
            return point ? new Date(point.timestamp).toLocaleString() : '';
          },
        },
      },
      zoom: {
        zoom: {
          wheel: {
            enabled: true,
          },
          pinch: {
            enabled: true,
          },
          mode: 'x',
        },
        pan: {
          enabled: true,
          mode: 'x',
        },
      },
    },
  };

  return (
    <div className="bg-rore-card rounded-lg shadow p-6 border border-rore-border">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-rore-text">Motherlode Over Time</h2>
          <p className="text-sm text-rore-textMuted">
            Mouse wheel zoom, pinch zoom, and drag to pan across the full history.
          </p>
        </div>
        <button
          className="inline-flex items-center justify-center rounded-md border border-rore-border bg-[#18181b] px-3 py-2 text-sm font-medium text-rore-text transition hover:border-rore-borderHover"
          onClick={() => chartRef.current?.resetZoom()}
          type="button"
        >
          Reset Zoom
        </button>
      </div>
      <div className="h-[360px]">
        <Line data={chartData} options={options} ref={chartRef} />
      </div>
      <div className="mt-2 text-sm text-rore-textMuted text-right">
        Peak: {maxMotherlode.toLocaleString()} rORE
      </div>
    </div>
  );
}
