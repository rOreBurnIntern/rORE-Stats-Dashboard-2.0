import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { parseHoursRange, toApiPrice } from '../_lib/dashboardTransforms';

const PRICE_SELECT = 'ore_price_usd:ore_usd, weth_price_usd:weth_usd, timestamp:api_timestamp';

export async function GET(request: NextRequest) {
  try {
    const { supabaseAdmin } = await import('@/lib/supabaseAdmin');
    const searchParams = request.nextUrl.searchParams;
    const range = parseHoursRange(searchParams.get('range'));

    if (range) {
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - range);

      const { data, error } = await supabaseAdmin
        .from('prices')
        .select(PRICE_SELECT)
        .gte('api_timestamp', cutoffTime.toISOString())
        .order('api_timestamp', { ascending: true });

      if (error) {
        Sentry.captureException(error, { tags: { route: 'prices', operation: 'fetch-history' } });
        console.error('Error fetching price history:', error);
        return NextResponse.json(
          { error: 'Failed to fetch price history' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        price_history: (data ?? []).map(toApiPrice),
      });
    }

    if (searchParams.has('range')) {
      return NextResponse.json(
        { error: 'Invalid range parameter' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('prices')
      .select(PRICE_SELECT)
      .order('api_timestamp', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      Sentry.captureException(error, { tags: { route: 'prices', operation: 'fetch-latest' } });
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

    return NextResponse.json(toApiPrice(data));
  } catch (err) {
    Sentry.captureException(err, { tags: { route: 'prices' } });
    console.error('Unexpected error in prices route:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
