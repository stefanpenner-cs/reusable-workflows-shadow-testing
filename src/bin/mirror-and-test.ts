import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { requireEnv } from '../core/requireEnv.ts';
import { mirrorTree } from '../core/mirrorTree.ts';
import { patchWorkflowsInDir } from '../adapters/workflows.ts';
import * as git from '../adapters/git.ts';
import * as github from '../adapters/github.ts';

/**
 * Receiver entrypoint (runs in H on workflow_dispatch). Mirrors the consumer's code onto a shadow
 * branch with its workflows repointed at the provider PR SHA, opens/refreshes a real PR, and blocks
 * on that PR's checks — so this run's exit status IS the shadow-test result the provider watches.
 */
async function main(): Promise<void> {
  const providerRepo = requireEnv('PROVIDER_REPO');
  const providerRef = requireEnv('PROVIDER_REF');
  const consumerRepo = requireEnv('CONSUMER_REPO');
  const consumerRef = requireEnv('CONSUMER_REF');
  const providerPr = requireEnv('PROVIDER_PR');
  const branch = requireEnv('BRANCH');
  const token = requireEnv('SHADOW_PAT');
  const harnessRepo = requireEnv('GITHUB_REPOSITORY');

  const work = mkdtempSync(join(tmpdir(), 'shadow-'));
  const mirrorDir = join(work, 'consumer');
  const shadowDir = join(work, 'harness');

  // Clone the consumer's files, and a clean copy of the harness to build the branch in (a fresh
  // clone avoids leaking the harness's node_modules into the shadow commit).
  await git.cloneShallow({ repo: consumerRepo, ref: consumerRef, dir: mirrorDir, token });
  await git.cloneShallow({ repo: harnessRepo, ref: 'main', dir: shadowDir, token });

  await git.configureBotIdentity(shadowDir);
  await git.resetBranchToEmptyTree(shadowDir, branch);
  mirrorTree(mirrorDir, shadowDir);

  const patched = patchWorkflowsInDir(shadowDir, { providerRepo, providerRef });
  console.log(`patched workflows: ${patched.join(', ') || '(none — consumer has no workflows?)'}`);

  await git.commitAll(
    shadowDir,
    `shadow: ${consumerRepo}@${consumerRef} vs ${providerRepo}@${providerRef} (provider PR #${providerPr})`,
  );
  await git.forcePush(shadowDir, branch);

  const prUrl = await github.ensurePr({
    repo: harnessRepo,
    branch,
    base: 'main',
    title: `Shadow: ${consumerRepo} vs ${providerRepo}#${providerPr}`,
    body: [
      'Automated shadow test — **do not merge**.',
      '',
      `- Consumer: \`${consumerRepo}@${consumerRef}\``,
      `- Provider draft: \`${providerRepo}@${providerRef}\``,
      `- Provider PR: ${providerRepo}#${providerPr}`,
      '',
      "This PR exists only to run the consumer's CI under a real `pull_request` event.",
    ].join('\n'),
    token,
  });
  console.log(`shadow PR: ${prUrl}`);

  await github.watchPrChecks({ repo: harnessRepo, branch, token });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
