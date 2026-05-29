import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { workflowReferencesProvider } from '../src/core/patchConsumerWorkflow.ts';

const PROVIDER = 'stefanpenner-cs/reusable-workflows';

describe('workflowReferencesProvider', () => {
  it('is true when a job calls the provider as a reusable workflow', () => {
    const yaml = [
      'jobs:',
      '  ci:',
      '    uses: stefanpenner-cs/reusable-workflows/.github/workflows/shared.yaml@main',
    ].join('\n');
    assert.equal(workflowReferencesProvider(yaml, PROVIDER), true);
  });

  it('is false when no job calls the provider', () => {
    const yaml = [
      'jobs:',
      '  build:',
      '    runs-on: ubuntu-latest',
      '    steps:',
      '      - uses: actions/checkout@v4',
    ].join('\n');
    assert.equal(workflowReferencesProvider(yaml, PROVIDER), false);
  });

  it('is false for a different provider', () => {
    const yaml = ['jobs:', '  ci:', '    uses: someorg/other/.github/workflows/x.yaml@main'].join('\n');
    assert.equal(workflowReferencesProvider(yaml, PROVIDER), false);
  });
});
