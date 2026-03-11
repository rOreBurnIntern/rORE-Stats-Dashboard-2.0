import { createClient } from '@supabase/supabase-js';

import type { Database, TablesInsert } from '../types/supabase';

const SUPABASE_URL = getEnv('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY');
const EXPLORE_API_URL = 'https://api.rore.supply/api/explore';
const BATCH_SIZE = Number(process.env.ROUNDS_UPSERT_BATCH_SIZE ?? 250);
const MAX_PAGES_PER_RUN = Number(process.env.ROUNDS_MAX_PAGES_PER_RUN ?? 50);
const FULL_BACKFILL = process.env.FULL_BACKFILL === 'true';

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

type ExploreApiResponse = {
  nextCursor?: string | null;
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

  let cursor = syncState?.next_cursor ?? null;
  let latestRoundNumber = syncState?.last_round_number ?? 0;
  let processedPages = 0;
  let insertedRows = 0;

  while (processedPages < MAX_PAGES_PER_RUN) {
    const payload = await fetchRoundsPage(cursor);
    const rawRounds = extractRoundsData(payload);

    if (rawRounds.length === 0) {
      break;
    }

    const normalizedRounds = rawRounds
      .map(normalizeRound)
      .filter((round): round is TablesInsert<'rounds'> => round !== null)
      .filter((round) => round.round_number > latestRoundNumber);

    if (normalizedRounds.length > 0) {
      for (let index = 0; index < normalizedRounds.length; index += BATCH_SIZE) {
        const batch = normalizedRounds.slice(index, index + BATCH_SIZE);
        const { error } = await supabase.from('rounds').upsert(batch, {
          onConflict: 'round_number',
          ignoreDuplicates: false,
        });

        if (error) {
          throw error;
        }

        insertedRows += batch.length;
      }

      latestRoundNumber = Math.max(
        latestRoundNumber,
        ...normalizedRounds.map((round) => round.round_number),
      );
    }

    cursor = extractNextCursor(payload);
    processedPages += 1;

    if (!cursor) {
      break;
    }
  }

  const { error: syncWriteError } = await supabase.from('sync_metadata').upsert({
    id: 'rounds',
    last_synced_at: new Date().toISOString(),
    last_round_number: latestRoundNumber || null,
    next_cursor: cursor,
  });

  if (syncWriteError) {
    throw syncWriteError;
  }

  console.log(
    JSON.stringify(
      {
        insertedRows,
        latestRoundNumber,
        nextCursor: cursor,
        processedPages,
      },
      null,
      2,
    ),
  );
}

async function fetchRoundsPage(cursor: string | null): Promise<ExploreApiResponse> {
  const url = new URL(EXPLORE_API_URL);

  if (cursor) {
    url.searchParams.set('cursor', cursor);
  }

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch rounds: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as ExploreApiResponse;
}

function extractRoundsData(payload: ExploreApiResponse): unknown[] {
  if (Array.isArray(payload.roundsData)) {
    return payload.roundsData;
  }

  if (Array.isArray(payload.data)) {
    return payload.data;
  }

  if (payload.data && typeof payload.data === 'object') {
    const nestedData = payload.data as { roundsData?: unknown[] };

    if (Array.isArray(nestedData.roundsData)) {
      return nestedData.roundsData;
    }
  }

  return [];
}

function extractNextCursor(payload: ExploreApiResponse): string | null {
  if (typeof payload.nextCursor === 'string') {
    return payload.nextCursor;
  }

  if (payload.data && typeof payload.data === 'object') {
    const nestedData = payload.data as { nextCursor?: string | null };

    if (typeof nestedData.nextCursor === 'string') {
      return nestedData.nextCursor;
    }
  }

  return null;
}

function normalizeRound(rawRound: unknown): TablesInsert<'rounds'> | null {
  if (!rawRound || typeof rawRound !== 'object') {
    return null;
  }

  const round = rawRound as Record<string, unknown>;
  const roundNumber = pickInteger(round, ['round_number', 'roundNumber', 'round', 'id', 'roundId']);

  if (roundNumber === null) {
    return null;
  }

  const prize = pickNumericString(round, ['prize', 'prizeAmount', 'rorePrize', 'winnings']);
  const entries = pickInteger(round, ['entries', 'entryCount', 'participants', 'winners']);
  const start_time = pickTimestamp(round, ['start_time', 'startTime', 'startedAt']);
  const end_time = pickTimestamp(round, ['end_time', 'endTime', 'endedAt', 'endTimestamp']);

  // Infer status: if we have end_time, it's completed; otherwise null.
  let status: string | null = pickString(round, ['status', 'state']);
  if (!status && end_time) {
    status = 'completed';
  }

  return {
    round_number: roundNumber,
    prize,
    entries,
    start_time,
    end_time,
    status,
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

function pickString(
  source: Record<string, unknown>,
  keys: string[],
): string | null {
  for (const key of keys) {
    const value = source[key];

    if (typeof value === 'string' && value.trim() !== '') {
      return value;
    }
  }

  return null;
}

function getEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
