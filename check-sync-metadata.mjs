import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false }
});

try {
  const { data, error } = await supabase.from('sync_metadata').select('*').limit(1);
  if (error) {
    console.log('Error message:', error.message);
    console.log('Error code:', error.code);
  } else {
    console.log('Data:', JSON.stringify(data, null, 2));
  }
} catch (e) {
  console.error('Exception:', e);
}
