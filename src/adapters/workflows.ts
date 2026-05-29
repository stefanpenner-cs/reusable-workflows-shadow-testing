import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { transformWorkflowFile } from '../core/transformWorkflowFile.ts';
import type { PatchOptions } from '../core/patchConsumerWorkflow.ts';

/** Apply the mirror transform to every workflow file under `<rootDir>/.github/workflows`.
 * Returns the names of files that actually changed. */
export function patchWorkflowsInDir(rootDir: string, opts: PatchOptions): string[] {
  const dir = join(rootDir, '.github', 'workflows');
  let names: string[];
  try {
    names = readdirSync(dir);
  } catch {
    return [];
  }

  const changed: string[] = [];
  for (const name of names) {
    if (!/\.ya?ml$/.test(name)) continue;
    const file = join(dir, name);
    const before = readFileSync(file, 'utf8');
    const after = transformWorkflowFile(before, opts);
    if (after !== before) {
      writeFileSync(file, after);
      changed.push(name);
    }
  }
  return changed;
}
