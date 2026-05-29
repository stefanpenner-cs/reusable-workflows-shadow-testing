import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parse } from 'yaml';
import { patchConsumerWorkflow } from '../src/core/patchConsumerWorkflow.ts';

const PROVIDER = 'stefanpenner-cs/reusable-workflows';
const SHA = '0123456789abcdef0123456789abcdef01234567';
const opts = { providerRepo: PROVIDER, providerRef: SHA };

describe('patchConsumerWorkflow', () => {
  it('repoints the provider ref to the SHA and injects with.ref when no with: block exists', () => {
    const input = [
      'name: Use Shared Workflow',
      'on: { push: { branches: [main] } }',
      'jobs:',
      '  ci:',
      '    uses: stefanpenner-cs/reusable-workflows/.github/workflows/shared.yaml@main',
    ].join('\n');

    const out = parse(patchConsumerWorkflow(input, opts));
    assert.equal(out.jobs.ci.uses, `${PROVIDER}/.github/workflows/shared.yaml@${SHA}`);
    assert.equal(out.jobs.ci.with.ref, SHA);
  });

  it('fixes the shared.yml -> shared.yaml filename typo', () => {
    const input = [
      'jobs:',
      '  ci:',
      '    uses: stefanpenner-cs/reusable-workflows/.github/workflows/shared.yml@main',
    ].join('\n');

    const out = parse(patchConsumerWorkflow(input, opts));
    assert.equal(out.jobs.ci.uses, `${PROVIDER}/.github/workflows/shared.yaml@${SHA}`);
  });

  it('preserves an existing with: block and merges ref into it', () => {
    const input = [
      'jobs:',
      '  ci:',
      '    uses: stefanpenner-cs/reusable-workflows/.github/workflows/shared.yaml@main',
      '    with:',
      '      project-name: my-app',
    ].join('\n');

    const out = parse(patchConsumerWorkflow(input, opts));
    assert.deepEqual(out.jobs.ci.with, { 'project-name': 'my-app', ref: SHA });
  });

  it('overwrites an existing with.ref', () => {
    const input = [
      'jobs:',
      '  ci:',
      '    uses: stefanpenner-cs/reusable-workflows/.github/workflows/shared.yaml@v1',
      '    with: { ref: v1 }',
    ].join('\n');

    const out = parse(patchConsumerWorkflow(input, opts));
    assert.equal(out.jobs.ci.with.ref, SHA);
  });

  it('leaves a non-provider reusable-workflow uses untouched', () => {
    const input = [
      'jobs:',
      '  other:',
      '    uses: someorg/other-repo/.github/workflows/build.yaml@main',
    ].join('\n');

    const out = parse(patchConsumerWorkflow(input, opts));
    assert.equal(out.jobs.other.uses, 'someorg/other-repo/.github/workflows/build.yaml@main');
    assert.equal(out.jobs.other.with, undefined);
  });

  it('leaves step-level action uses untouched (only job-level reusable-workflow uses are patched)', () => {
    const input = [
      'jobs:',
      '  build:',
      '    runs-on: ubuntu-latest',
      '    steps:',
      '      - uses: actions/checkout@v4',
      '      - uses: stefanpenner-cs/reusable-workflows/actions/setup@main',
    ].join('\n');

    const out = parse(patchConsumerWorkflow(input, opts));
    assert.equal(out.jobs.build.steps[0].uses, 'actions/checkout@v4');
    assert.equal(out.jobs.build.steps[1].uses, 'stefanpenner-cs/reusable-workflows/actions/setup@main');
  });

  it('patches every job that references the provider', () => {
    const input = [
      'jobs:',
      '  a:',
      '    uses: stefanpenner-cs/reusable-workflows/.github/workflows/shared.yaml@main',
      '  b:',
      '    uses: stefanpenner-cs/reusable-workflows/.github/workflows/shared.yml@main',
    ].join('\n');

    const out = parse(patchConsumerWorkflow(input, opts));
    assert.ok(out.jobs.a.uses.endsWith(`@${SHA}`));
    assert.equal(out.jobs.b.uses, `${PROVIDER}/.github/workflows/shared.yaml@${SHA}`);
    assert.equal(out.jobs.a.with.ref, SHA);
    assert.equal(out.jobs.b.with.ref, SHA);
  });

  it('is idempotent', () => {
    const input = [
      'jobs:',
      '  ci:',
      '    uses: stefanpenner-cs/reusable-workflows/.github/workflows/shared.yml@main',
      '    with: { project-name: my-app }',
    ].join('\n');

    const once = patchConsumerWorkflow(input, opts);
    assert.equal(patchConsumerWorkflow(once, opts), once);
  });

  it('preserves comments and surrounding formatting', () => {
    const input = [
      '# top-level comment',
      'name: Use Shared Workflow',
      'jobs:',
      '  ci:',
      '    # call the shared workflow',
      '    uses: stefanpenner-cs/reusable-workflows/.github/workflows/shared.yaml@main',
    ].join('\n');

    const out = patchConsumerWorkflow(input, opts);
    assert.ok(out.includes('# top-level comment'));
    assert.ok(out.includes('# call the shared workflow'));
  });
});
