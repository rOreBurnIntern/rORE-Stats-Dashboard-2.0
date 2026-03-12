-- Add motherlode_running column to rounds
-- This column stores the precomputed running motherlode value per round (counter × 0.2)

BEGIN;

-- Add the column (nullable initially for backfill)
ALTER TABLE rounds ADD COLUMN motherlode_running NUMERIC(20, 4);

-- We'll populate it in a separate step to ensure chronological ordering
-- After this migration, run the backfill script to compute values for existing rows
-- New rows inserted by the sync job will have this value computed automatically.

COMMIT;
