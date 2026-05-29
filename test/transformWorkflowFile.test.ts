import { describe, it, expect } from 'vitest';
import { parse } from 'yaml';
import { transformWorkflowFile } from '../src/core/transformWorkflowFile.ts';

const SHA = '0123456789abcdef0123456789abcdef01234567';
const opts = { providerRepo: 'stefanpenner/shared-workflow-test', providerRef: SHA };

// The real consumer ci.yaml as it exists today (with the .yml typo and no pull_request trigger).
const CONSUMER = [
  'name: Use Shared Workflow',
  'on:',
  '  push:',
  '    branches: [main]',
  '  workflow_dispatch:',
  'jobs:',
  '  ci:',
  '    uses: stefanpenner/shared-workflow-test/.github/workflows/shared.yml@main',
  '',
].join('\n');

describe('transformWorkflowFile', () => {
  it('applies both the provider repoint and the pull_request trigger in one pass', () => {
    const out = parse(transformWorkflowFile(CONSUMER, opts));
    expect(out.jobs.ci.uses).toBe(
      `stefanpenner/shared-workflow-test/.github/workflows/shared.yaml@${SHA}`,
    );
    expect(out.jobs.ci.with.ref).toBe(SHA);
    expect(out.on).toHaveProperty('pull_request');
    expect(out.on).toHaveProperty('push');
  });

  it('is idempotent', () => {
    const once = transformWorkflowFile(CONSUMER, opts);
    expect(transformWorkflowFile(once, opts)).toBe(once);
  });
});
