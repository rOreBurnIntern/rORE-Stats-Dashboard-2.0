import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import type { TablesInsert } from '@/types/supabase';

const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(request: NextRequest) {
  try {
    // Authenticate using Authorization header: Bearer <CRON_SECRET>
    const authHeader = request.headers.get('authorization');
    if (!CRON_SECRET || !authHeader || authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch latest prices from external API
    const PRICES_API_URL = 'https://api.rore.supply/api/prices';
    const response = await fetch(PRICES_API_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch prices: ${response.status} ${response.statusText}`);
    }
    const payload = await response.json();

    // Normalize payload to extract ore_price_usd and weth_price_usd
    const orePriceUsd = pickNumericString(payload, [
      'ore_price_usd',
      'orePriceUsd',
      'roreUsd',
      'rore_price_usd',
      'ore',
    ]);
    const wethPriceUsd = pickNumericString(payload, [
      'weth_price_usd',
      'wethPriceUsd',
      'wethUsd',
      'weth',
    ]);

    if (!orePriceUsd || !wethPriceUsd) {
      throw new Error('Unable to derive ore_price_usd and weth_price_usd from prices payload.');
    }

    const record: TablesInsert<'price_history'> = {
      timestamp: pickTimestamp(payload, ['timestamp', 'updatedAt', 'fetchedAt']) ?? new Date().toISOString(),
      ore_price_usd: orePriceUsd,
      weth_price_usd: wethPriceUsd,
    };

    // Insert into price_history
    const { error: insertError } = await supabaseAdmin.from('price_history').insert(record);
    if (insertError) {
      throw insertError;
    }

    // Log success to sync_log
    await logSync('prices', 'success', null, 0);

    return NextResponse.json({ success: true, inserted: record });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    Sentry.captureException(err, { tags: { route: 'sync/prices' } });
    console.error('Sync prices error:', err);
    // Log failure to sync_log
    await logSync('prices', 'error', errorMessage, 0);
    return NextResponse.json({ error: 'Sync failed', details: errorMessage }, { status: 500 });
  }
}

async function logSync(jobType: string, status: string, errorMessage: string | null, roundsSynced: number) {
  try {
    await supabaseAdmin.from('sync_log').insert({
      job_type: jobType,
      status: status,
      rounds_synced: roundsSynced,
      error_message: errorMessage,
      started_at: new Date().toISOString(),
      finished_at: new Date().toISOString(),
    });
  } catch (logErr) {
    console.error('Failed to write sync_log:', logErr);
    // Don't throw; best effort
  }
}

function pickNumericString(
  source: Record<string, unknown>,
  keys: string[],
): string | null {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value.toString();
    }
    if (typeof value === 'string' && value.trim() !== '') {
      return value;
    }
  }
  return null;
}

function pickTimestamp(
  source: Record<string, unknown>,
  keys: string[],
): string | null {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim() !== '') {
      const normalized = new Date(value);
      if (!Number.isNaN(normalized.valueOf())) {
        return normalized.toISOString();
      }
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      const normalized = new Date(value);
      if (!Number.isNaN(normalized.valueOf())) {
        return normalized.toISOString();
      }
    }
  }
  return null;
}
