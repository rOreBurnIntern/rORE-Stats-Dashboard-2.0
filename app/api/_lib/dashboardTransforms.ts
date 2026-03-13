type NumericLike = number | string | null | undefined;

export type PriceApiRow = {
  ore_price_usd: NumericLike;
  weth_price_usd: NumericLike;
  timestamp: string;
};

export type RoundApiRow = {
  round_id: number;
  vaulted: NumericLike;
  winnings: NumericLike;
  motherlode_value: NumericLike;
  motherlode_running: NumericLike;
  end_timestamp: string;
  winners: number;
};

export type RoundResponse = {
  round_number: number;
  prize: string;
  entries: number;
  start_time: null;
  end_time: string;
  status: 'active' | 'completed';
};

export function parseHoursRange(range: string | null): number | null {
  if (!range) {
    return null;
  }

  const match = range.trim().match(/^(\d+)(h)?$/i);
  if (!match) {
    return null;
  }

  const hours = Number.parseInt(match[1], 10);
  return Number.isInteger(hours) && hours > 0 ? hours : null;
}

export function toApiPrice(row: PriceApiRow) {
  return {
    ore_price_usd: toNumber(row.ore_price_usd),
    weth_price_usd: toNumber(row.weth_price_usd),
    timestamp: row.timestamp,
  };
}

export function toApiRound(round: RoundApiRow, nowIso = new Date().toISOString()): RoundResponse {
  const totalPrize =
    (toNumber(round.vaulted, 0) ?? 0) +
    (toNumber(round.winnings, 0) ?? 0) +
    (toNumber(round.motherlode_value, 0) ?? 0);

  return {
    round_number: round.round_id,
    prize: JSON.stringify({
      amount: totalPrize.toFixed(8),
      currency: 'rORE',
    }),
    entries: round.winners,
    start_time: null,
    end_time: round.end_timestamp,
    status: round.end_timestamp > nowIso ? 'active' : 'completed',
  };
}

export function toNumber(value: NumericLike, fallback: number | null = null): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : fallback;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}
