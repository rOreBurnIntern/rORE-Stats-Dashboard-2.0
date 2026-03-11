import { createClient } from '@supabase/supabase-js';

import type { Database, TablesInsert } from '../types/supabase';

const SUPABASE_URL = getEnv('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY');
const PRICES_API_URL = 'https://api.rore.supply/api/prices';

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

type PricesApiResponse = Record<string, unknown>;

async function main(): Promise<void> {
  const payload = await fetchPrices();
  const record = normalizePrices(payload);

  if (!record) {
    throw new Error('Unable to derive ore_price_usd and weth_price_usd from prices payload.');
  }

  const { error } = await supabase.from('price_history').insert(record);

  if (error) {
    throw error;
  }

  console.log(JSON.stringify(record, null, 2));
}

async function fetchPrices(): Promise<PricesApiResponse> {
  const response = await fetch(PRICES_API_URL);

  if (!response.ok) {
    throw new Error(`Failed to fetch prices: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as PricesApiResponse;
}

function normalizePrices(payload: PricesApiResponse): TablesInsert<'price_history'> | null {
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
    return null;
  }

  return {
    timestamp: pickTimestamp(payload, ['timestamp', 'updatedAt', 'fetchedAt']) ?? new Date().toISOString(),
    ore_price_usd: orePriceUsd,
    weth_price_usd: wethPriceUsd,
  };
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
