'use client';

import { useEffect, useState } from 'react';
import RoundTable from '@/components/RoundTable';

export default function HistoryPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rounds, setRounds] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [limit] = useState(50);

  const fetchRounds = async (pageNum: number) => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await fetch(`/api/rounds?page=${pageNum}&limit=${limit}`);
      if (!res.ok) {
        throw new Error('Failed to fetch rounds');
      }
      const data = await res.json();
      
      setRounds(data.rounds);
      setPage(data.page);
      setHasMore(data.hasMore);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load rounds');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRounds(1);
  }, []);

  if (loading && rounds.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0b] via-[#111113] to-[#18181b] flex items-center justify-center">
        <div className="text-xl text-rore-textMuted">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0b] via-[#111113] to-[#18181b] flex items-center justify-center">
        <div className="text-xl text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0b] via-[#111113] to-[#18181b] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-rore-text">Round History</h1>
          <p className="text-rore-textMuted mt-2">
            Browse past rounds ({total.toLocaleString()} total)
          </p>
        </header>

        {/* Use client-side pagination with RoundTable */}
        <RoundTable 
          initialRounds={rounds}
          initialPage={page}
          initialHasMore={hasMore}
        />

        <footer className="mt-8 text-center text-rore-textSubtle text-sm">
          <p>Data refreshes automatically</p>
        </footer>
      </div>
    </div>
  );
}
