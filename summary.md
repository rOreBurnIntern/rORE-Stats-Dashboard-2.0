# rORE Stats Dashboard 2.0

**Last synthesized:** 2026-03-11 (initial)

## Status
Planned — workspace initialized, PRD pending.

## Overview
Clean rebuild of the rORE stats dashboard using Next.js 14 + Tailwind + Supabase. Will sync live prices and historical round data, with interactive charts via Recharts.

## Tech Stack
- **Frontend:** Next.js 14 (App Router), Tailwind CSS
- **Charts:** Recharts
- **Backend:** Next.js API Routes
- **Database:** Supabase (PostgreSQL)
- **Sync:** Cron jobs for prices + rounds

## Architecture Plan
1. Supabase project setup + schema migrations
2. Backend sync service (fetches from https://api.rore.supply, stores rounds)
3. API routes serving aggregated stats
4. Frontend dashboard with charts and responsive layout

## Key Goals
- Display live rORE and WETH prices (USD)
- Show current round data (number, prize, entries, time remaining)
- Display motherlode stats (total value, participants)
- Line chart of motherlode history (31k+ backfilled rounds)
- Round-by-round history view with filters

## Next Steps
1. Write detailed PRD with task checklist
2. Spawn Codex to implement Supabase schema + migrations
3. Build sync jobs (prices + rounds)
4. Backfill historical rounds
5. Build frontend components

## Dependencies
- Supabase project credentials available
- Access to api.rore.supply endpoints confirmed
- No third-party API keys needed beyond Supabase

**Target:** Production-ready dashboard with reliable data pipeline.