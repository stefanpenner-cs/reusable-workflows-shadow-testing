import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildShadowDispatchArgs } from '../src/core/providerDispatch.ts';

describe('buildShadowDispatchArgs', () => {
  it('builds gh workflow run argv for the provider shadow flow', () => {
    assert.deepEqual(
      buildShadowDispatchArgs({
        providerRepo: 'o/provider',
        workflow: 'shadow.yaml',
        providerPr: '12',
        harnessRef: 'my-branch',
      }),
      ['workflow', 'run', 'shadow.yaml', '-R', 'o/provider', '-f', 'pr=12', '-f', 'harness_ref=my-branch'],
    );
  });
});
