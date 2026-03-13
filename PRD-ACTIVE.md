# rORE Stats Dashboard 2.0 — ACTIVE PRD

**Last Updated:** 2026-03-13 17:37 UTC  
**Status:** 🟢 LIVE — https://rore-stats-v2-rebuild.vercel.app  
**Next Phase:** P1-5 (DaisyUI strip) in progress; P2/Secondary priorities follow

---

## Project Overview
Clean rebuild of the rORE stats dashboard using Next.js 14 + Tailwind + Supabase. PRD v3 schema. Data pipeline syncs live prices and ongoing round data with historical backfill via chain API.

**Tech Stack:**
- Frontend: Next.js 14 (App Router), Tailwind CSS, Recharts
- Backend: Next.js API Routes
- Database: Supabase (PostgreSQL) — PRD v3 schema
- Hosting: Vercel

---

## Completion Status

### ✅ COMPLETED
| Task | Commit/Date | Notes |
|------|---|---|
| **P0: Data Wiring** | 631e5dd | DB-backed data path wired; motherlode history uncapped; winner types limited to 1,044 rounds; charts replaced with react-chartjs-2; zoom/pan added; layout fixed |
| **P1-2: Theme Colors** | 2026-03-12 | rORE.supply brand palette (orange/amber #ff6b00, secondary #ff3d00, motherlode #ffb15c, text #fff3e8) across tailwind.config.js, globals.css, page.tsx, Chart.js defaults, lib/theme.ts |
| **P1-3: Burncoin Text Removal** | P1-4 merge | All legacy 'Burncoin' references removed; dashboard shell class updated to `dashboard-rore-shell` |
| **P1-4: Header Cleanup** | 923e22c | Removed "Burncoin Dark Theme" chip; simplified header layout; refined kicker text (e.g., "Protocol activity", "Motherlode reserves", "Round countdown", "Round outcomes") |
| **Database Schema (PRD v3)** | 2026-03-11 | Tables: `rounds`, `prices`, `protocol_stats`, `sync_log`; Full backfill: 32,639 rounds |
| **API Endpoints** | 2026-03-11 | `/api/stats`, `/api/prices`, `/api/rounds` all return 200 with live data |
| **Automated Sync** | 2026-03-11 | GitHub Actions workflow fixed; successfully syncing prices |

### ✅ COMPLETED
| Task | Commit/Date | Notes |
|------|---|---|
| **P1-5: DaisyUI Strip** | Before 2026-03-13 | Unused DaisyUI components removed; bundle optimized; no DaisyUI refs in package.json or tailwind.config.js |

### ⏱️ PENDING
| Phase | Tasks | Notes |
|-------|-------|-------|
| **P2 Cleanup** | Legacy component removal, extra tests | After P1-5 |
| **Secondary Priorities** | Discord FAQ doc/channel; Twitter updates; Onboarding guide; Social media content | Parallel tracks; depends on P1-5 completion |

---

## Acceptance Criteria (All Phases)

**Live Site Verification:**
- [ ] Vercel deployment reflects P1-2 theme (rORE orange/amber)
- [ ] No "Burncoin" text visible (P1-3/4 complete)
- [ ] Header matches simplified layout (P1-4 complete)
- [ ] All API endpoints return 200 with live data
- [ ] Charts render with no console errors
- [ ] DaisyUI coffee theme removed (P1-5 complete)
- [ ] Bundle size optimized post-DaisyUI strip

---

## Known Issues
- `latest_stats` view was dropped alongside old rounds table (CASCADE dependency) — needs recreation per PRD spec if required later
- `motherlode_running` computed cumulatively when `motherlode_hit = false`
- Vercel may show stale branding until redeploy completes after merge

---

## How to Update This PRD
1. When a task is completed, move it from "IN PROGRESS" to "COMPLETED" with commit hash and date
2. When a new phase/task is ready, add it to "IN PROGRESS" or "PENDING"
3. Update Last Updated timestamp
4. This is a living doc — change frequently, archive old versions to `/life/archives/rore-stats-2.0/`

---

## Related Docs
- Active summary: `summary.md`
- Archived old PRDs: `/life/archives/rore-stats-2.0/PRD-*.md`
- Backfill notes: `items.json`
