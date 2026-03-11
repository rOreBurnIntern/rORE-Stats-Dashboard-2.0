// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') ?? '100', 10);

    // Validate parameters
    if (limit < 1 || limit > 1000) {
      return NextResponse.json(
        { error: 'Invalid limit parameter (max 1000)' },
        { status: 400 }
      );
    }

    // Fetch motherlode history from protocol_stats table, ordered by timestamp DESC
    // The protocol_stats column is a JSONB object containing the 'motherlode' key
    const { data, error } = await supabaseAdmin
      .from('protocol_stats')
      .select('protocol_stats, timestamp')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      Sentry.captureException(error, { tags: { route: 'motherlode', operation: 'fetch' } });
      console.error('Error fetching motherlode history:', error);
      return NextResponse.json(
        { error: 'Failed to fetch motherlode history' },
        { status: 500 }
      );
    }

    // Transform data: extract motherlode value from the JSONB column
    const history = (data ?? []).map(item => {
      const motherlodeVal = item.protocol_stats?.motherlode;
      return {
        timestamp: item.timestamp,
        motherlode_ore: motherlodeVal !== undefined && motherlodeVal !== null ? parseFloat(String(motherlodeVal)) : 0,
      };
    });

    // Return the data in the expected format
    return NextResponse.json({
      motherlode_history: history,
    });
  } catch (err) {
    Sentry.captureException(err, { tags: { route: 'motherlode' } });
    console.error('Unexpected error in motherlode route:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}