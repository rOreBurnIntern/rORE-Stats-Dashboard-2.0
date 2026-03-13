import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';

const LEGACY_NAME = 'Burn' + 'coin';
const EXCLUDED_GREP_PATHS = ['PRD-p1-3-burncoin-text.md'] as const;
const ALLOWED_NON_UI_GREP_MATCHES = new Set<string>();
const RENAMED_TEXT_FILES = ['app/page.tsx', 'components/MotherlodeChart.tsx', 'components/RoundTable.tsx', 'app/api/_lib/dashboardTransforms.ts'] as const;
const runCommand = promisify(execFile);

async function readProjectFile(relativePath: string) {
  return readFile(path.join(process.cwd(), relativePath), 'utf8');
}

test('repo grep only returns allowed non-UI legacy branding references', async () => {
  const grepArgs = [
    '-R',
    '-n',
    '--exclude-dir=.git',
    ...EXCLUDED_GREP_PATHS.map((relativePath) => `--exclude=${relativePath}`),
    LEGACY_NAME,
    '.',
  ];

  try {
    const { stdout } = await runCommand('grep', grepArgs, { cwd: process.cwd() });
    const matches = stdout
      .trim()
      .split('\n')
      .filter(Boolean);
    const unexpectedMatches = matches.filter((match) => !ALLOWED_NON_UI_GREP_MATCHES.has(match));

    assert.deepEqual(unexpectedMatches, []);
  } catch (error) {
    const grepError = error as { code?: number; stdout?: string };

    if (grepError.code === 1 && !grepError.stdout) {
      return;
    }

    throw error;
  }
});

test('renamed product surfaces use rORE labels', async () => {
  const expectedText = new Map<string, string[]>([
    ['app/page.tsx', ['rORE Stats Dashboard', 'rORE Price', 'toLocaleString()} rORE']],
    ['components/MotherlodeChart.tsx', ['Motherlode rORE', 'toLocaleString()} rORE']],
    ['components/RoundTable.tsx', ["'rORE'"]],
    ['app/api/_lib/dashboardTransforms.ts', ["currency: 'rORE'"]],
  ]);

  for (const [relativePath, snippets] of expectedText) {
    const content = await readProjectFile(relativePath);

    for (const snippet of snippets) {
      assert.equal(content.includes(snippet), true, `${relativePath} is missing "${snippet}"`);
    }
  }
});
