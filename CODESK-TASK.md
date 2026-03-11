# Task: Supabase Schema and Migrations for rORE Stats 2.0

## Context
Building rORE Stats Dashboard 2.0 (Next.js + Supabase). Need database layer to store:
- Historical rounds data (31k+ rounds)
- Price history (rORE/WETH over time)
- Sync metadata (last fetch timestamps, cursor positions)

## Required Deliverables

### 1. Database Schema (SQL)
Create migrations in `supabase/migrations/` with timestamps.

**Tables:**

#### `rounds`
```sql
CREATE TABLE rounds (
  id BIGSERIAL PRIMARY KEY,
  round_number INTEGER NOT NULL UNIQUE,
  prize NUMERIC(20, 8),  -- rORE prize amount
  entries INTEGER,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  status VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_rounds_number ON rounds(round_number);
CREATE INDEX idx_rounds_end_time ON rounds(end_time);
CREATE INDEX idx_rounds_status ON rounds(status);
```

#### `price_history`
```sql
CREATE TABLE price_history (
  id BIGSERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL,
  ore_price_usd NUMERIC(20, 8) NOT NULL,
  weth_price_usd NUMERIC(20, 8) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_price_history_timestamp ON price_history(timestamp);
```

#### `sync_metadata`
```sql
CREATE TABLE sync_metadata (
  id VARCHAR(100) PRIMARY KEY,  -- e.g., 'rounds', 'prices'
  last_synced_at TIMESTAMPTZ NOT NULL,
  last_round_number INTEGER,
  next_cursor TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. Row-Level Security (RLS)
Enable RLS on all tables and create policies allowing:
- Service role full access (for sync jobs)
- Public read-only access (for frontend API routes)
  - `SELECT` on `rounds` (limit 1000 per query for safety)
  - `SELECT` on `price_history` (limit 1000)

### 3. Helper Functions/Views
Create a view for latest stats:
```sql
CREATE VIEW latest_stats AS
SELECT
  (SELECT ore_price_usd FROM price_history ORDER BY timestamp DESC LIMIT 1) AS ore_price_usd,
  (SELECT weth_price_usd FROM price_history ORDER BY timestamp DESC LIMIT 1) AS weth_price_usd,
  (SELECT * FROM rounds ORDER BY round_number DESC LIMIT 1) AS current_round,
  (SELECT protocol_stats->>'motherlode' FROM protocol_stats ORDER BY timestamp DESC LIMIT 1) AS motherlode_ore;
```

### 4. Migration Scripts
- `supabase/migrations/001_initial_schema.sql`
- Include comments and proper transaction handling

### 5. TypeScript Types
- `types/supabase.ts` with database table types
- Use `import { Database } from '@supabase/supabase-js'` pattern

### 6. Sync Job Boilerplate
Create `scripts/sync-rounds.ts` skeleton that:
- Reads sync_metadata to get last_round_number
- Fetches from `https://api.rore.supply/api/explore` (roundsData)
- Upserts rounds in batches
- Updates sync_metadata

Create `scripts/sync-prices.ts` skeleton that:
- Fetches from `https://api.rore.supply/api/prices`
- Inserts into price_history
- No metadata needed (just append)

### 7. README
`supabase/README.md` with:
- How to run migrations locally
- How to get Supabase credentials
- How to connect from Next.js app
- Example queries

## Rules
- Use `@supabase/postgrest-js` types
- All numeric fields use NUMERIC for precision
- Timestamps use TIMESTAMPTZ
- Include proper indexes for query performance
- Write idempotent migrations (use CREATE IF NOT EXISTS)
- Add comments explaining non-obvious decisions

## Output Structure
```
supabase/
  migrations/
    001_initial_schema.sql
  README.md
types/
  supabase.ts
scripts/
  sync-rounds.ts
  sync-prices.ts
```

Start with the SQL schema file, then types, then scripts, then README.