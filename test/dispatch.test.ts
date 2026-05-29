import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildDispatchInputs, extractRunId, classifyRunState } from '../src/core/dispatch.ts';

describe('buildDispatchInputs', () => {
  it('maps the shadow context to the receiver workflow_dispatch inputs (all strings)', () => {
    assert.deepEqual(
      buildDispatchInputs({
        providerRepo: 'stefanpenner-cs/reusable-workflows',
        providerRef: 'deadbeef',
        consumerRepo: 'o/r',
        consumerRef: 'main',
        providerPr: 7,
        branch: 'shadow/pr-7-o-r',
      }),
      {
        provider_repo: 'stefanpenner-cs/reusable-workflows',
        provider_ref: 'deadbeef',
        consumer_repo: 'o/r',
        consumer_ref: 'main',
        provider_pr: '7',
        branch: 'shadow/pr-7-o-r',
      },
    );
  });
});

describe('extractRunId', () => {
  // Captured shape of the return_run_details response (REST: workflow_run_id / run_url / html_url).
  const response = {
    workflow_run_id: 1234567890,
    run_url: 'https://api.github.com/repos/o/h/actions/runs/1234567890',
    html_url: 'https://github.com/o/h/actions/runs/1234567890',
  };

  it('reads workflow_run_id', () => {
    assert.equal(extractRunId(response), 1234567890);
  });

  it('throws when no run id is present', () => {
    assert.throws(() => extractRunId({}));
  });

  it('throws when workflow_run_id is not a number', () => {
    assert.throws(() => extractRunId({ workflow_run_id: 'nope' }));
  });
});

describe('classifyRunState', () => {
  it('is pending while not completed', () => {
    assert.equal(classifyRunState('queued', null), 'pending');
    assert.equal(classifyRunState('in_progress', null), 'pending');
  });

  it('is success only when completed + success', () => {
    assert.equal(classifyRunState('completed', 'success'), 'success');
  });

  it('is failure for any non-success conclusion', () => {
    assert.equal(classifyRunState('completed', 'failure'), 'failure');
    assert.equal(classifyRunState('completed', 'cancelled'), 'failure');
    assert.equal(classifyRunState('completed', null), 'failure');
  });
});
