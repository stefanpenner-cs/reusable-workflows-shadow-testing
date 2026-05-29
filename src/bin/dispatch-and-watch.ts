import { appendFileSync } from 'node:fs';
import { requireEnv } from '../core/requireEnv.ts';
import { shadowBranchName } from '../core/shadowBranchName.ts';
import { renderShadowSummary, type ShadowResult } from '../core/summary.ts';
import type { ShadowContext } from '../core/dispatch.ts';
import * as github from '../adapters/github.ts';

/** Append markdown to the GitHub job summary (the shadow check's page); also log it. */
function writeJobSummary(markdown: string): void {
  console.log(markdown);
  const file = process.env.GITHUB_STEP_SUMMARY;
  if (file) appendFileSync(file, markdown);
}

/**
 * Provider entrypoint (runs in P on a labeled pull_request, one invocation per consumer). Dispatches
 * the harness receiver, captures its run id natively, and watches it to completion. The job's exit
 * status is the PR's shadow check; the result + links are rendered into the job summary (the check's
 * markdown page) rather than a PR comment.
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

  const runId = await github.dispatchReceiver({ harnessRepo, harnessRef, ctx, token });
  const runUrl = `https://github.com/${harnessRepo}/actions/runs/${runId}`;
  console.log(`dispatched receiver run: ${runUrl}`);

  const summarize = async (result: ShadowResult): Promise<void> => {
    const prUrl = await github.findPrUrl({ repo: harnessRepo, branch, token });
    writeJobSummary(
      renderShadowSummary({ consumerRepo, consumerRef, providerRepo, providerRef, providerPr, result, runUrl, prUrl }),
    );
  };

  try {
    await github.watchRun({ harnessRepo, runId, token });
  } catch (error) {
    await summarize('failed');
    throw error;
  }
  await summarize('passed');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
