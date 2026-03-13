# rORE Stats Dashboard — P0 Data Wiring (Sprint)

## Objective
Implement data layer and wire frontend to use Supabase directly to satisfy PRD v3 requirements.

## Scope (P0 tasks)
1. Create `lib/db-stats.ts` with server-side functions:
   - `getLatestPrices()`: `{ ore_price_usd, weth_price_usd }`
   - `getLatestRound()`: full latest round object (round_id, vaulted, winnings, motherlode_value, motherlode_running, winners, end_timestamp, deployed?)
   - `getMotherlodeHistory()`: `[{ round_id, motherlode_running, end_timestamp }]` (all rounds, no limit, ordered by round_id asc)
   - `getWinnerTypes(limit = 1044)`: `{ wta: number, split: number }` from most recent `limit` rounds
   - `getBlockPerformance()`: `[{ block_number, count }]` for blocks 1-25

2. Convert `app/page.tsx` to a server component:
   - Remove `'use client'`
   - Import and call these functions at top-level (await)
   - Pass data to components via props:
     - Prices → price cards
     - Latest round → MotherlodeAllocationDonut
     - Motherlode history → new MotherlodeLineChart (based on existing MotherlodeChart)
     - Winner types → new WinnerTypesPie
     - Block perf → new BlockPerformanceBar
   - Remove client-side `useEffect` fetch logic and state
   - Keep layout: header, stats row, grid(pie+bar), full-width line chart, RoundsPerDayBar (can be removed later)

3. Create new components (Recharts):
   - `WinnerTypesPie.tsx`: donut/pie for WTA vs Split with legend and percentages.
   - `BlockPerformanceBar.tsx`: bar chart blocks 1-25.
   - Adapt `MotherlodeChart.tsx` to `MotherlodeLineChart.tsx` (or update) to accept `data` prop and show all history.

4. Update layout order per PRD: pie+bar side-by-side (`grid-cols-1 xl:grid-cols-2 gap-4`), then full-width line chart below.

## Technical notes
- Use `supabaseAdmin` from `@/lib/supabaseAdmin` and types from `@/types/supabase`.
- Winner types: count `winner_take_all` true/false.
- Block perf: filter `block_number` between 1 and 25, group by block_number.
- Motherlode history: simple select all order asc.
- Winner types limit: `order('round_id', {ascending: false}).limit(1044)`.
- Keep existing rORE theme (colors from globals.css).
- Maintain existing imports; ensure TypeScript compiles.

## Acceptance
- Page renders all charts with correct data.
- No console errors.
- Price cards show latest values.
- Pie shows WTA/Split split; bar shows 25 bars; line chart shows complete sawtooth pattern.
- Layout matches PRD (pie+bar grid, line full-width below).
- Build succeeds.

## Out of scope for this sprint
- P1-1: Switch to react-chartjs-2 (later)
- P1-3: Theme color updates (blocked)
- P2 cleanups (extra components, legacy text cleanup, header issues)
- P3 polish
