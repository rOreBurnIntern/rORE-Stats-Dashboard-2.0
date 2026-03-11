// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import type { Views } from '@/types/supabase';

export async function GET(request: NextRequest) {
  try {
    // Fetch the latest stats from the latest_stats view
    const { data, error } = await supabaseAdmin
      .from('latest_stats')
      .select('*')
      .maybeSingle();

    if (error) {
      Sentry.captureException(error, { tags: { route: 'stats', operation: 'fetch' } });
      console.error('Error fetching latest stats:', error);
      return NextResponse.json(
        { error: 'Failed to fetch stats' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'No stats data available' },
        { status: 404 }
      );
    }

    // Parse the current_round JSON if present
    let currentRound = null;
    if (data.current_round) {
      try {
        const roundData = typeof data.current_round === 'string' 
          ? JSON.parse(data.current_round)
          : data.current_round;
        currentRound = {
          round_number: roundData.round_number ?? null,
          prize: roundData.prize ?? null,
          entries: roundData.entries ?? null,
          start_time: roundData.start_time ?? null,
          end_time: roundData.end_time ?? null,
          status: roundData.status ?? null,
        };
      } catch (e) {
        console.error('Error parsing current_round:', e);
        currentRound = null;
      }
    }

    // Return the data in the expected format
    return NextResponse.json({
      ore_price_usd: data.ore_price_usd,
      weth_price_usd: data.weth_price_usd,
      current_round: currentRound,
      motherlode_ore: data.motherlode_ore ? parseFloat(data.motherlode_ore) : null,
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