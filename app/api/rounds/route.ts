import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') ?? '1', 10);
    const limit = parseInt(searchParams.get('limit') ?? '50', 10);

    // Validate parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    const offset = (page - 1) * limit;

    // Fetch paginated rounds and total count
    const { data: rounds, error: roundsError, count: totalCount } = await supabaseAdmin
      .from('rounds')
      .select('*', { count: 'exact' })
      .order('round_number', { ascending: false })
      .range(offset, offset + limit - 1);

    if (roundsError) {
      console.error('Error fetching rounds:', roundsError);
      return NextResponse.json(
        { error: 'Failed to fetch rounds' },
        { status: 500 }
      );
    }

    const total = totalCount ?? 0;
    const hasMore = page * limit < total;

    // Return the data in the expected format
    return NextResponse.json({
      rounds: rounds ?? [],
      total,
      page,
      limit,
      hasMore,
    });
  } catch (err) {
    console.error('Unexpected error in rounds route:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}