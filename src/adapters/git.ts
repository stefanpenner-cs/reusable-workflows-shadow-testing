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

/** Stage everything and commit. Returns true if a commit was made (false when nothing changed). */
export async function commitAll(cwd: string, message: string): Promise<void> {
  await git(['add', '-A'], cwd);
  await git(['commit', '--allow-empty', '-m', message], cwd);
}

export async function forcePush(cwd: string, branch: string): Promise<void> {
  await git(['push', '--force', 'origin', branch], cwd);
}
