import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import type { TablesInsert } from '@/types/supabase';

const CRON_SECRET = process.env.CRON_SECRET;

// Config from env or defaults
const PAGE_LIMIT = Number(process.env.ROUNDS_PAGE_LIMIT ?? 200);
const BATCH_SIZE = Number(process.env.ROUNDS_UPSERT_BATCH_SIZE ?? 250);
const MAX_PAGES_PER_RUN = Number(process.env.ROUNDS_MAX_PAGES_PER_RUN ?? 50);
const FULL_BACKFILL = process.env.FULL_BACKFILL === 'true';

async function getSupabaseAdmin() {
  const { supabaseAdmin } = await import('@/lib/supabaseAdmin');
  return supabaseAdmin;
}

export async function POST(request: NextRequest) {
  const startedAt = new Date().toISOString();
  let roundsSynced = 0;
  let errorMessage: string | null = null;

  try {
    const supabaseAdmin = await getSupabaseAdmin();

    // Authenticate
    const authHeader = request.headers.get('authorization');
    if (!CRON_SECRET || !authHeader || authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch current sync state from sync_metadata
    const { data: syncState, error: syncReadError } = await supabaseAdmin
      .from('sync_metadata')
      .select('id, last_round_number, next_cursor')
      .eq('id', 'rounds')
      .maybeSingle();

    if (syncReadError && syncReadError.code !== 'PGRST116') {
      throw syncReadError;
    }

    // Determine starting page
    const initialPage = FULL_BACKFILL ? 1 : (Number(syncState?.next_cursor) || 1);
    let page = initialPage;
    let latestRoundId = syncState?.last_round_number ?? 0;
    let processedPages = 0;
    let insertedRows = 0;
    const allRawRounds = [];
    let totalPages: number | null = null;

    // Fetch pages sequentially
    while (processedPages < MAX_PAGES_PER_RUN) {
      const payload = await fetchRoundsPage(page);

      if (totalPages === null && payload.pagination?.totalPages) {
        totalPages = payload.pagination.totalPages;
      }

      const rawRounds = extractRoundsData(payload);
      if (rawRounds.length === 0) {
        break;
      }

      allRawRounds.push(...rawRounds);
      processedPages += 1;
      page += 1;

      if (totalPages !== null && page > totalPages) {
        break;
      }
    }

    // Normalize all fetched rounds
    const allNormalized: TablesInsert<'rounds'>[] = allRawRounds
      .map(normalizeRound)
      .filter((r): r is TablesInsert<'rounds'> => r !== null);

    if (allNormalized.length === 0) {
      console.log('No rounds fetched.');
      // Still update metadata to move cursor forward
      const nextCursor = (totalPages !== null && page > totalPages) ? null : String(page);
      await updateSyncMetadata(latestRoundId, nextCursor);
      await logSync('rounds', 'success_noop', null, 0, startedAt, new Date().toISOString());
      return NextResponse.json({ success: true, message: 'No new rounds', latestRoundId });
    }

    // Deduplicate by round_id (keep last occurrence)
    const uniqueMap = new Map();
    for (const r of allNormalized) {
      uniqueMap.set(r.round_id, r);
    }
    const uniqueRounds = Array.from(uniqueMap.values());

    // Determine which rounds to process (newer than latestRoundId unless full backfill)
    let roundsToUpsert: TablesInsert<'rounds'>[];
    if (FULL_BACKFILL) {
      roundsToUpsert = uniqueRounds;
    } else {
      roundsToUpsert = uniqueRounds.filter(r => r.round_id > latestRoundId);
    }

    if (roundsToUpsert.length === 0) {
      console.log('No new rounds to upsert.');
      const nextCursor = (totalPages !== null && page > totalPages) ? null : String(page);
      await updateSyncMetadata(latestRoundId, nextCursor);
      await logSync('rounds', 'success_noop', null, 0, startedAt, new Date().toISOString());
      return NextResponse.json({ success: true, message: 'No new rounds', latestRoundId });
    }

    // Sort ascending by round_id for motherlode computation
    roundsToUpsert.sort((a, b) => a.round_id - b.round_id);

    // Compute motherlode_running and motherlode_value
    let currentRunning = 0;

    if (!FULL_BACKFILL && latestRoundId > 0) {
      const { data: latestRoundDB, error: fetchErr } = await supabaseAdmin
        .from('rounds')
        .select('motherlode_running, motherlode_hit')
        .eq('round_id', latestRoundId)
        .maybeSingle();

      if (fetchErr && fetchErr.code !== 'PGRST116') {
        throw fetchErr;
      }
      if (latestRoundDB) {
        currentRunning = Number(latestRoundDB.motherlode_running) || 0;
      }
    } else {
      currentRunning = 0;
    }

    for (const round of roundsToUpsert) {
      const contributions = (round.winners || 0) * 0.2;
      if (round.motherlode_hit) {
        round.motherlode_value = currentRunning + contributions;
        round.motherlode_running = 0;
        currentRunning = 0;
      } else {
        round.motherlode_value = null;
        currentRunning += contributions;
        round.motherlode_running = currentRunning;
      }
    }

    // Upsert in batches
    for (let i = 0; i < roundsToUpsert.length; i += BATCH_SIZE) {
      const batch = roundsToUpsert.slice(i, i + BATCH_SIZE);
      const { error } = await supabaseAdmin.from('rounds').upsert(batch, {
        onConflict: 'round_id',
        ignoreDuplicates: false,
      });

      if (error) {
        throw error;
      }

      insertedRows += batch.length;
    }

    // Update latestRoundId to max of current and new
    const maxId = Math.max(...roundsToUpsert.map(r => r.round_id));
    latestRoundId = Math.max(latestRoundId, maxId);

    // Determine next cursor (next page to fetch)
    const nextCursor = (totalPages !== null && page > totalPages) ? null : String(page);

    // Update sync_metadata
    await updateSyncMetadata(latestRoundId, nextCursor);

    const finishedAt = new Date().toISOString();
    await logSync('rounds', 'success', null, insertedRows, startedAt, finishedAt);

    return NextResponse.json({
      success: true,
      insertedRows,
      latestRoundId,
      nextCursor,
      processedPages,
      fullBackfill: FULL_BACKFILL,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    Sentry.captureException(err, { tags: { route: 'sync/rounds' } });
    console.error('Sync rounds error:', err);
    const finishedAt = new Date().toISOString();
    await logSync('rounds', 'error', errorMessage, roundsSynced, startedAt, finishedAt);
    return NextResponse.json({ error: 'Sync failed', details: errorMessage }, { status: 500 });
  }
}

async function logSync(jobType: string, status: string, errorMessage: string | null, roundsSynced: number, started: string, finished: string) {
  try {
    const supabaseAdmin = await getSupabaseAdmin();
    await supabaseAdmin.from('sync_log').insert({
      job_type: jobType,
      status: status,
      rounds_synced: roundsSynced,
      error_message: errorMessage,
      started_at: started,
      finished_at: finished,
    });
  } catch (logErr) {
    console.error('Failed to write sync_log:', logErr);
  }
}

async function fetchRoundsPage(page: number): Promise<any> {
  const EXPLORE_API_URL = 'https://api.rore.supply/api/explore';
  const url = new URL(EXPLORE_API_URL);
  url.searchParams.set('page', String(page));
  url.searchParams.set('limit', String(PAGE_LIMIT));
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch rounds: ${response.status} ${response.statusText}`);
  }
  return await response.json();
}

function extractRoundsData(payload: any): any[] {
  if (Array.isArray(payload.roundsData)) return payload.roundsData;
  if (Array.isArray(payload.data)) return payload.data;
  if (payload.data && typeof payload.data === 'object') {
    const nested = payload.data as { roundsData?: any[] };
    if (Array.isArray(nested.roundsData)) return nested.roundsData;
  }
  return [];
}

function normalizeRound(rawRound: any): TablesInsert<'rounds'> | null {
  if (!rawRound || typeof rawRound !== 'object') return null;
  const round = rawRound as Record<string, unknown>;

  // round_id (required)
  const roundId = pickInteger(round, ['roundId', 'round_id', 'id']);
  if (roundId === null) return null;

  // block_number (nullable)
  let block_number: number | null = null;
  const blockVal = round.block;
  if (typeof blockVal === 'string') {
    const digits = blockVal.replace(/\D/g, '');
    if (digits) block_number = parseInt(digits, 10);
  } else if (typeof blockVal === 'number') {
    block_number = blockVal;
  }

  // winner_take_all (required)
  const winnerTakeAll = round.winnerTakeAll as boolean | undefined;
  if (winnerTakeAll === undefined) return null;

  // winner_address (nullable)
  const winnerAddress = round.oreWinnerAddress as string | undefined | null;

  // winners (required, NOT NULL)
  let winners = pickInteger(round, ['winners', 'winnersCount', 'entries', 'entryCount']);
  if (winners === null) winners = 0;

  // deployed, vaulted, winnings (required, NOT NULL)
  const deployed = parseNumeric(round.deployed);
  const vaulted = parseNumeric(round.vaulted);
  const winnings = parseNumeric(round.winnings);

  // motherlode_hit (required)
  const motherlodeHit = round.motherlodeHit as boolean | undefined;
  if (motherlodeHit === undefined) return null;

  // end_timestamp (required)
  let end_timestamp: string | null = null;
  const endTs = round.endTimestamp;
  if (typeof endTs === 'number') {
    end_timestamp = new Date(endTs * 1000).toISOString();
  } else if (typeof round.end_time === 'string') {
    end_timestamp = round.end_time;
  }
  if (!end_timestamp) return null;

  return {
    round_id: roundId,
    block_number: block_number,
    winner_take_all: winnerTakeAll,
    winner_address: winnerAddress ?? null,
    winners,
    deployed,
    vaulted,
    winnings,
    motherlode_hit: motherlodeHit,
    motherlode_value: null,
    motherlode_running: 0,
    end_timestamp,
  };
}

function pickInteger(
  source: Record<string, unknown>,
  keys: string[],
): number | null {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'number' && Number.isInteger(value)) {
      return value;
    }
    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number.parseInt(value, 10);
      if (Number.isInteger(parsed)) {
        return parsed;
      }
    }
  }
  return null;
}

function parseNumeric(val: unknown): number {
  if (typeof val === 'number' && Number.isFinite(val)) return val;
  if (typeof val === 'string') {
    const parsed = parseFloat(val);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

async function updateSyncMetadata(lastRoundId: number, nextCursor: string | null): Promise<void> {
  const supabaseAdmin = await getSupabaseAdmin();
  const { error } = await supabaseAdmin.from('sync_metadata').upsert({
    id: 'rounds',
    last_synced_at: new Date().toISOString(),
    last_round_number: lastRoundId || null,
    next_cursor: nextCursor,
  });
  if (error) {
    throw error;
  }
}
