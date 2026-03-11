import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import type { Tables } from '@/types/supabase';

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const range = searchParams.get('range');

    // If range is specified, fetch price history from the last N hours
    if (range) {
      const hours = parseInt(range, 10);
      if (isNaN(hours) || hours <= 0) {
        return NextResponse.json(
          { error: 'Invalid range parameter' },
          { status: 400 }
        );
      }

      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - hours);

      const { data, error } = await supabaseAdmin
        .from('price_history')
        .select('ore_price_usd, weth_price_usd, timestamp')
        .gte('timestamp', cutoffTime.toISOString())
        .order('timestamp', { ascending: true });

      if (error) {
        console.error('Error fetching price history:', error);
        return NextResponse.json(
          { error: 'Failed to fetch price history' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        price_history: data ?? [],
      });
    }

    // No range: fetch the latest price from price_history ordered by timestamp DESC
    const { data, error } = await supabaseAdmin
      .from('price_history')
      .select('ore_price_usd, weth_price_usd, timestamp')
      .order('timestamp', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching latest price:', error);
      return NextResponse.json(
        { error: 'Failed to fetch latest price' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'No price data available' },
        { status: 404 }
      );
    }

    // Return the data in the expected format
    return NextResponse.json({
      ore_price_usd: data.ore_price_usd,
      weth_price_usd: data.weth_price_usd,
      timestamp: data.timestamp,
    });
  } catch (err) {
    console.error('Unexpected error in prices route:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}