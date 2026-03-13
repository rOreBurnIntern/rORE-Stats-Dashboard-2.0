import BlockPerformanceBar from '@/components/BlockPerformanceBar';
import MotherlodeChart from '@/components/MotherlodeChart';
import WinnerTypesPie from '@/components/WinnerTypesPie';
import { getDbStatsData } from '@/lib/db-stats';

export const revalidate = 60;

export default async function HomePage() {
  let dashboardData: Awaited<ReturnType<typeof getDbStatsData>>;
  const statCardClass =
    'rounded-2xl border border-rore-border bg-rore-card/90 p-6 shadow-rore backdrop-blur transition hover:border-rore-borderHover hover:shadow-glow';

  try {
    dashboardData = await getDbStatsData();
  } catch {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-rore-background via-rore-backgroundAlt to-rore-card">
        <div className="rounded-2xl border border-rore-border bg-rore-card px-6 py-5 text-xl text-rore-secondary shadow-glow">
          Failed to load dashboard data
        </div>
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
    <div className="min-h-screen bg-gradient-to-br from-rore-background via-rore-backgroundAlt to-rore-card p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="rounded-3xl border border-rore-border bg-rore-card/70 px-6 py-7 shadow-rore backdrop-blur">
          <h1 className="bg-gradient-to-r from-rore-primary via-rore-motherlode to-rore-secondary bg-clip-text text-3xl font-bold text-transparent md:text-4xl">
            rORE Stats Dashboard
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-rore-textMuted md:text-base">
            Real-time protocol pricing, block outcomes, and motherlode history styled to match the
            dashboard PRD.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className={statCardClass}>
            <h3 className="text-sm font-medium text-rore-textMuted uppercase">ORE Price</h3>
            <p className="mt-2 text-3xl font-bold text-rore-primary">
              {formatCurrency(latestPrices.ore_price_usd)}
            </p>
          </div>

          <div className={statCardClass}>
            <h3 className="text-sm font-medium text-rore-textMuted uppercase">WETH Price</h3>
            <p className="mt-2 text-3xl font-bold text-rore-secondary">
              {formatCurrency(latestPrices.weth_price_usd)}
            </p>
          </div>

          <div className={statCardClass}>
            <h3 className="text-sm font-medium text-rore-textMuted uppercase">Current Round</h3>
            {latestRound ? (
              <div className="mt-2 space-y-1">
                <p className="text-lg font-bold text-rore-text">#{latestRound.round_id}</p>
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

          <div className={statCardClass}>
            <h3 className="text-sm font-medium text-rore-textMuted uppercase">Motherlode Total</h3>
            <p className="mt-2 text-3xl font-bold text-rore-motherlode">
              {formatNumber(latestRound?.motherlode_running ?? null)} ORE
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <WinnerTypesPie data={winnerTypes} />
          <BlockPerformanceBar data={blockPerformance} />
        </div>

        <MotherlodeChart data={motherlodeHistory} />

        <footer className="text-center text-rore-textSubtle text-sm py-4">
          <p>Last updated: {new Date().toLocaleTimeString()}</p>
        </footer>
      </div>
    </div>
  );
}
