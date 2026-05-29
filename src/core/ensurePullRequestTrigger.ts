import { parseDocument, isMap, isSeq, isScalar, YAMLSeq } from 'yaml';

/**
 * Ensure a workflow triggers on `pull_request`, so opening a shadow PR in the harness actually runs
 * the mirrored consumer CI (a consumer that only triggers on `push` would otherwise never fire).
 * Handles `on:` as a mapping, sequence, or scalar. Pure, comment-preserving, idempotent.
 */
export function ensurePullRequestTrigger(yaml: string): string {
  const doc = parseDocument(yaml);
  const on = doc.get('on', true);

  if (isMap(on)) {
    if (!on.has('pull_request')) on.set('pull_request', doc.createNode({}));
  } else if (isSeq(on)) {
    const present = on.items.some((item) => isScalar(item) && item.value === 'pull_request');
    if (!present) on.add('pull_request');
  } else if (isScalar(on)) {
    const seq = new YAMLSeq();
    seq.add(on.value);
    seq.add('pull_request');
    doc.set('on', seq);
  } else {
    doc.set('on', doc.createNode({ pull_request: {} }));
  }

  return doc.toString();
}
