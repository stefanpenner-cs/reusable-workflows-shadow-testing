import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { transformWorkflowFile } from '../core/transformWorkflowFile.ts';
import { workflowReferencesProvider, type PatchOptions } from '../core/patchConsumerWorkflow.ts';

/** Mirror-transform the consumer's workflow files under `<rootDir>/.github/workflows`. Only files
 * that actually call the provider are touched — leaving unrelated workflows (e.g. a deploy job)
 * alone so they aren't force-triggered on the shadow PR. Returns the names of files changed. */
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
    if (!workflowReferencesProvider(before, opts.providerRepo)) continue;
    const after = transformWorkflowFile(before, opts);
    if (after !== before) {
      writeFileSync(file, after);
      changed.push(name);
    }
  }
  return changed;
}
