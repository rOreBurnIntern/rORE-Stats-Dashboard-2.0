import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { supabaseAdmin } = await import('@/lib/supabaseAdmin');

    // Fetch the latest round by round_id
    const { data, error } = await supabaseAdmin
      .from('rounds')
      .select('round_id, deployed, vaulted, winnings, motherlode_value, motherlode_running, motherlode_hit, winners, end_timestamp')
      .order('round_id', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching latest round:', error);
      return NextResponse.json(
        { error: 'Failed to fetch latest round' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'No round data available' },
        { status: 404 }
      );
    }

    // Return round data (filter to only needed fields if desired)
    return NextResponse.json({
      round_id: data.round_id,
      deployed: data.deployed,
      vaulted: data.vaulted,
      winnings: data.winnings,
      motherlode_value: data.motherlode_value,
      motherlode_running: data.motherlode_running,
      motherlode_hit: data.motherlode_hit,
      winners: data.winners,
      end_timestamp: data.end_timestamp,
    });
  } catch (err) {
    console.error('Unexpected error in latest-round route:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
