'use client';

import { useState, useEffect } from 'react';

interface Round {
  round_number: number;
  prize: string;
  entries: number;
  start_time: string;
  end_time: string;
  status: string;
}

interface RoundTableProps {
  initialRounds: Round[];
  initialPage: number;
  initialHasMore: boolean;
}

export default function RoundTable({ initialRounds, initialPage, initialHasMore }: RoundTableProps) {
  const [rounds, setRounds] = useState<Round[]>(initialRounds);
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);

  const fetchPage = async (pageNum: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/rounds?page=${pageNum}&limit=50`);
      if (!res.ok) throw new Error('Failed to fetch rounds');
      const data = await res.json();
      setRounds(data.rounds);
      setPage(data.page);
      setHasMore(data.hasMore);
    } catch (err) {
      console.error('Error fetching rounds:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (hasMore && !loading) {
      fetchPage(page + 1);
    }
  };

  const handlePrev = () => {
    if (page > 1 && !loading) {
      fetchPage(page - 1);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString();
  };

  const formatPrize = (prize: string | null) => {
    if (!prize) return '-';
    try {
      const parsed = JSON.parse(prize);
      return `${parsed.amount} ${parsed.currency || 'ORE'}`;
    } catch {
      return prize;
    }
  };

  return (
    <div className="bg-rore-card rounded-lg shadow overflow-hidden border border-rore-border">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-rore-border">
          <thead className="bg-[#0d0d0f]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-rore-textMuted uppercase tracking-wider">Round</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-rore-textMuted uppercase tracking-wider">Prize</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-rore-textMuted uppercase tracking-wider">Entries</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-rore-textMuted uppercase tracking-wider">Start</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-rore-textMuted uppercase tracking-wider">End</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-rore-textMuted uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-rore-card divide-y divide-rore-border">
            {rounds.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-rore-textSubtle">
                  No rounds found
                </td>
              </tr>
            ) : (
              rounds.map((round) => (
                <tr key={round.round_number} className="hover:bg-rore-border/30">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-rore-text">
                    #{round.round_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-rore-textMuted">
                    {formatPrize(round.prize)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-rore-textMuted">
                    {round.entries.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-rore-textMuted">
                    {formatDate(round.start_time)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-rore-textMuted">
                    {formatDate(round.end_time)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      round.status === 'completed' 
                        ? 'bg-green-500/20 text-green-500'
                        : round.status === 'active'
                        ? 'bg-blue-500/20 text-blue-500'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {round.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      <div className="bg-[#0d0d0f] px-4 py-3 flex items-center justify-between border-t border-rore-border">
        <div className="flex-1 flex justify-between sm:hidden">
          <button
            onClick={handlePrev}
            disabled={page <= 1 || loading}
            className="relative inline-flex items-center px-4 py-2 border border-rore-border text-sm font-medium rounded-md text-rore-textMuted bg-rore-card hover:bg-rore-border/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={handleNext}
            disabled={!hasMore || loading}
            className="ml-3 relative inline-flex items-center px-4 py-2 border border-rore-border text-sm font-medium rounded-md text-rore-textMuted bg-rore-card hover:bg-rore-border/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-rore-textMuted">
              Page <span className="font-medium text-rore-text">{page}</span>
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={handlePrev}
                disabled={page <= 1 || loading}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-rore-border bg-rore-card text-sm font-medium text-rore-textMuted hover:bg-rore-border/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Previous</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              <button
                onClick={handleNext}
                disabled={!hasMore || loading}
                aria-label="Next page"
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-rore-border bg-rore-card text-sm font-medium text-rore-textMuted hover:bg-rore-border/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Next</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}