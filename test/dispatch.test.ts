import { describe, it, expect } from 'vitest';
import { buildDispatchInputs, extractRunId } from '../src/core/dispatch.ts';

describe('buildDispatchInputs', () => {
  it('maps the shadow context to the receiver workflow_dispatch inputs (all strings)', () => {
    expect(
      buildDispatchInputs({
        providerRepo: 'stefanpenner/shared-workflow-test',
        providerRef: 'deadbeef',
        consumerRepo: 'o/r',
        consumerRef: 'main',
        providerPr: 7,
        branch: 'shadow/pr-7-o-r',
      }),
    ).toEqual({
      provider_repo: 'stefanpenner/shared-workflow-test',
      provider_ref: 'deadbeef',
      consumer_repo: 'o/r',
      consumer_ref: 'main',
      provider_pr: '7',
      branch: 'shadow/pr-7-o-r',
    });
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
    expect(extractRunId(response)).toBe(1234567890);
  });

  it('throws when no run id is present', () => {
    expect(() => extractRunId({})).toThrow();
  });

  it('throws when workflow_run_id is not a number', () => {
    expect(() => extractRunId({ workflow_run_id: 'nope' })).toThrow();
  });
});
