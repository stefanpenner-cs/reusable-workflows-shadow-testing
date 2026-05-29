import { readFileSync } from 'node:fs';
import { requireEnv } from '../core/requireEnv.ts';
import { parseConsumers } from '../core/parseConsumers.ts';
import { shadowBranchName } from '../core/shadowBranchName.ts';
import * as github from '../adapters/github.ts';

/** Provider entrypoint (runs on pull_request: closed). Tears down every consumer's shadow PR +
 * branch in the harness for this provider PR. */
async function main(): Promise<void> {
  const harnessRepo = requireEnv('HARNESS_REPO');
  const providerPr = Number(requireEnv('PROVIDER_PR'));
  const token = requireEnv('SHADOW_PAT');
  const consumers = parseConsumers(readFileSync(requireEnv('CONSUMERS_FILE'), 'utf8'));

  for (const { repo } of consumers) {
    const branch = shadowBranchName({ prNumber: providerPr, consumerRepo: repo });
    await github.closePrAndDeleteBranch({ repo: harnessRepo, branch, token });
    console.log(`cleaned up ${harnessRepo}:${branch}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
