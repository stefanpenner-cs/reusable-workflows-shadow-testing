export interface ShadowBranchParams {
  prNumber: number;
  consumerRepo: string;
}

/**
 * Deterministic, collision-safe branch name for a shadow PR. Deterministic so the provider can find
 * the harness PR without discovery, and so re-runs reuse the same branch (force-push → synchronize).
 */
export function shadowBranchName({ prNumber, consumerRepo }: ShadowBranchParams): string {
  const slug = consumerRepo
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `shadow/pr-${prNumber}-${slug}`;
}
