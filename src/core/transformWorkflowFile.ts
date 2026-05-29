import { patchConsumerWorkflow, type PatchOptions } from './patchConsumerWorkflow.ts';
import { ensurePullRequestTrigger } from './ensurePullRequestTrigger.ts';

/** The full mirror transform for one consumer workflow file: repoint the provider, then guarantee a
 * pull_request trigger so the shadow PR actually runs it. */
export function transformWorkflowFile(yaml: string, opts: PatchOptions): string {
  return ensurePullRequestTrigger(patchConsumerWorkflow(yaml, opts));
}
