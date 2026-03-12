import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { getMotherlodeHistory } from '@/lib/db-stats';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

    if (limitParam && (!Number.isInteger(limit) || (limit ?? 0) < 1)) {
      return NextResponse.json(
        { error: 'Invalid limit parameter' },
        { status: 400 }
      );
    }

    const history = await getMotherlodeHistory(limit);

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
