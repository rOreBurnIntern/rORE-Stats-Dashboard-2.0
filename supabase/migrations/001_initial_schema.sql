-- rORE Stats Dashboard — Supabase Schema
-- Based on PRD: tables rounds, prices, protocol_stats, sync_log

BEGIN;

-- Drop existing tables if they exist (safe re-run)
DROP TABLE IF EXISTS sync_log CASCADE;
DROP TABLE IF EXISTS protocol_stats CASCADE;
DROP TABLE IF EXISTS prices CASCADE;
DROP TABLE IF EXISTS rounds CASCADE;

-- Table: rounds
CREATE TABLE rounds (
  round_id INTEGER PRIMARY KEY,
  block_number SMALLINT,
  winner_take_all BOOLEAN NOT NULL,
  winner_address TEXT,
  winners SMALLINT NOT NULL,
  deployed NUMERIC(20, 8) NOT NULL,
  vaulted NUMERIC(20, 8) NOT NULL,
  winnings NUMERIC(20, 8) NOT NULL,
  motherlode_hit BOOLEAN NOT NULL DEFAULT FALSE,
  motherlode_value NUMERIC(20, 4),
  motherlode_running NUMERIC(20, 4) NOT NULL,
  end_timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rounds_end_timestamp ON rounds (end_timestamp DESC);
CREATE INDEX idx_rounds_block_number ON rounds (block_number) WHERE block_number IS NOT NULL;
CREATE INDEX idx_rounds_motherlode_hit ON rounds (round_id) WHERE motherlode_hit = TRUE;

-- Table: prices
CREATE TABLE prices (
  id SERIAL PRIMARY KEY,
  weth_usd NUMERIC(12, 4) NOT NULL,
  ore_usd NUMERIC(16, 10) NOT NULL,
  api_timestamp TIMESTAMPTZ NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_prices_fetched_at ON prices (fetched_at DESC);

-- Table: protocol_stats
CREATE TABLE protocol_stats (
  id SERIAL PRIMARY KEY,
  max_supply NUMERIC(30, 8) NOT NULL,
  circulating_supply NUMERIC(30, 8) NOT NULL,
  buried_ore NUMERIC(30, 8) NOT NULL,
  protocol_revenue NUMERIC(30, 8) NOT NULL,
  volume_weth NUMERIC(30, 8) NOT NULL,
  motherlode NUMERIC(20, 4) NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_protocol_stats_fetched_at ON protocol_stats (fetched_at DESC);

-- Table: sync_log
CREATE TABLE sync_log (
  id SERIAL PRIMARY KEY,
  job_type TEXT NOT NULL,
  status TEXT NOT NULL,
  rounds_synced INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL,
  finished_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row-Level Security
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocol_stats ENABLE ROW LEVEL SECURITY;
-- sync_log: no public access

-- Policies: anon can read rounds, prices, protocol_stats
CREATE POLICY "rounds_read" ON rounds FOR SELECT TO anon USING (true);
CREATE POLICY "prices_read" ON prices FOR SELECT TO anon USING (true);
CREATE POLICY "protocol_stats_read" ON protocol_stats FOR SELECT TO anon USING (true);

-- service_role bypasses RLS automatically; no policies needed

COMMIT;
