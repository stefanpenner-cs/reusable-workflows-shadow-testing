export interface ShadowContext {
  providerRepo: string;
  providerRef: string;
  consumerRepo: string;
  consumerRef: string;
  providerPr: number;
  branch: string;
}

/** Map the shadow context to the receiver workflow_dispatch `inputs` (all values are strings). */
export function buildDispatchInputs(ctx: ShadowContext): Record<string, string> {
  return {
    provider_repo: ctx.providerRepo,
    provider_ref: ctx.providerRef,
    consumer_repo: ctx.consumerRepo,
    consumer_ref: ctx.consumerRef,
    provider_pr: String(ctx.providerPr),
    branch: ctx.branch,
  };
}

/**
 * Read the run id from a `workflow_dispatch` response created with `return_run_details: true`.
 * REST shape: `{ workflow_run_id, run_url, html_url }`.
 */
export function extractRunId(response: unknown): number {
  const id = (response as { workflow_run_id?: unknown } | null)?.workflow_run_id;
  if (typeof id !== 'number' || !Number.isFinite(id)) {
    throw new Error(`workflow_dispatch response has no numeric workflow_run_id: ${JSON.stringify(response)}`);
  }
  return id;
}
