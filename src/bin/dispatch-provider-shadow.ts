import { requireEnv } from '../core/requireEnv.ts';
import { buildShadowDispatchArgs } from '../core/providerDispatch.ts';
import { run } from '../adapters/exec.ts';

/**
 * Harness-CI entrypoint: trigger the provider's shadow workflow against THIS harness ref so a
 * harness change is exercised end-to-end. Fire-and-forget — the result surfaces on the provider
 * PR's shadow check. GH_TOKEN must have actions:write on the provider repo.
 */
async function main(): Promise<void> {
  const providerRepo = requireEnv('PROVIDER_REPO');
  const providerPr = requireEnv('PROVIDER_PR');
  const harnessRef = requireEnv('HARNESS_REF');
  requireEnv('GH_TOKEN');

  const args = buildShadowDispatchArgs({ providerRepo, workflow: 'shadow.yaml', providerPr, harnessRef });
  await run('gh', args);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
