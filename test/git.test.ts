import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { configureBotIdentity, commitAll, headSha } from '../src/adapters/git.ts';

async function repoWithCommit(content: string): Promise<{ dir: string; sha: string }> {
  const dir = mkdtempSync(join(tmpdir(), 'git-'));
  execFileSync('git', ['init', '-q', dir]);
  execFileSync('git', ['-C', dir, 'config', 'commit.gpgsign', 'false']);
  writeFileSync(join(dir, 'file.txt'), content);
  await configureBotIdentity(dir);
  await commitAll(dir, 'shadow: fixed message');
  return { dir, sha: await headSha(dir) };
}

describe('git adapter — reproducible commits (determinism)', () => {
  it('identical content + identity + message + dates -> identical SHA', async () => {
    const a = await repoWithCommit('same');
    const b = await repoWithCommit('same');
    try {
      assert.match(a.sha, /^[0-9a-f]{40}$/);
      assert.equal(a.sha, b.sha);
    } finally {
      rmSync(a.dir, { recursive: true, force: true });
      rmSync(b.dir, { recursive: true, force: true });
    }
  });

  it('different content -> different SHA', async () => {
    const a = await repoWithCommit('one');
    const b = await repoWithCommit('two');
    try {
      assert.notEqual(a.sha, b.sha);
    } finally {
      rmSync(a.dir, { recursive: true, force: true });
      rmSync(b.dir, { recursive: true, force: true });
    }
  });
});
