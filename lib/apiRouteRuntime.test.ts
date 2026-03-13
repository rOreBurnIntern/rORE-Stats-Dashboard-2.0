import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

async function readProjectFile(relativePath: string) {
  return readFile(path.join(process.cwd(), relativePath), 'utf8');
}

test('database-backed API routes opt out of static build execution', async () => {
  for (const relativePath of ['app/api/latest-round/route.ts', 'app/api/stats/route.ts']) {
    const content = await readProjectFile(relativePath);

    assert.equal(
      content.includes("export const dynamic = 'force-dynamic';"),
      true,
      `${relativePath} must force dynamic execution to avoid build-time data collection`,
    );
  }
});

test('Supabase-backed GET routes load the admin client lazily inside the handler', async () => {
  for (const relativePath of [
    'app/api/latest-round/route.ts',
    'app/api/prices/route.ts',
    'app/api/rounds/route.ts',
    'app/api/rounds/daily/route.ts',
    'app/api/sync/prices/route.ts',
    'app/api/sync/rounds/route.ts',
  ]) {
    const content = await readProjectFile(relativePath);

    assert.equal(
      content.includes("const { supabaseAdmin } = await import('@/lib/supabaseAdmin');"),
      true,
      `${relativePath} must lazy-load the Supabase admin client`,
    );
    assert.equal(content.includes("import { supabaseAdmin } from '@/lib/supabaseAdmin';"), false);
  }
});
