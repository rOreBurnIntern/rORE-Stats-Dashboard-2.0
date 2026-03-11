# PROJECT STATE: rORE Stats Dashboard 2.0 — Supabase Layer
**Date:** 2026-03-11 11:30 UTC
**Status:** 🟢 DATABASE LAYER COMPLETED — Ready for Supabase project creation and migration run

---

## ✅ WHAT'S DONE

### Supabase Schema & Migrations (Codex session: neat-sable)
- **SQL migration** (`supabase/migrations/001_initial_schema.sql`):
  - Tables: `rounds`, `price_history`, `sync_metadata`
  - Indexes for performance (round_number, round_end_time, price_timestamp)
  - Row-Level Security (RLS) enabled on all tables
  - RLS policies: authenticated users can read, service role can read/write
  - Helper function `get_latest_round()` for convenience
  - View `latest_stats` (degrades safely if `protocol_stats` table missing)
  - Note: PostgreSQL RLS cannot enforce per-query row caps; handled in app logic

- **TypeScript types** (`types/supabase.ts`): Database client types aligned with schema
- **Sync scripts**:
  - `scripts/sync-prices.ts`: fetches prices from api.rore.supply, upserts to `price_history`
  - `scripts/sync-rounds.ts`: fetches rounds, handles backfill cursors, updates `sync_metadata`
- **Documentation** (`supabase/README.md`): local migration steps, env vars, integration notes

---

## ⏳ PENDING (Your Action Required)

### 1. Supabase Project Setup
- If you don't have a Supabase project for this dashboard, create one at supabase.com
- Note: Project name: rORE Stats Dashboard 2.0
- Obtain connection string (`POSTGRES_URL`) and Anon/Service keys

### 2. Run Migrations
Option A (local Supabase CLI):
```bash
supabase db push
```
Option B (SQL editor):
- Paste contents of `supabase/migrations/001_initial_schema.sql` into Supabase SQL editor

### 3. Configure Environment Variables
Add to Next.js `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=<your-project-ref>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

### 4. Test Sync Jobs
Run locally to populate initial data:
```bash
npx tsx scripts/sync-prices.ts
npx tsx scripts/sync-rounds.ts
```

---

## 📊 PROJECT CONTEXT

**Why Supabase?**
- Provides PostgreSQL with realtime subscriptions (future feature)
- Simple auth integration (if user accounts needed later)
- Built-in API and admin UI

**Known Limitations/Notes:**
- RLS row caps not enforceable in PostgreSQL; pagination must be enforced in application code
- `latest_stats` view references `protocol_stats` (not in schema); view returns NULL for those columns until that table is added later

---

## 📁 LOCATIONS

- Workspace: `/home/openclaw/.openclaw/workspace/life/projects/rore-stats-2.0`
- Git: ready to commit (all files present)
- Deploy target: Vercel (separate from database setup)

---

## 🎯 NEXT MILESTONES

1. You complete Supabase project creation and migration run (~15 min)
2. Verify tables exist in Supabase dashboard
3. Run sync scripts to backfill historical rounds and current prices
4. Build API routes to serve data to frontend
5. Build frontend components/charts

---

**Last updated:** 2026-03-11 11:30 UTC
**Owner:** skmd
**Next check:** After Supabase credentials obtained and migration executed
