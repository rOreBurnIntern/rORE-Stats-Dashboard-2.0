import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildBlockPerformance,
  countWinnerTypes,
  mapMotherlodeHistory,
} from './db-stats.ts';

test('countWinnerTypes tallies winner-take-all and split rounds', () => {
  assert.deepEqual(
    countWinnerTypes([
      { winner_take_all: true },
      { winner_take_all: false },
      { winner_take_all: false },
      { winner_take_all: true },
    ]),
    {
      wta: 2,
      split: 2,
      total: 4,
    },
  );
});

test('buildBlockPerformance returns counts for all 25 blocks', () => {
  const data = buildBlockPerformance([
    { block_number: 1 },
    { block_number: 1 },
    { block_number: 5 },
    { block_number: 25 },
    { block_number: 30 },
    { block_number: null },
  ]);

  assert.equal(data.length, 25);
  assert.deepEqual(data[0], { block_number: 1, count: 2 });
  assert.deepEqual(data[4], { block_number: 5, count: 1 });
  assert.deepEqual(data[24], { block_number: 25, count: 1 });
  assert.equal(data[1]?.count, 0);
});

test('mapMotherlodeHistory normalizes round ids and numeric values', () => {
  assert.deepEqual(
    mapMotherlodeHistory([
      {
        round_id: 99,
        motherlode_running: 12.5,
        end_timestamp: '2026-03-10T00:00:00.000Z',
      },
      {
        round_id: 100,
        motherlode_running: 0,
        end_timestamp: '2026-03-10T00:05:00.000Z',
      },
    ]),
    [
      {
        round_number: 99,
        motherlode_ore: 12.5,
        timestamp: '2026-03-10T00:00:00.000Z',
      },
      {
        round_number: 100,
        motherlode_ore: 0,
        timestamp: '2026-03-10T00:05:00.000Z',
      },
    ],
  );
});
