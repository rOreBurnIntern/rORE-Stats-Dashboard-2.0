import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

async function listTables() {
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  // Try querying the _tables view (Postgrest system view)
  let tables;
  try {
    const result = await supabase.from('_tables').select('table_name').eq('table_schema', 'public').order('table_name');
    tables = result.data;
    if (result.error) throw result.error;
  } catch (err) {
    console.error('Error querying _tables:', err);
    tables = null;
  }

  if (tables) {
    console.log('Tables in public schema:');
    tables.forEach((t) => console.log(' -', t.table_name));
  } else {
    // Fallback: test known table names by attempting a SELECT 1
    const knownTables = ['rounds', 'prices', 'price_history', 'protocol_stats', 'sync_log', 'sync_metadata'];
    console.log('Testing known tables:');
    for (const t of knownTables) {
      try {
        const res = await supabase.from(t).select('*').limit(1);
        if (res.error) {
          console.log(`Table ${t}: ERROR - ${res.error.message}`);
        } else {
          console.log(`Table ${t}: EXISTS (rows: ${res.data ? res.data.length : 0})`);
        }
      } catch (e) {
        console.log(`Table ${t}: EXCEPTION - ${e.message}`);
      }
    }
  }
}

listTables().catch(console.error);
