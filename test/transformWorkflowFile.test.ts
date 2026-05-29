import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parse } from 'yaml';
import { transformWorkflowFile } from '../src/core/transformWorkflowFile.ts';

const SHA = '0123456789abcdef0123456789abcdef01234567';
const opts = { providerRepo: 'stefanpenner-cs/reusable-workflows', providerRef: SHA };

// The real consumer ci.yaml shape (with a .yml typo and no pull_request trigger).
const CONSUMER = [
  'name: CI',
  'on:',
  '  push:',
  '    branches: [main]',
  '  workflow_dispatch:',
  'jobs:',
  '  ci:',
  '    uses: stefanpenner-cs/reusable-workflows/.github/workflows/shared.yml@main',
  '',
].join('\n');

describe('transformWorkflowFile', () => {
  it('applies both the provider repoint and the pull_request trigger in one pass', () => {
    const out = parse(transformWorkflowFile(CONSUMER, opts));
    assert.equal(out.jobs.ci.uses, `stefanpenner-cs/reusable-workflows/.github/workflows/shared.yaml@${SHA}`);
    assert.equal(out.jobs.ci.with.ref, SHA);
    assert.ok('pull_request' in out.on);
    assert.ok('push' in out.on);
  });

  it('is idempotent', () => {
    const once = transformWorkflowFile(CONSUMER, opts);
    assert.equal(transformWorkflowFile(once, opts), once);
  });
});
