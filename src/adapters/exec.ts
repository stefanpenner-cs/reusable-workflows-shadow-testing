import { execFile, spawn } from 'node:child_process';

export interface ExecOptions {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  /** Written to the child's stdin (used for `gh api --input -`). */
  input?: string;
}

/** Run a command and return its stdout. Rejects (with stderr) on a non-zero exit. */
export function capture(file: string, args: string[], opts: ExecOptions = {}): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = execFile(
      file,
      args,
      { cwd: opts.cwd, env: opts.env, maxBuffer: 64 * 1024 * 1024 },
      (error, stdout, stderr) => {
        if (error) reject(new Error(`\`${file} ${args.join(' ')}\` failed: ${stderr || error.message}`));
        else resolve(stdout.toString());
      },
    );
    if (opts.input !== undefined) child.stdin?.end(opts.input);
  });
}

/** Run a command, streaming its output live (stdio inherited). Rejects on a non-zero exit. */
export function run(file: string, args: string[], opts: ExecOptions = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(file, args, { cwd: opts.cwd, env: opts.env, stdio: 'inherit' });
    child.on('error', reject);
    child.on('close', (code) =>
      code === 0 ? resolve() : reject(new Error(`\`${file} ${args.join(' ')}\` exited with ${code}`)),
    );
  });
}
