import { capture, run } from './exec.ts';
import { buildDispatchInputs, extractRunId, type ShadowContext } from '../core/dispatch.ts';

const RECEIVER_WORKFLOW = 'receiver.yaml';

const ghEnv = (token: string): NodeJS.ProcessEnv => ({ ...process.env, GH_TOKEN: token });

/** Trigger the harness receiver via workflow_dispatch and return the created run id (the
 * 2026-02 `return_run_details` capability — no run-discovery polling needed). */
export async function dispatchReceiver(opts: {
  harnessRepo: string;
  ctx: ShadowContext;
  token: string;
}): Promise<number> {
  const body = JSON.stringify({
    ref: 'main',
    inputs: buildDispatchInputs(opts.ctx),
    return_run_details: true,
  });
  const out = await capture(
    'gh',
    ['api', '-X', 'POST', `repos/${opts.harnessRepo}/actions/workflows/${RECEIVER_WORKFLOW}/dispatches`, '--input', '-'],
    { env: ghEnv(opts.token), input: body },
  );
  return extractRunId(JSON.parse(out));
}

/** Block until a run finishes, streaming logs; rejects if the run concludes non-successfully. */
export async function watchRun(opts: { harnessRepo: string; runId: number; token: string }): Promise<void> {
  await run('gh', ['run', 'watch', String(opts.runId), '-R', opts.harnessRepo, '--exit-status'], {
    env: ghEnv(opts.token),
  });
}

/** URL of the open PR for a head branch, or null if none exists. */
export async function findPrUrl(opts: { repo: string; branch: string; token: string }): Promise<string | null> {
  const out = await capture(
    'gh',
    ['pr', 'list', '-R', opts.repo, '--head', opts.branch, '--state', 'open', '--json', 'url', '--jq', '.[0].url // ""'],
    { env: ghEnv(opts.token) },
  );
  const url = out.trim();
  return url === '' ? null : url;
}

/** Open the shadow PR if one isn't already open for the branch; return its URL. */
export async function ensurePr(opts: {
  repo: string;
  branch: string;
  base: string;
  title: string;
  body: string;
  token: string;
}): Promise<string> {
  const existing = await findPrUrl(opts);
  if (existing) return existing;
  const out = await capture(
    'gh',
    ['pr', 'create', '-R', opts.repo, '--head', opts.branch, '--base', opts.base, '--title', opts.title, '--body', opts.body],
    { env: ghEnv(opts.token) },
  );
  return out.trim();
}

/** Block until the PR's checks finish; rejects on the first failing check. */
export async function watchPrChecks(opts: { repo: string; branch: string; token: string }): Promise<void> {
  await run('gh', ['pr', 'checks', opts.branch, '-R', opts.repo, '--watch', '--fail-fast'], {
    env: ghEnv(opts.token),
  });
}

/** Create or update a single marker-tagged comment on the provider PR (no spam on re-runs). */
export async function upsertStickyComment(opts: {
  repo: string;
  pr: number;
  marker: string;
  body: string;
  token: string;
}): Promise<void> {
  const env = ghEnv(opts.token);
  const fullBody = `${opts.marker}\n${opts.body}`;
  const ids = await capture(
    'gh',
    ['api', '--paginate', `repos/${opts.repo}/issues/${opts.pr}/comments`, '--jq', `.[] | select(.body | startswith("${opts.marker}")) | .id`],
    { env },
  );
  const id = ids.trim().split('\n').filter(Boolean)[0];
  if (id) {
    await capture('gh', ['api', '-X', 'PATCH', `repos/${opts.repo}/issues/comments/${id}`, '-f', `body=${fullBody}`], { env });
  } else {
    await capture('gh', ['api', '-X', 'POST', `repos/${opts.repo}/issues/${opts.pr}/comments`, '-f', `body=${fullBody}`], { env });
  }
}

/** Close the shadow PR (deleting its branch). Best-effort: ignores "already gone". */
export async function closePrAndDeleteBranch(opts: { repo: string; branch: string; token: string }): Promise<void> {
  const env = ghEnv(opts.token);
  const url = await findPrUrl(opts);
  if (url) {
    await run('gh', ['pr', 'close', url, '-R', opts.repo, '--delete-branch'], { env }).catch(() => {});
  }
  await capture('gh', ['api', '-X', 'DELETE', `repos/${opts.repo}/git/refs/heads/${opts.branch}`], { env }).catch(() => {});
}
