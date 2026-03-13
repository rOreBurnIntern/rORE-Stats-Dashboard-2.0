# P1-3 Legacy Text Cleanup Report

## Exact files changed
- `app/page.tsx`
- `components/MotherlodeChart.tsx`
- `components/RoundTable.tsx`
- `app/api/_lib/dashboardTransforms.ts`
- `app/api/_lib/dashboardTransforms.test.ts`
- `lib/legacyBranding.test.ts`
- `package.json`

## Remaining intentional references
- `PRD-p1-3-burncoin-text.md` keeps the legacy name because it is the task definition for this cleanup.
- `lib/legacyBranding.test.ts` builds the legacy name as `'Burn' + 'coin'` so the test can validate grep results without leaving a literal repo match.

## Verification
- Repo grep for the legacy product name returns no matches once the task PRD file is excluded.
- `npm test` passes.
- `npm run lint` passes.
- `npm run build` passes.
