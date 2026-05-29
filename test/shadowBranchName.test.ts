import { describe, it, expect } from 'vitest';
import { shadowBranchName } from '../src/core/shadowBranchName.ts';

describe('shadowBranchName', () => {
  it('builds shadow/pr-<n>-<slug> from the consumer repo', () => {
    expect(
      shadowBranchName({ prNumber: 7, consumerRepo: 'stefanpenner/shared-workflow-consumer' }),
    ).toBe('shadow/pr-7-stefanpenner-shared-workflow-consumer');
  });

  it('slugifies dots and the owner/name separator', () => {
    expect(shadowBranchName({ prNumber: 1, consumerRepo: 'org/lcc.live' })).toBe(
      'shadow/pr-1-org-lcc-live',
    );
  });

  it('lowercases', () => {
    expect(shadowBranchName({ prNumber: 2, consumerRepo: 'Org/MyRepo' })).toBe(
      'shadow/pr-2-org-myrepo',
    );
  });

  it('keeps the owner so same-named repos under different owners do not collide', () => {
    expect(shadowBranchName({ prNumber: 1, consumerRepo: 'a/app' })).not.toBe(
      shadowBranchName({ prNumber: 1, consumerRepo: 'b/app' }),
    );
  });
});
