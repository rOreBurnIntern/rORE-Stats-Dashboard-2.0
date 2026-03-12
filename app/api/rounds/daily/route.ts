import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') ?? '30', 10);
    const limit = Math.min(Number(searchParams.get('limit') ?? '10000'), 10000); // safety cap

    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffISO = cutoffDate.toISOString();

    // Fetch rounds within date range (only need timestamps)
    const { data: rounds, error } = await supabaseAdmin
      .from('rounds')
      .select('end_timestamp')
      .gte('end_timestamp', cutoffISO)
      .order('end_timestamp', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error fetching rounds for daily aggregation:', error);
      return NextResponse.json(
        { error: 'Failed to fetch rounds' },
        { status: 500 }
      );
    }

    // Aggregate by day
    const counts = new Map<string, number>();
    rounds?.forEach((r) => {
      const date = r.end_timestamp.substring(0, 10); // YYYY-MM-DD
      counts.set(date, (counts.get(date) || 0) + 1);
    });

    // Build array of { date, count } sorted by date
    const result = Array.from(counts.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({ daily: result, total: rounds?.length ?? 0 });
  } catch (err) {
    console.error('Unexpected error in rounds/daily route:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
