import BlockPerformanceBar from '@/components/BlockPerformanceBar';
import MotherlodeChart from '@/components/MotherlodeChart';
import WinnerTypesPie from '@/components/WinnerTypesPie';
import { getDbStatsData } from '@/lib/db-stats';

export const revalidate = 60;

export default async function HomePage() {
  let dashboardData: Awaited<ReturnType<typeof getDbStatsData>>;

  try {
    dashboardData = await getDbStatsData();
  } catch {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0a0a0b] via-[#111113] to-[#18181b]">
        <div className="text-xl text-red-500">Failed to load dashboard data</div>
      </div>
    );
  }

  const { latestPrices, latestRound, motherlodeHistory, winnerTypes, blockPerformance } =
    dashboardData;

  const formatCurrency = (value: number | null) => {
    if (value === null) return '-';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  const formatNumber = (num: number | null) => {
    if (num === null) return '-';
    return num.toLocaleString();
  };

  const formatPrizeDisplay = () => {
    if (!latestRound) return '-';
    const totalPrize =
      latestRound.vaulted + latestRound.winnings + (latestRound.motherlode_value ?? 0);
    return `${totalPrize.toLocaleString()} ORE`;
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0b] via-[#111113] to-[#18181b] p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-rore-primary to-[#60a5fa]">
            rORE Stats Dashboard
          </h1>
          <p className="text-rore-textMuted mt-2">Real-time statistics for rORE protocol</p>
        </header>

        {/* Stats Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* ORE Price Card */}
          <div className="bg-rore-card/50 backdrop-blur border border-rore-border rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-rore-textMuted uppercase">ORE Price</h3>
            <p className="mt-2 text-3xl font-bold text-rore-primary">
              {formatCurrency(latestPrices.ore_price_usd)}
            </p>
          </div>

          {/* WETH Price Card */}
          <div className="bg-rore-card/50 backdrop-blur border border-rore-border rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-rore-textMuted uppercase">WETH Price</h3>
            <p className="mt-2 text-3xl font-bold text-rore-secondary">
              {formatCurrency(latestPrices.weth_price_usd)}
            </p>
          </div>

          {/* Current Round Card */}
          <div className="bg-rore-card/50 backdrop-blur border border-rore-border rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-rore-textMuted uppercase">Current Round</h3>
            {latestRound ? (
              <div className="mt-2 space-y-1">
                <p className="text-lg font-bold text-rore-text">
                  #{latestRound.round_id}
                </p>
                <p className="text-sm text-rore-textMuted">
                  Prize: {formatPrizeDisplay()}
                </p>
                <p className="text-sm text-rore-textMuted">
                  Entries: {formatNumber(latestRound.winners)}
                </p>
                <p className="text-sm font-medium text-rore-text">
                  Ends in: {formatCountdown(latestRound.end_timestamp)}
                </p>
              </div>
            ) : (
              <p className="mt-2 text-rore-textSubtle">No active round</p>
            )}
          </div>

          {/* Motherlode Card */}
          <div className="bg-rore-card/50 backdrop-blur border border-rore-border rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-rore-textMuted uppercase">Motherlode Total</h3>
            <p className="mt-2 text-3xl font-bold text-rore-success">
              {formatNumber(latestRound?.motherlode_running ?? null)} ORE
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <WinnerTypesPie data={winnerTypes} />
          <BlockPerformanceBar data={blockPerformance} />
        </div>

        <MotherlodeChart data={motherlodeHistory} />

        {/* Footer */}
        <footer className="text-center text-rore-textSubtle text-sm py-4">
          <p>Last updated: {new Date().toLocaleTimeString()}</p>
        </footer>
      </div>
    </div>
  );
}
