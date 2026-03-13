# rORE Stats Dashboard 2.0

**Last synthesized:** 2026-03-12 23:35 UTC (heartbeat completion)

## Status
🟢 **Live on Vercel** — https://rore-stats-v2-rebuild.vercel.app  
Schema is PRD-aligned. Full backfill complete (32,639 rounds). P0/P1 critical tasks in progress.

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

## Current Status
- ✅ API endpoints fully healthy: `/api/stats`, `/api/prices`, `/api/rounds` all return 200 with live data.
- ✅ Automated sync working: GitHub Actions workflow fixed (Authorization header) and successfully synced prices.
- ✅ Prices table populated with latest data.
- ✅ **P0/P1 implementation completed** (commit a6962fc on branch `task/p0-p1-complete`): DB-backed data path wired, motherlode history uncapped, winner types limited to 1,044 rounds, charts replaced with react-chartjs-2, zoom/pan added, layout fixed.
- ✅ **P1-2 theme colors completed** (2026-03-13): Extracted rORE.supply brand palette and applied across dashboard (orange/amber tokens, gradient backgrounds, glow effects, Chart.js theming). Build passes, unit tests pass (10/10).
- 🚀 Ready for merge to main and redeployment to Vercel.
- ⏳ Remaining P1 tasks: P1-3 (legacy text cleanup), P1-4 (header cleanup), P1-5 (DaisyUI strip). P2 cleanup and secondary priorities pending: Discord FAQ, Social Media, Onboarding.

## Next Actions
1. Review and merge `task/p0-p1-complete` to main, then trigger Vercel redeploy.
2. Implement P1-3: Remove all legacy-name text references.
3. Implement P1-4: Remove double header (DashboardHeader).
4. Implement P1-5: Strip DaisyUI CSS and replace with Tailwind.
5. Complete P2 cleanup tasks.
6. Begin secondary priorities: Discord FAQ, Social Media, Onboarding.

## Notes
- `latest_stats` view was dropped alongside old rounds table (CASCADE dependency) — needs recreation per PRD spec if required
- `motherlode_running` computed cumulatively when `motherlode_hit = false`
- skmd is non-technical; requires copy-paste-ready SQL and step-by-step instructions for DB operations
