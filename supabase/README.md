# Supabase Setup

This directory contains the initial PostgreSQL schema for rORE Stats 2.0 and the minimal sync-job contract the app expects.

## Files

- `migrations/001_initial_schema.sql`: bootstrap schema, indexes, triggers, RLS policies, and the `latest_stats` view.

## Run Migrations Locally

1. Install the Supabase CLI.
2. Initialize local infra if this repo has not been linked yet:

```bash
supabase init
```

3. Start the local Supabase stack:

```bash
supabase start
```

4. Apply the migration against the local database:

```bash
supabase db reset
```

If you are linking to an existing remote project instead of local Docker services, use:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

## Credentials

You need these values from the Supabase dashboard:

- `SUPABASE_URL`: `Settings -> API -> Project URL`
- `NEXT_PUBLIC_SUPABASE_URL`: same value as `SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `Settings -> API -> anon public`
- `SUPABASE_SERVICE_ROLE_KEY`: `Settings -> API -> service_role secret`
- Database password or connection string: `Settings -> Database`

Use the service role only for server-side sync jobs. The browser and public API routes should use the anon key.

## Next.js Connection

Create a shared client helper and pass the generated `Database` type as the generic:

```ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);
```

For server-side jobs and route handlers that write data:

```ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

export const admin = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);
```

## Query Examples

Latest round:

```ts
const { data, error } = await supabase
  .from('rounds')
  .select('*')
  .order('round_number', { ascending: false })
  .limit(1)
  .maybeSingle();
```

Recent price history:

```ts
const { data, error } = await supabase
  .from('price_history')
  .select('timestamp, ore_price_usd, weth_price_usd')
  .order('timestamp', { ascending: false })
  .limit(100);
```

Dashboard summary view:

```ts
const { data, error } = await supabase
  .from('latest_stats')
  .select('*')
  .maybeSingle();
```

Incremental sync metadata:

```ts
const { data, error } = await admin
  .from('sync_metadata')
  .select('*')
  .eq('id', 'rounds')
  .maybeSingle();
```

## Notes

- The migration creates a minimal `protocol_stats` table because the requested `latest_stats` view depends on it. Extend that table once the motherlode sync source is defined.
- PostgreSQL RLS cannot enforce a per-query row cap. To keep public reads capped at 1000 rows, set the Supabase API max rows setting to `1000` in the project settings or enforce `.limit(1000)` in your API routes.
- All monetary values use `NUMERIC(20, 8)` to avoid float drift in historical reporting.
