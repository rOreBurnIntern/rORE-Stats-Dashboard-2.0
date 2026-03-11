'use client';

import { useEffect, useState } from 'react';
import PriceChart from '@/components/PriceChart';
import MotherlodeChart from '@/components/MotherlodeChart';

interface Stats {
  ore_price_usd: number | null;
  weth_price_usd: number | null;
  current_round: {
    round_number: number | null;
    prize: string | null;
    entries: number | null;
    end_time: string | null;
    status: string | null;
  } | null;
  motherlode_ore: number | null;
}

interface PriceHistoryPoint {
  ore_price_usd: number;
  weth_price_usd: number;
  timestamp: string;
}

export default function HomePage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceHistoryPoint[]>([]);
  const [motherlodeHistory, setMotherlodeHistory] = useState<{ motherlode_ore: number; timestamp: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch stats
      const statsRes = await fetch('/api/stats');
      if (!statsRes.ok) {
        throw new Error('Failed to fetch stats');
      }
      const statsData = await statsRes.json();

      // Fetch price history (last 24h)
      const priceRes = await fetch('/api/prices?range=24h');
      const priceData = await priceRes.json();

      // Fetch motherlode history
      const motherlodeRes = await fetch('/api/motherlode?limit=100');
      const motherlodeData = await motherlodeRes.json();

      setStats(statsData);
      setPriceHistory(priceData.price_history || []);
      setMotherlodeHistory(motherlodeData.motherlode_history || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Refresh every 60 seconds
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (value: number | null) => {
    if (value === null) return '-';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  const formatNumber = (num: number | null) => {
    if (num === null) return '-';
    return num.toLocaleString();
  };

  const formatPrizeDisplay = (prizeJson: string | null) => {
    if (!prizeJson) return '-';
    try {
      const parsed = JSON.parse(prizeJson);
      return `${parsed.amount} ${parsed.currency || 'ORE'}`;
    } catch {
      return prizeJson;
    }
  };

  const formatCountdown = (endTime: string | null) => {
    if (!endTime) return '-';
    const end = new Date(endTime);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-xl text-gray-600 dark:text-gray-300">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-xl text-red-600 dark:text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">rORE Stats Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Real-time statistics for rORE protocol</p>
        </header>

        {/* Stats Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* ORE Price Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">ORE Price</h3>
            <p className="mt-2 text-3xl font-bold text-amber-600 dark:text-amber-400">
              {formatCurrency(stats?.ore_price_usd || null)}
            </p>
          </div>

          {/* WETH Price Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">WETH Price</h3>
            <p className="mt-2 text-3xl font-bold text-indigo-600 dark:text-indigo-400">
              {formatCurrency(stats?.weth_price_usd || null)}
            </p>
          </div>

          {/* Current Round Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">Current Round</h3>
            {stats?.current_round ? (
              <div className="mt-2 space-y-1">
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  #{stats.current_round.round_number}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Prize: {formatPrizeDisplay(stats.current_round.prize)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Entries: {formatNumber(stats.current_round.entries)}
                </p>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Ends in: {formatCountdown(stats.current_round.end_time)}
                </p>
              </div>
            ) : (
              <p className="mt-2 text-gray-500 dark:text-gray-400">No active round</p>
            )}
          </div>

          {/* Motherlode Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">Motherlode Total</h3>
            <p className="mt-2 text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatNumber(stats?.motherlode_ore || null)} ORE
            </p>
          </div>
        </div>

        {/* Price Chart */}
        <PriceChart data={priceHistory} />

        {/* Motherlode Chart */}
        <MotherlodeChart data={motherlodeHistory} />

        {/* Footer */}
        <footer className="text-center text-gray-500 dark:text-gray-400 text-sm py-4">
          <p>Last updated: {new Date().toLocaleTimeString()}</p>
        </footer>
      </div>
    </div>
  );
}