# rORE Stats Dashboard 2.0

**Last synthesized:** 2026-03-11 (Supabase live, sync verified, API routes in progress)

## Status
🟢 Database operational — API routes under development

## Overview
Clean rebuild of the rORE stats dashboard using Next.js 14 + Tailwind + Supabase. Syncs live prices and ongoing rounds data; historical backfill limited by source API (20 rounds per fetch). Interactive charts via Recharts.

## Tech Stack
- **Frontend:** Next.js 14 (App Router), Tailwind CSS
- **Charts:** Recharts
- **Backend:** Next.js API Routes
- **Database:** Supabase (PostgreSQL)
- **Sync:** Incremental price and rounds fetchers

## Architecture Plan
1. Supabase project setup + schema migrations ✅
2. Backend sync service ✅ (tested, inserting prices and rounds)
3. API routes serving aggregated stats (in progress)
4. Frontend dashboard with charts and responsive layout

## Key Goals
- Display live rORE and WETH prices (USD)
- Show current round data (number, prize, entries, end time)
- Motherlode total value (from `latest_stats` view)
- Round history view with filters (limited by source API)
- Clean, responsive UI with dark mode

## Completed Deliverables
- SQL migration executed (tables: `rounds`, `price_history`, `sync_metadata`, `protocol_stats`; RLS; `latest_stats` view)
- `.env.local` configured with Supabase credentials
- Sync scripts tested and verified:
  - `sync-prices.ts` inserts latest prices (ORE + WETH)
  - `sync-rounds.ts` backfills available rounds (API returns ~20 per request; incremental cursor tracked)
- Supabase README completed
- API routes: generation in progress (subagent)

## Current State
- Supabase project: created and reachable
- Database: schema deployed, initial data populated (~40 rounds, 2 price records)
- Sync jobs: confirmed working via CLI
- API routes: completed and verified (prices, stats, rounds, motherlode)
- Frontend: completed
  - Dashboard page with price cards, current round, motherlode stat
  - Price and motherlode charts (Recharts, 24h price history, protocol stats over time)
  - Round history page with paginated table
  - Dark mode support, responsive Tailwind layout

## Next Steps
1. Review and QA locally (run `npx next dev` and test all pages)
2. Deploy to Vercel (connect Supabase production env)
3. Optionally: investigate archive source for full historical rounds backfill (>31k)

## Notes
- The `api.rore.supply/explore` endpoint returns limited rounds per request and `nextCursor` null, suggesting archive is not available via this API. Historical data may require alternative source.
- `latest_stats` view expects `protocol_stats` table; motherlode chart will be empty until that table is populated by future sync jobs or manual backfill.

## Notes
- The `api.rore.supply/explore` endpoint returns limited rounds per request and `nextCursor` null, suggesting archive is not available via this API. Historical data may require alternative source.
- `latest_stats` view expects `protocol_stats` table; motherlode value will be NULL until that table is populated.

**Target:** Production-ready dashboard with reliable realtime data pipeline.