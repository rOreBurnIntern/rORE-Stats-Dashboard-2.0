import { createClient } from '@supabase/supabase-js';
import type { Database, TablesInsert } from '../types/supabase';

const SUPABASE_URL = getEnv('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY');
const EXPLORE_API_URL = 'https://api.rore.supply/api/explore';
const PAGE_LIMIT = Number(process.env.ROUNDS_PAGE_LIMIT ?? 200);
const BATCH_SIZE = Number(process.env.ROUNDS_UPSERT_BATCH_SIZE ?? 250);
const MAX_PAGES_PER_RUN = Number(process.env.ROUNDS_MAX_PAGES_PER_RUN ?? 50);
const FULL_BACKFILL = process.env.FULL_BACKFILL === 'true';

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

type ExploreApiResponse = {
  pagination?: {
    page: number;
    totalPages: number;
    total: number;
    limit: number;
  };
  roundsData?: unknown[];
} & Record<string, unknown>;

async function main(): Promise<void> {
  const { data: syncState, error: syncReadError } = await supabase
    .from('sync_metadata')
    .select('*')
    .eq('id', 'rounds')
    .maybeSingle();

  if (syncReadError) {
    throw syncReadError;
  }

  // Determine starting page
  const initialPage = FULL_BACKFILL ? 1 : (Number(syncState?.next_cursor) || 1);
  let page = initialPage;
  let latestRoundId = syncState?.last_round_number ?? 0;
  let processedPages = 0;
  let insertedRows = 0;
  const allRawRounds: unknown[] = [];
  let totalPages: number | null = null;

  // Fetch pages sequentially
  while (processedPages < MAX_PAGES_PER_RUN) {
    const payload = await fetchRoundsPage(page);

    // Capture totalPages from first response
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

    // If we know totalPages and have reached it, stop
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
    return;
  }

  // Deduplicate by round_id (keep last occurrence)
  const uniqueMap = new Map<number, TablesInsert<'rounds'>>();
  for (const r of allNormalized) {
    uniqueMap.set(r.round_id, r);
  }
  const uniqueRounds = Array.from(uniqueMap.values());

  // Determine which rounds to process
  let roundsToUpsert: TablesInsert<'rounds'>[];
  if (FULL_BACKFILL) {
    roundsToUpsert = uniqueRounds;
  } else {
    roundsToUpsert = uniqueRounds.filter(r => r.round_id > latestRoundId);
  }

  if (roundsToUpsert.length === 0) {
    console.log('No new rounds to upsert.');
    // Update next_cursor to nextPage anyway
    const nextCursor = (totalPages !== null && page > totalPages) ? null : String(page);
    await updateSyncMetadata(latestRoundId, nextCursor);
    return;
  }

  // Sort ascending by round_id for motherlode computation
  roundsToUpsert.sort((a, b) => a.round_id - b.round_id);

  // Compute motherlode_running and motherlode_value
  let currentRunning = 0;

  if (!FULL_BACKFILL && latestRoundId > 0) {
    const { data: latestRoundDB, error: fetchErr } = await supabase
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
    const { error } = await supabase.from('rounds').upsert(batch, {
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
  const { error: syncWriteError } = await supabase.from('sync_metadata').upsert({
    id: 'rounds',
    last_synced_at: new Date().toISOString(),
    last_round_number: latestRoundId || null,
    next_cursor: nextCursor,
  });

  if (syncWriteError) {
    throw syncWriteError;
  }

  console.log(
    JSON.stringify(
      {
        insertedRows,
        latestRoundId,
        nextCursor,
        processedPages,
        fullBackfill: FULL_BACKFILL,
      },
      null,
      2,
    ),
  );
}

// --- Helpers ---

async function fetchRoundsPage(page: number): Promise<ExploreApiResponse> {
  const url = new URL(EXPLORE_API_URL);
  url.searchParams.set('page', String(page));
  url.searchParams.set('limit', String(PAGE_LIMIT));
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch rounds: ${response.status} ${response.statusText}`);
  }
  return (await response.json()) as ExploreApiResponse;
}

function extractRoundsData(payload: ExploreApiResponse): unknown[] {
  if (Array.isArray(payload.roundsData)) return payload.roundsData;
  if (Array.isArray(payload.data)) return payload.data;
  if (payload.data && typeof payload.data === 'object') {
    const nested = payload.data as { roundsData?: unknown[] };
    if (Array.isArray(nested.roundsData)) return nested.roundsData;
  }
  return [];
}

function normalizeRound(rawRound: unknown): TablesInsert<'rounds'> | null {
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

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

async function updateSyncMetadata(lastRoundId: number, nextCursor: string | null): Promise<void> {
  const { error } = await supabase.from('sync_metadata').upsert({
    id: 'rounds',
    last_synced_at: new Date().toISOString(),
    last_round_number: lastRoundId || null,
    next_cursor: nextCursor,
  });
  if (error) {
    throw error;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
