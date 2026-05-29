/**
 * Build the `gh workflow run` argv that triggers the provider's shadow flow against a given
 * harness ref — used to dogfood harness changes from this repo's CI. Pure: returns the argv,
 * runs nothing. (`workflow_dispatch` accepts a branch/tag for harnessRef, not a SHA.)
 */
export function buildShadowDispatchArgs(opts: {
  providerRepo: string;
  workflow: string;
  providerPr: string;
  harnessRef: string;
}): string[] {
  return [
    'workflow',
    'run',
    opts.workflow,
    '-R',
    opts.providerRepo,
    '-f',
    `pr=${opts.providerPr}`,
    '-f',
    `harness_ref=${opts.harnessRef}`,
  ];
}
