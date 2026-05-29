import { capture, run } from './exec.ts';

const git = (args: string[], cwd?: string) => capture('git', args, { cwd });

/** Shallow-clone a consumer repo at a ref into `dir`, authenticated with a token. */
export async function cloneShallow(opts: {
  repo: string;
  ref: string;
  dir: string;
  token: string;
}): Promise<void> {
  const url = `https://x-access-token:${opts.token}@github.com/${opts.repo}.git`;
  await run('git', ['clone', '--depth=1', '--branch', opts.ref, url, opts.dir]);
}

/** Set a committer identity for the bot commit. */
export async function configureBotIdentity(cwd: string): Promise<void> {
  await git(['config', 'user.name', 'shadow-testing[bot]'], cwd);
  await git(['config', 'user.email', 'shadow-testing@users.noreply.github.com'], cwd);
}

/** Start the shadow branch from the current HEAD and clear the tracked tree, so the next commit
 * contains only the mirrored consumer files (a clean single commit on top of the harness base). */
export async function resetBranchToEmptyTree(cwd: string, branch: string): Promise<void> {
  await git(['checkout', '-B', branch], cwd);
  await git(['rm', '-rf', '--quiet', '.'], cwd);
}

// Fixed timestamp so an identical (tree, parent, message, identity) yields an identical commit SHA.
// Combined with the fixed bot identity, this makes the shadow commit reproducible: re-running with
// the same inputs produces the same SHA, the force-push is a no-op, and we observe the already-
// concluded run instead of spawning a redundant one.
const DETERMINISTIC_DATE = '2000-01-01T00:00:00Z';

/** Stage everything and make a reproducible commit. */
export async function commitAll(cwd: string, message: string): Promise<void> {
  await git(['add', '-A'], cwd);
  await capture('git', ['commit', '--allow-empty', '-m', message], {
    cwd,
    env: { ...process.env, GIT_AUTHOR_DATE: DETERMINISTIC_DATE, GIT_COMMITTER_DATE: DETERMINISTIC_DATE },
  });
}

export async function forcePush(cwd: string, branch: string): Promise<void> {
  await git(['push', '--force', 'origin', branch], cwd);
}

/** The current HEAD commit SHA — used to watch the exact run for this push. */
export async function headSha(cwd: string): Promise<string> {
  return (await git(['rev-parse', 'HEAD'], cwd)).trim();
}
