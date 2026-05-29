import { parseDocument, isMap } from 'yaml';

export interface PatchOptions {
  /** `owner/repo` of the reusable-workflows provider whose refs should be repointed. */
  providerRepo: string;
  /** The git ref (typically the PR head SHA) to pin the provider to. */
  providerRef: string;
}

/** A job-level reusable-workflow `uses:` — `owner/repo/.github/workflows/<file>@<ref>`. */
const REUSABLE_USES = /^(?<repo>[^/]+\/[^/]+)\/(?<path>\.github\/workflows\/[^@]+)@.+$/;

/**
 * Repoint a consumer's reusable-workflow call at a specific provider ref so the consumer's CI
 * exercises the provider's draft state. Pure: takes YAML in, returns YAML out, preserving comments
 * and formatting. Only job-level `uses:` targeting `providerRepo` are touched; step-level action
 * `uses:` and other repos' workflows are left alone. Idempotent.
 */
export function patchConsumerWorkflow(yaml: string, opts: PatchOptions): string {
  const doc = parseDocument(yaml);
  const jobs = doc.get('jobs');
  if (!isMap(jobs)) return doc.toString();

  for (const { value: job } of jobs.items) {
    if (!isMap(job)) continue;

    const uses = job.get('uses');
    if (typeof uses !== 'string') continue;

    const groups = REUSABLE_USES.exec(uses)?.groups;
    if (!groups || groups.repo !== opts.providerRepo || groups.path === undefined) continue;

    const path = groups.path.replace(/\.yml$/, '.yaml');
    job.set('uses', `${opts.providerRepo}/${path}@${opts.providerRef}`);

    const withBlock = job.get('with', true);
    if (isMap(withBlock)) {
      withBlock.set('ref', opts.providerRef);
    } else {
      job.set('with', doc.createNode({ ref: opts.providerRef }));
    }
  }

  return doc.toString();
}
