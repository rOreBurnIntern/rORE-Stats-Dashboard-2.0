'use client';

import 'hammerjs';

import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';

import { roreTheme } from '@/lib/theme';

let isRegistered = false;

if (!isRegistered) {
  ChartJS.register(
    ArcElement,
    BarElement,
    CategoryScale,
    Filler,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    Tooltip,
    zoomPlugin,
  );
  ChartJS.defaults.color = roreTheme.textMuted;
  ChartJS.defaults.borderColor = roreTheme.grid;
  ChartJS.defaults.font.family = 'ui-sans-serif, system-ui, sans-serif';
  ChartJS.defaults.plugins.tooltip.backgroundColor = roreTheme.tooltip;
  ChartJS.defaults.plugins.tooltip.titleColor = roreTheme.text;
  ChartJS.defaults.plugins.tooltip.bodyColor = roreTheme.text;
  ChartJS.defaults.plugins.tooltip.footerColor = roreTheme.textMuted;
  ChartJS.defaults.plugins.tooltip.borderColor = roreTheme.borderHover;
  ChartJS.defaults.plugins.tooltip.borderWidth = 1;
  ChartJS.defaults.plugins.tooltip.padding = 12;
  ChartJS.defaults.plugins.legend.labels.color = roreTheme.text;
  isRegistered = true;
}

export { ChartJS };
