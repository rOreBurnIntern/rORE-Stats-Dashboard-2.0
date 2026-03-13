# rORE Stats Dashboard — Unified Fix Tasklist

**Source:** Combined audit from Sonnet 4.6 + GPT 5.4 reviews
**Date:** 2026-03-12
**For:** rOreBurn_Intern (autonomous execution)

---

## Context

Two independent audits flagged the same core problems. This is the single prioritized list of all required changes. Complete P0 first — most visible bugs cascade from P0-1.

---

## P0 — Critical Blockers (do these first, in order)

### P0-1: Wire page.tsx to DB-backed data path
- **File:** `page.tsx`
- **Problem:** Main page calls `getStatsData()` (direct upstream API, single page fetch) instead of `getDbStatsData()` from `lib/db-stats.ts`
- **Impact:** Winner Types pie chart renders empty or wrong data. Block Performance bar chart is empty. Motherlode history is undefined. This single issue causes most visible chart failures.
- **Fix:** Replace `getStatsData()` call with `getDbStatsData()`. Verify all downstream components receive the correct data shape.

### P0-2: Remove motherlode history 2,000-point cap
- **File:** `lib/db-stats.ts`
- **Problem:** DB query caps motherlode history at 2,000 data points
- **PRD spec:** All historical data should be available (zoom handles viewport)
- **Fix:** Remove the `LIMIT 2000` (or equivalent) from the motherlode history query. Let Chart.js + zoom handle large datasets via Canvas rendering.

### P0-3: Limit Winner Types to last 1,044 rounds
- **File:** `lib/db-stats.ts`
- **Problem:** Winner type counts currently aggregate all historical rounds
- **PRD spec:** Winner Types pie chart covers last 1,044 rounds only
- **Fix:** Add `ORDER BY round_number DESC LIMIT 1044` (or equivalent window) to the winner types query.

---

## P1 — Required for PRD Compliance

### P1-1: Replace all charts with react-chartjs-2
- **Why react-chartjs-2:** PRD specified Chart.js. Canvas rendering handles thousands of motherlode data points better than SVG. The `chartjs-plugin-zoom` provides the exact mouse-wheel zoom + pan the PRD requires. Recharts has no first-party zoom plugin.
- **Install:**
  ```bash
  npm install react-chartjs-2 chart.js chartjs-plugin-zoom
  ```
- **Register plugin globally:**
  ```js
  import { Chart as ChartJS } from 'chart.js';
  import zoomPlugin from 'chartjs-plugin-zoom';
  ChartJS.register(zoomPlugin);
  ```
- **Replace these components:**
  - `MotherlodeLineChart` → `<Line>` from react-chartjs-2
  - Winner Types pie → `<Pie>` from react-chartjs-2
  - Block Performance bar → `<Bar>` from react-chartjs-2
- **Remove:** All custom SVG polyline chart code and custom HTML/CSS pie/bar implementations

### P1-2: Add zoom + pan to Motherlode line chart
- **PRD spec:** Mouse wheel zoom on the motherlode history line chart
- **Config:**
  ```js
  options: {
    plugins: {
      zoom: {
        zoom: {
          wheel: { enabled: true },
          pinch: { enabled: true },
          mode: 'x'
        },
        pan: {
          enabled: true,
          mode: 'x'
        }
      }
    }
  }
  ```
- Add a "Reset Zoom" button that calls `chartRef.current.resetZoom()`

### P1-3: Fix theme colors to match rore.supply
- **Current (wrong):** Background `#090402`, accent `#ff8a2a`, missing `#ff3d00`
- **Target:** Pull exact hex values from rore.supply CSS/Tailwind config
- **Action (TBD — colors to be provided):**
  - [ ] Background color: `__TBD__`
  - [ ] Primary accent: `__TBD__`
  - [ ] Secondary accent: `__TBD__`
  - [ ] Text color: `__TBD__`
  - [ ] Chart line/fill colors: derive from accent palette
- **Scope:** Apply to all CSS custom properties / Tailwind config. Every chart, card, and header should use these tokens.
- **BLOCKED** — waiting on color extraction from rore.supply

### P1-4: Fix layout order
- **PRD spec:** Winner Types pie + Block Performance bar side-by-side, then full-width Motherlode line chart below
- **Current:** Everything stacked vertically with extra snapshot bars inserted
- **Fix:** Wrap pie + bar in `grid grid-cols-1 xl:grid-cols-2 gap-4`, place line chart in full-width row below

---

## P2 — Cleanup & Polish

### P2-1: Remove all legacy brand text
- **Problem:** Kicker text still says the pre-`rORE` product name in user-facing copy
- **Fix:** Global find-and-replace so all components, copy strings, and metadata consistently use `rORE`

### P2-2: Remove extra unrequested components
- Remove or gate behind a flag:
  - Market Snapshot bar chart
  - Protocol Snapshot bar chart
  - RoundCard / Current Round card
- These are not in the PRD. If they have future value, move to a separate `/extras` route — do not show on the main dashboard.

### P2-3: Remove double header
- **Problem:** Both shell navigation and `DashboardHeader` render, creating redundant chrome
- **Fix:** Keep one. If the shell nav is the app-wide layout, remove `DashboardHeader`. If `DashboardHeader` has dashboard-specific controls, merge them into the shell.

### P2-4: Remove unexplained GitHub route
- **Problem:** `/github` or similar route exists with no PRD justification
- **Fix:** Delete the route and its components. If needed later, re-add with documentation.

### P2-5: Strip DaisyUI CSS
- **Problem:** DaisyUI vendor CSS files are bundled, adding unnecessary weight
- **Fix:** Remove DaisyUI dependency and CSS imports. Use Tailwind utilities directly.

### P2-6: Fix totalORELocked label
- **Problem:** Field may be mislabeled in the UI
- **Fix:** Verify the API field name and ensure the display label matches what the value actually represents.

---

## P3 — Nice-to-Have Enhancements

### P3-1: Chart polish
- Add axis labels to Block Performance bar chart (x = block range, y = count or value)
- Add hover tooltips to Winner Types pie chart (show percentage + count)
- Add total rounds count to Motherlode line chart header/subtitle
- Style chart tooltips to match rore.supply theme

### P3-2: Responsive behavior
- Test all three charts at mobile breakpoints
- Ensure `ResponsiveContainer` or Chart.js `responsive: true` is set
- Pie chart should stack to full-width on small screens

---

## Tech Stack Summary

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | Next.js / React | Already in place, keep |
| Charts | `react-chartjs-2` + `chart.js` | Replace all custom SVG/HTML charts |
| Zoom | `chartjs-plugin-zoom` | Mouse wheel + pinch + pan |
| Styling | Tailwind CSS | Remove DaisyUI, use direct utilities |
| Data | `getDbStatsData()` from `lib/db-stats.ts` | Supabase-backed, full history |
| Colors | **TBD** — from rore.supply | Will be provided separately |

---

## Execution Order

```
P0-1 (wire DB data) → P0-2 (uncap history) → P0-3 (scope winner types)
  ↓
P1-1 (install react-chartjs-2, replace charts) → P1-2 (add zoom)
  ↓
P1-4 (fix layout) → P2-1 (remove legacy brand text)
  ↓
P2-2 through P2-6 (cleanup)
  ↓
P1-3 (theme colors — when provided)
  ↓
P3 (polish)
```

**Note:** P1-3 (colors) is blocked until hex values are extracted from rore.supply. Everything else can proceed immediately.
