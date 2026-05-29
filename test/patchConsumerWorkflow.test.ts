import { describe, it, expect } from 'vitest';
import { parse } from 'yaml';
import { patchConsumerWorkflow } from '../src/core/patchConsumerWorkflow.ts';

const PROVIDER = 'stefanpenner/shared-workflow-test';
const SHA = '0123456789abcdef0123456789abcdef01234567';
const opts = { providerRepo: PROVIDER, providerRef: SHA };

describe('patchConsumerWorkflow', () => {
  it('repoints the provider ref to the SHA and injects with.ref when no with: block exists', () => {
    const input = [
      'name: Use Shared Workflow',
      'on: { push: { branches: [main] } }',
      'jobs:',
      '  ci:',
      '    uses: stefanpenner/shared-workflow-test/.github/workflows/shared.yaml@main',
    ].join('\n');

    const out = parse(patchConsumerWorkflow(input, opts));
    expect(out.jobs.ci.uses).toBe(
      `stefanpenner/shared-workflow-test/.github/workflows/shared.yaml@${SHA}`,
    );
    expect(out.jobs.ci.with.ref).toBe(SHA);
  });

  it('fixes the shared.yml -> shared.yaml filename typo', () => {
    const input = [
      'jobs:',
      '  ci:',
      '    uses: stefanpenner/shared-workflow-test/.github/workflows/shared.yml@main',
    ].join('\n');

    const out = parse(patchConsumerWorkflow(input, opts));
    expect(out.jobs.ci.uses).toBe(
      `stefanpenner/shared-workflow-test/.github/workflows/shared.yaml@${SHA}`,
    );
  });

  it('preserves an existing with: block and merges ref into it', () => {
    const input = [
      'jobs:',
      '  ci:',
      '    uses: stefanpenner/shared-workflow-test/.github/workflows/shared.yaml@main',
      '    with:',
      '      project-name: my-app',
    ].join('\n');

    const out = parse(patchConsumerWorkflow(input, opts));
    expect(out.jobs.ci.with).toEqual({ 'project-name': 'my-app', ref: SHA });
  });

  it('overwrites an existing with.ref', () => {
    const input = [
      'jobs:',
      '  ci:',
      '    uses: stefanpenner/shared-workflow-test/.github/workflows/shared.yaml@v1',
      '    with: { ref: v1 }',
    ].join('\n');

    const out = parse(patchConsumerWorkflow(input, opts));
    expect(out.jobs.ci.with.ref).toBe(SHA);
  });

  it('leaves a non-provider reusable-workflow uses untouched', () => {
    const input = [
      'jobs:',
      '  other:',
      '    uses: someorg/other-repo/.github/workflows/build.yaml@main',
    ].join('\n');

    const out = parse(patchConsumerWorkflow(input, opts));
    expect(out.jobs.other.uses).toBe('someorg/other-repo/.github/workflows/build.yaml@main');
    expect(out.jobs.other.with).toBeUndefined();
  });

  it('leaves step-level action uses untouched (only job-level reusable-workflow uses are patched)', () => {
    const input = [
      'jobs:',
      '  build:',
      '    runs-on: ubuntu-latest',
      '    steps:',
      '      - uses: actions/checkout@v4',
      '      - uses: stefanpenner/shared-workflow-test/actions/setup@main',
    ].join('\n');

    const out = parse(patchConsumerWorkflow(input, opts));
    expect(out.jobs.build.steps[0].uses).toBe('actions/checkout@v4');
    expect(out.jobs.build.steps[1].uses).toBe(
      'stefanpenner/shared-workflow-test/actions/setup@main',
    );
  });

  it('patches every job that references the provider', () => {
    const input = [
      'jobs:',
      '  a:',
      '    uses: stefanpenner/shared-workflow-test/.github/workflows/shared.yaml@main',
      '  b:',
      '    uses: stefanpenner/shared-workflow-test/.github/workflows/shared.yml@main',
    ].join('\n');

    const out = parse(patchConsumerWorkflow(input, opts));
    expect(out.jobs.a.uses.endsWith(`@${SHA}`)).toBe(true);
    expect(out.jobs.b.uses).toBe(
      `stefanpenner/shared-workflow-test/.github/workflows/shared.yaml@${SHA}`,
    );
    expect(out.jobs.a.with.ref).toBe(SHA);
    expect(out.jobs.b.with.ref).toBe(SHA);
  });

  it('is idempotent', () => {
    const input = [
      'jobs:',
      '  ci:',
      '    uses: stefanpenner/shared-workflow-test/.github/workflows/shared.yml@main',
      '    with: { project-name: my-app }',
    ].join('\n');

    const once = patchConsumerWorkflow(input, opts);
    const twice = patchConsumerWorkflow(once, opts);
    expect(twice).toBe(once);
  });

  it('preserves comments and surrounding formatting', () => {
    const input = [
      '# top-level comment',
      'name: Use Shared Workflow',
      'jobs:',
      '  ci:',
      '    # call the shared workflow',
      '    uses: stefanpenner/shared-workflow-test/.github/workflows/shared.yaml@main',
    ].join('\n');

    const out = patchConsumerWorkflow(input, opts);
    expect(out).toContain('# top-level comment');
    expect(out).toContain('# call the shared workflow');
  });
});
