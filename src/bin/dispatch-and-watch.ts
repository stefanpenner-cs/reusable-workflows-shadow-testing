import { requireEnv } from '../core/requireEnv.ts';
import { shadowBranchName } from '../core/shadowBranchName.ts';
import type { ShadowContext } from '../core/dispatch.ts';
import * as github from '../adapters/github.ts';

/**
 * Provider entrypoint (runs in P on a labeled pull_request, one invocation per consumer). Dispatches
 * the harness receiver, captures its run id natively, watches it to completion, and reflects the
 * result back as a sticky comment. The job's own exit status becomes the PR's status check.
 */
async function main(): Promise<void> {
  const harnessRepo = requireEnv('HARNESS_REPO');
  const harnessRef = process.env.HARNESS_REF || 'main';
  const providerRepo = requireEnv('PROVIDER_REPO');
  const providerRef = requireEnv('PROVIDER_REF');
  const providerPr = Number(requireEnv('PROVIDER_PR'));
  const consumerRepo = requireEnv('CONSUMER_REPO');
  const consumerRef = requireEnv('CONSUMER_REF');
  const token = requireEnv('SHADOW_PAT');

  const branch = shadowBranchName({ prNumber: providerPr, consumerRepo });
  const ctx: ShadowContext = { providerRepo, providerRef, consumerRepo, consumerRef, providerPr, branch };
  const marker = `<!-- shadow:${consumerRepo} -->`;

  const runId = await github.dispatchReceiver({ harnessRepo, harnessRef, ctx, token });
  const runUrl = `https://github.com/${harnessRepo}/actions/runs/${runId}`;
  console.log(`dispatched receiver run: ${runUrl}`);

  const link = async (state: string): Promise<string> => {
    const prUrl = await github.findPrUrl({ repo: harnessRepo, branch, token });
    return `${state} for \`${consumerRepo}\` — [run](${runUrl})${prUrl ? ` · [shadow PR](${prUrl})` : ''}`;
  };

  await github.upsertStickyComment({
    repo: providerRepo,
    pr: providerPr,
    marker,
    body: `🛰️ ${await link('**Shadow test running**')}`,
    token,
  });

  try {
    await github.watchRun({ harnessRepo, runId, token });
  } catch (error) {
    await github.upsertStickyComment({
      repo: providerRepo,
      pr: providerPr,
      marker,
      body: `❌ ${await link('**Shadow test FAILED**')}`,
      token,
    });
    throw error;
  }

  await github.upsertStickyComment({
    repo: providerRepo,
    pr: providerPr,
    marker,
    body: `✅ ${await link('**Shadow test passed**')}`,
    token,
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
