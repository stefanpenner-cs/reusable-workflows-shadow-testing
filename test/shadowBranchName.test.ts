import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { shadowBranchName } from '../src/core/shadowBranchName.ts';

describe('shadowBranchName', () => {
  it('builds shadow/pr-<n>-<slug> from the consumer repo', () => {
    assert.equal(
      shadowBranchName({ prNumber: 7, consumerRepo: 'stefanpenner-cs/reusable-workflows-consumer' }),
      'shadow/pr-7-stefanpenner-cs-reusable-workflows-consumer',
    );
  });

  it('slugifies dots and the owner/name separator', () => {
    assert.equal(shadowBranchName({ prNumber: 1, consumerRepo: 'org/lcc.live' }), 'shadow/pr-1-org-lcc-live');
  });

  it('lowercases', () => {
    assert.equal(shadowBranchName({ prNumber: 2, consumerRepo: 'Org/MyRepo' }), 'shadow/pr-2-org-myrepo');
  });

  it('keeps the owner so same-named repos under different owners do not collide', () => {
    assert.notEqual(
      shadowBranchName({ prNumber: 1, consumerRepo: 'a/app' }),
      shadowBranchName({ prNumber: 1, consumerRepo: 'b/app' }),
    );
  });
});
