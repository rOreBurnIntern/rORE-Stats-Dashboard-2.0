# rORE Stats Dashboard 2.0

**Last synthesized:** 2026-03-12 07:00 UTC (schema migrated + redeployed)

## Status
🟢 **Live on Vercel** — https://rore-stats-v2-rebuild.vercel.app  
Schema is PRD-aligned. Full backfill complete (32,639 rounds).

## Overview
Clean rebuild of the rORE stats dashboard using Next.js 14 + Tailwind + Supabase. PRD v3 spec. Data pipeline syncs live prices and ongoing round data with historical backfill via chain API.

## Tech Stack
- **Frontend:** Next.js 14 (App Router), Tailwind CSS, Recharts
- **Backend:** Next.js API Routes
- **Database:** Supabase (PostgreSQL) — PRD v3 schema
- **Hosting:** Vercel

## Current Schema (PRD v3)
Tables: `rounds`, `prices`, `protocol_stats`, `sync_log`  
Key columns in `rounds`: `round_id`, `block_number`, `winner_take_all`, `motherlode_hit`, `motherlode_value`, `motherlode_running`

## Key Milestones
- ✅ Database schema (PRD v3) applied to Supabase
- ✅ `rounds` table dropped (CASCADE) and recreated with PRD columns
- ✅ `types/supabase.ts` and `scripts/sync-rounds.ts` rewritten to PRD spec
- ✅ Full backfill: **32,639 rounds** (latest round_id: 32,641)
- ✅ Deployed to Vercel: https://rore-stats-v2-rebuild.vercel.app

## Remaining Tasks
1. Add `CRON_SECRET` to Vercel env (secure cron endpoints)
2. Build PRD-compliant sync endpoints (`/api/sync/prices`, `/api/sync/rounds`) with auth + `sync_log` tracking
3. Update frontend to full PRD spec (Burncoin theme, Recharts donut/bar/line with motherlode calc)
4. Configure `vercel.json` crons for scheduled sync jobs
5. Test end-to-end pipeline; validate live data

## Notes
- `latest_stats` view was dropped alongside old rounds table (CASCADE dependency) — needs recreation per PRD spec if required
- `motherlode_running` computed cumulatively when `motherlode_hit = false`
- skmd is non-technical; requires copy-paste-ready SQL and step-by-step instructions for DB operations
