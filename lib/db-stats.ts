import type { Tables } from '@/types/supabase';

export type LatestPrices = {
  ore_price_usd: number | null;
  weth_price_usd: number | null;
  timestamp: string | null;
};

export type LatestRound = Pick<
  Tables<'rounds'>,
  | 'round_id'
  | 'deployed'
  | 'vaulted'
  | 'winnings'
  | 'motherlode_hit'
  | 'motherlode_value'
  | 'motherlode_running'
  | 'winners'
  | 'end_timestamp'
>;

export type MotherlodeHistoryPoint = {
  round_number: number;
  motherlode_ore: number;
  timestamp: string;
};

export type WinnerTypes = {
  wta: number;
  split: number;
  total: number;
};

export type BlockPerformancePoint = {
  block_number: number;
  count: number;
};

export type DbStatsData = {
  latestPrices: LatestPrices;
  latestRound: LatestRound | null;
  motherlodeHistory: MotherlodeHistoryPoint[];
  winnerTypes: WinnerTypes;
  blockPerformance: BlockPerformancePoint[];
};

type WinnerTypeRow = Pick<Tables<'rounds'>, 'winner_take_all'>;
type BlockPerformanceRow = Pick<Tables<'rounds'>, 'block_number'>;
type MotherlodeHistoryRow = Pick<Tables<'rounds'>, 'round_id' | 'motherlode_running' | 'end_timestamp'>;

function toNumber(value: number | string | null | undefined): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

async function getSupabaseAdmin() {
  const { supabaseAdmin } = await import('@/lib/supabaseAdmin');
  return supabaseAdmin;
}

export function countWinnerTypes(rows: WinnerTypeRow[]): WinnerTypes {
  let wta = 0;
  let split = 0;

  for (const row of rows) {
    if (row.winner_take_all) {
      wta += 1;
      continue;
    }

    split += 1;
  }

  return {
    wta,
    split,
    total: wta + split,
  };
}

export function buildBlockPerformance(rows: BlockPerformanceRow[]): BlockPerformancePoint[] {
  const counts = new Map<number, number>();

  for (let block = 1; block <= 25; block += 1) {
    counts.set(block, 0);
  }

  for (const row of rows) {
    if (row.block_number === null) {
      continue;
    }

    const currentCount = counts.get(row.block_number);
    if (currentCount === undefined) {
      continue;
    }

    counts.set(row.block_number, currentCount + 1);
  }

  return Array.from(counts.entries()).map(([block_number, count]) => ({
    block_number,
    count,
  }));
}

export function mapMotherlodeHistory(rows: MotherlodeHistoryRow[]): MotherlodeHistoryPoint[] {
  return rows.map((row) => ({
    round_number: row.round_id,
    motherlode_ore: toNumber(row.motherlode_running),
    timestamp: row.end_timestamp,
  }));
}

export async function getLatestPrices(): Promise<LatestPrices> {
  const supabaseAdmin = await getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from('prices')
    .select('ore_usd, weth_usd, api_timestamp')
    .order('api_timestamp', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return {
    ore_price_usd: data ? toNumber(data.ore_usd) : null,
    weth_price_usd: data ? toNumber(data.weth_usd) : null,
    timestamp: data?.api_timestamp ?? null,
  };
}

export async function getLatestRound(): Promise<LatestRound | null> {
  const supabaseAdmin = await getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from('rounds')
    .select(
      'round_id, deployed, vaulted, winnings, motherlode_hit, motherlode_value, motherlode_running, winners, end_timestamp',
    )
    .order('round_id', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function getMotherlodeHistory(limit?: number): Promise<MotherlodeHistoryPoint[]> {
  const supabaseAdmin = await getSupabaseAdmin();
  if (typeof limit === 'number') {
    const { data, error } = await supabaseAdmin
      .from('rounds')
      .select('round_id, motherlode_running, end_timestamp')
      .order('round_id', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return mapMotherlodeHistory((data ?? []).reverse());
  }

  const { data, error } = await supabaseAdmin
    .from('rounds')
    .select('round_id, motherlode_running, end_timestamp')
    .order('round_id', { ascending: true });

  if (error) {
    throw error;
  }

  return mapMotherlodeHistory(data ?? []);
}

export async function getWinnerTypes(limit = 1044): Promise<WinnerTypes> {
  const supabaseAdmin = await getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from('rounds')
    .select('winner_take_all')
    .order('round_id', { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return countWinnerTypes(data ?? []);
}

export async function getBlockPerformance(): Promise<BlockPerformancePoint[]> {
  const supabaseAdmin = await getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from('rounds')
    .select('block_number')
    .gte('block_number', 1)
    .lte('block_number', 25);

  if (error) {
    throw error;
  }

  return buildBlockPerformance(data ?? []);
}

export async function getDbStatsData(): Promise<DbStatsData> {
  const [latestPrices, latestRound, motherlodeHistory, winnerTypes, blockPerformance] = await Promise.all([
    getLatestPrices(),
    getLatestRound(),
    getMotherlodeHistory(),
    getWinnerTypes(),
    getBlockPerformance(),
  ]);

  return {
    latestPrices,
    latestRound,
    motherlodeHistory,
    winnerTypes,
    blockPerformance,
  };
}
