import assert from 'node:assert/strict';
import test from 'node:test';

import {
  parseHoursRange,
  toApiPrice,
  toApiRound,
  toNumber,
} from './dashboardTransforms.ts';

test('parseHoursRange accepts plain hour values', () => {
  assert.equal(parseHoursRange('24'), 24);
});

test('parseHoursRange accepts hour values with h suffix', () => {
  assert.equal(parseHoursRange('24h'), 24);
});

test('parseHoursRange rejects invalid values', () => {
  assert.equal(parseHoursRange('0'), null);
  assert.equal(parseHoursRange('abc'), null);
  assert.equal(parseHoursRange('-1h'), null);
});

test('toApiPrice converts numeric strings to numbers', () => {
  assert.deepEqual(
    toApiPrice({
      ore_price_usd: '0.125',
      weth_price_usd: '3123.45',
      timestamp: '2026-03-12T00:00:00.000Z',
    }),
    {
      ore_price_usd: 0.125,
      weth_price_usd: 3123.45,
      timestamp: '2026-03-12T00:00:00.000Z',
    },
  );
});

test('toApiRound shapes active rounds with prize total and null start time', () => {
  assert.deepEqual(
    toApiRound(
      {
        round_id: 42,
        vaulted: '10',
        winnings: '5.5',
        motherlode_value: null,
        motherlode_running: '12.25',
        end_timestamp: '2026-03-12T01:00:00.000Z',
        winners: 7,
      },
      '2026-03-12T00:00:00.000Z',
    ),
    {
      round_number: 42,
      prize: JSON.stringify({ amount: '15.50000000', currency: 'ORE' }),
      entries: 7,
      start_time: null,
      end_time: '2026-03-12T01:00:00.000Z',
      status: 'active',
    },
  );
});

test('toApiRound marks completed rounds and includes motherlode value in the prize', () => {
  assert.deepEqual(
    toApiRound(
      {
        round_id: 43,
        vaulted: 10,
        winnings: 5.5,
        motherlode_value: '3.25',
        motherlode_running: '0',
        end_timestamp: '2026-03-11T23:00:00.000Z',
        winners: 2,
      },
      '2026-03-12T00:00:00.000Z',
    ),
    {
      round_number: 43,
      prize: JSON.stringify({ amount: '18.75000000', currency: 'ORE' }),
      entries: 2,
      start_time: null,
      end_time: '2026-03-11T23:00:00.000Z',
      status: 'completed',
    },
  );
});

test('toNumber falls back on invalid values', () => {
  assert.equal(toNumber('', 0), 0);
  assert.equal(toNumber('not-a-number', 0), 0);
  assert.equal(toNumber(undefined, null), null);
});
