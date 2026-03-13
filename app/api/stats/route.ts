import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { getLatestPrices, getLatestRound } from '@/lib/db-stats';
import { toApiRound } from '../_lib/dashboardTransforms';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [latestPrice, latestRound] = await Promise.all([getLatestPrices(), getLatestRound()]);

    if (!latestRound) {
      return NextResponse.json(
        { error: 'No stats data available' },
        { status: 404 }
      );
    }

    const currentRound = toApiRound(latestRound);

    return NextResponse.json({
      ore_price_usd: latestPrice.ore_price_usd,
      weth_price_usd: latestPrice.weth_price_usd,
      current_round: currentRound,
      motherlode_ore: latestRound.motherlode_running,
    });
  } catch (err) {
    Sentry.captureException(err, { tags: { route: 'stats' } });
    console.error('Unexpected error in stats route:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
