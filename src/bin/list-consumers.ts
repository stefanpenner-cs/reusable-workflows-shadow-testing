import { readFileSync, appendFileSync } from 'node:fs';
import { requireEnv } from '../core/requireEnv.ts';
import { parseConsumers } from '../core/parseConsumers.ts';

/** Provider setup entrypoint: validate shadow-consumers.json and emit it as a matrix for the
 * downstream job (`consumers=<json>` on $GITHUB_OUTPUT). */
function main(): void {
  const consumers = parseConsumers(readFileSync(requireEnv('CONSUMERS_FILE'), 'utf8'));
  appendFileSync(requireEnv('GITHUB_OUTPUT'), `consumers=${JSON.stringify(consumers)}\n`);
  console.log(`consumers: ${consumers.map((c) => `${c.repo}@${c.ref}`).join(', ') || '(none)'}`);
}

main();
