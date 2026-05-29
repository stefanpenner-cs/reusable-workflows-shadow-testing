import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parse } from 'yaml';
import { patchWorkflowsInDir } from '../src/adapters/workflows.ts';

const SHA = '0123456789abcdef0123456789abcdef01234567';
const opts = { providerRepo: 'stefanpenner-cs/reusable-workflows', providerRef: SHA };

let dir: string;
let wf: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'pwd-'));
  wf = join(dir, '.github', 'workflows');
  mkdirSync(wf, { recursive: true });
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

const write = (name: string, lines: string[]) => writeFileSync(join(wf, name), lines.join('\n'));
const read = (name: string) => parse(readFileSync(join(wf, name), 'utf8'));

describe('patchWorkflowsInDir', () => {
  it('repoints + adds a pull_request trigger to a provider-calling workflow', () => {
    write('ci.yaml', [
      'on: { push: { branches: [main] } }',
      'jobs:',
      '  ci:',
      '    uses: stefanpenner-cs/reusable-workflows/.github/workflows/shared.yaml@main',
    ]);

    const changed = patchWorkflowsInDir(dir, opts);

    assert.deepEqual(changed, ['ci.yaml']);
    const out = read('ci.yaml');
    assert.equal(out.jobs.ci.uses, `stefanpenner-cs/reusable-workflows/.github/workflows/shared.yaml@${SHA}`);
    assert.equal(out.jobs.ci.with.ref, SHA);
    assert.ok('pull_request' in out.on);
  });

  it('LEAVES UNRELATED workflows untouched — no force-triggering a consumer deploy on the shadow PR', () => {
    const deploy = ['on: { push: { tags: ["v*"] } }', 'jobs:', '  deploy:', '    runs-on: ubuntu-latest'];
    write('deploy.yaml', deploy);

    const changed = patchWorkflowsInDir(dir, opts);

    assert.deepEqual(changed, []);
    assert.ok(!('pull_request' in read('deploy.yaml').on));
    assert.equal(readFileSync(join(wf, 'deploy.yaml'), 'utf8'), deploy.join('\n'));
  });

  it('ignores non-workflow files', () => {
    writeFileSync(join(wf, 'notes.txt'), 'hello');
    write('ci.yaml', ['jobs:', '  ci:', '    uses: stefanpenner-cs/reusable-workflows/.github/workflows/shared.yaml@main']);
    assert.deepEqual(patchWorkflowsInDir(dir, opts), ['ci.yaml']);
  });

  it('returns [] when there is no workflows directory', () => {
    const empty = mkdtempSync(join(tmpdir(), 'pwd-empty-'));
    try {
      assert.deepEqual(patchWorkflowsInDir(empty, opts), []);
    } finally {
      rmSync(empty, { recursive: true, force: true });
    }
  });
});
