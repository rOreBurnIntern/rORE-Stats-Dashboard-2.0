import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request: NextRequest) {
  try {
    // Fetch latest price
    const { data: latestPrice, error: priceError } = await supabaseAdmin
      .from('price_history')
      .select('ore_price_usd, weth_price_usd')
      .order('timestamp', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (priceError) {
      Sentry.captureException(priceError, { tags: { route: 'stats', operation: 'fetch-price' } });
      console.error('Error fetching latest price:', priceError);
      // Continue; price may be null
    }

    // Fetch latest round
    const { data: latestRound, error: roundError } = await supabaseAdmin
      .from('rounds')
      .select('round_id, vaulted, winnings, motherlode_value, motherlode_running, end_timestamp, winners')
      .order('round_id', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (roundError) {
      Sentry.captureException(roundError, { tags: { route: 'stats', operation: 'fetch-round' } });
      console.error('Error fetching latest round:', roundError);
      // Continue; round may be null
    }

    if (!latestRound) {
      return NextResponse.json(
        { error: 'No stats data available' },
        { status: 404 }
      );
    }

    // Build current_round object to match existing format
    const currentRound = latestRound ? {
      round_number: latestRound.round_id,
      prize: JSON.stringify({
        amount: (latestRound.vaulted + latestRound.winnings + (latestRound.motherlode_value || 0)).toFixed(8),
        currency: 'ORE'
      }),
      entries: latestRound.winners,
      start_time: null, // Not available
      end_time: latestRound.end_timestamp,
      status: latestRound.end_timestamp > new Date().toISOString() ? 'active' : 'completed',
    } : null;

    // Extract motherlode_ore from latest round's motherlode_running (unclaimed pool)
    const motherlodeOre = latestRound ? String(latestRound.motherlode_running) : null;

    return NextResponse.json({
      ore_price_usd: latestPrice?.ore_price_usd ? parseFloat(latestPrice.ore_price_usd) : null,
      weth_price_usd: latestPrice?.weth_price_usd ? parseFloat(latestPrice.weth_price_usd) : null,
      current_round: currentRound,
      motherlode_ore: motherlodeOre ? parseFloat(motherlodeOre) : null,
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