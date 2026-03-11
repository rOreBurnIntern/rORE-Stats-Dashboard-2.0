BEGIN;

-- Keep all application tables in public so PostgREST and the generated
-- Supabase client work without extra schema configuration.
CREATE SCHEMA IF NOT EXISTS public;

-- Shared trigger to maintain updated_at columns without relying on the app.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.rounds (
  id BIGSERIAL PRIMARY KEY,
  round_number INTEGER NOT NULL UNIQUE,
  prize NUMERIC(20, 8),
  entries INTEGER,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  status VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.price_history (
  id BIGSERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL,
  ore_price_usd NUMERIC(20, 8) NOT NULL,
  weth_price_usd NUMERIC(20, 8) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sync_metadata (
  id VARCHAR(100) PRIMARY KEY,
  last_synced_at TIMESTAMPTZ NOT NULL,
  last_round_number INTEGER,
  next_cursor TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- The requested latest_stats view depends on protocol_stats. This minimal table
-- keeps the migration self-contained and leaves room for richer stats later.
CREATE TABLE IF NOT EXISTS public.protocol_stats (
  id BIGSERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL,
  protocol_stats JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rounds_number ON public.rounds (round_number);
CREATE INDEX IF NOT EXISTS idx_rounds_end_time ON public.rounds (end_time);
CREATE INDEX IF NOT EXISTS idx_rounds_status ON public.rounds (status);
CREATE INDEX IF NOT EXISTS idx_price_history_timestamp ON public.price_history (timestamp);
CREATE INDEX IF NOT EXISTS idx_protocol_stats_timestamp ON public.protocol_stats (timestamp);

DROP TRIGGER IF EXISTS set_rounds_updated_at ON public.rounds;
CREATE TRIGGER set_rounds_updated_at
BEFORE UPDATE ON public.rounds
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_sync_metadata_updated_at ON public.sync_metadata;
CREATE TRIGGER set_sync_metadata_updated_at
BEFORE UPDATE ON public.sync_metadata
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_protocol_stats_updated_at ON public.protocol_stats;
CREATE TRIGGER set_protocol_stats_updated_at
BEFORE UPDATE ON public.protocol_stats
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.protocol_stats ENABLE ROW LEVEL SECURITY;

-- Supabase service_role bypasses RLS in practice, but explicit policies make the
-- intended access model visible in schema review and local development.
DROP POLICY IF EXISTS "service_role_full_access_rounds" ON public.rounds;
CREATE POLICY "service_role_full_access_rounds"
ON public.rounds
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_full_access_price_history" ON public.price_history;
CREATE POLICY "service_role_full_access_price_history"
ON public.price_history
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_full_access_sync_metadata" ON public.sync_metadata;
CREATE POLICY "service_role_full_access_sync_metadata"
ON public.sync_metadata
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_full_access_protocol_stats" ON public.protocol_stats;
CREATE POLICY "service_role_full_access_protocol_stats"
ON public.protocol_stats
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "public_read_rounds" ON public.rounds;
CREATE POLICY "public_read_rounds"
ON public.rounds
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "public_read_price_history" ON public.price_history;
CREATE POLICY "public_read_price_history"
ON public.price_history
FOR SELECT
TO anon, authenticated
USING (true);

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT ON public.rounds TO anon, authenticated;
GRANT SELECT ON public.price_history TO anon, authenticated;
GRANT ALL ON public.rounds TO service_role;
GRANT ALL ON public.price_history TO service_role;
GRANT ALL ON public.sync_metadata TO service_role;
GRANT ALL ON public.protocol_stats TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Note: PostgreSQL RLS cannot enforce a "1000 rows per query" limit. Configure
-- the Supabase API max rows setting to 1000 for anonymous traffic.
--
-- This view intentionally uses the default definer security so the frontend can
-- read the single latest motherlode value without broad access to protocol_stats.
CREATE OR REPLACE VIEW public.latest_stats AS
SELECT
  (
    SELECT ph.ore_price_usd
    FROM public.price_history ph
    ORDER BY ph.timestamp DESC
    LIMIT 1
  ) AS ore_price_usd,
  (
    SELECT ph.weth_price_usd
    FROM public.price_history ph
    ORDER BY ph.timestamp DESC
    LIMIT 1
  ) AS weth_price_usd,
  (
    SELECT to_jsonb(r)
    FROM (
      SELECT *
      FROM public.rounds
      ORDER BY round_number DESC
      LIMIT 1
    ) r
  ) AS current_round,
  (
    SELECT ps.protocol_stats ->> 'motherlode'
    FROM public.protocol_stats ps
    ORDER BY ps.timestamp DESC
    LIMIT 1
  ) AS motherlode_ore;

GRANT SELECT ON public.latest_stats TO anon, authenticated, service_role;

COMMENT ON TABLE public.rounds IS 'Historical rORE round snapshots keyed by round_number.';
COMMENT ON TABLE public.price_history IS 'Append-only USD price history for rORE and WETH.';
COMMENT ON TABLE public.sync_metadata IS 'Per-job cursors and timestamps for incremental sync jobs.';
COMMENT ON TABLE public.protocol_stats IS 'Minimal protocol stats store used by latest_stats; extend as needed.';
COMMENT ON VIEW public.latest_stats IS 'Convenience view for the latest prices, round snapshot, and motherlode stat.';

COMMIT;
