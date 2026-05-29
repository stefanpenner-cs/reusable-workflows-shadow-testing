import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { capture, run } from '../src/adapters/exec.ts';

describe('exec', () => {
  it('capture returns stdout', async () => {
    assert.equal((await capture('printf', ['%s', 'hello'])).trim(), 'hello');
  });

  it('capture feeds input to stdin', async () => {
    assert.equal((await capture('cat', [], { input: 'piped' })).trim(), 'piped');
  });

  it('capture rejects (with stderr) on a non-zero exit', async () => {
    await assert.rejects(capture('sh', ['-c', 'echo boom >&2; exit 3']), /boom/);
  });

  it('run rejects on a non-zero exit', async () => {
    await assert.rejects(run('sh', ['-c', 'exit 1']));
  });

  it('run resolves on success', async () => {
    await run('true', []);
  });
});
