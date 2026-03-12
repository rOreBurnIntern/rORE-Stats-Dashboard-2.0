import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { toApiPrice, toApiRound, toNumber } from '../_lib/dashboardTransforms';

const PRICE_SELECT = 'ore_price_usd:ore_usd, weth_price_usd:weth_usd, timestamp:api_timestamp';

export async function GET(request: NextRequest) {
  try {
    const { data: latestPrice, error: priceError } = await supabaseAdmin
      .from('prices')
      .select(PRICE_SELECT)
      .order('api_timestamp', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (priceError) {
      Sentry.captureException(priceError, { tags: { route: 'stats', operation: 'fetch-price' } });
      console.error('Error fetching latest price:', priceError);
    }

    const { data: latestRound, error: roundError } = await supabaseAdmin
      .from('rounds')
      .select('round_id, vaulted, winnings, motherlode_value, motherlode_running, end_timestamp, winners')
      .order('round_id', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (roundError) {
      Sentry.captureException(roundError, { tags: { route: 'stats', operation: 'fetch-round' } });
      console.error('Error fetching latest round:', roundError);
    }

    if (!latestRound) {
      return NextResponse.json(
        { error: 'No stats data available' },
        { status: 404 }
      );
    }

    const price = latestPrice ? toApiPrice(latestPrice) : null;
    const currentRound = toApiRound(latestRound);

    return NextResponse.json({
      ore_price_usd: price?.ore_price_usd ?? null,
      weth_price_usd: price?.weth_price_usd ?? null,
      current_round: currentRound,
      motherlode_ore: toNumber(latestRound.motherlode_running),
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
