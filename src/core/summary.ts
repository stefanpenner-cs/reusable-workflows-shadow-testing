export type ShadowResult = 'passed' | 'failed';

export interface ShadowSummaryInput {
  consumerRepo: string;
  consumerRef: string;
  providerRepo: string;
  providerRef: string;
  providerPr: number;
  result: ShadowResult;
  runUrl: string;
  prUrl: string | null;
}

/**
 * Render the shadow result as a GitHub job-summary markdown page. Written to
 * $GITHUB_STEP_SUMMARY by the dispatch bin, it shows on the shadow check's page on the
 * provider PR (replacing the old sticky comment). Pure: no I/O, fully testable.
 */
export function renderShadowSummary(input: ShadowSummaryInput): string {
  const passed = input.result === 'passed';
  const icon = passed ? '✅' : '❌';
  const verdict = passed ? 'passed' : 'failed';

  const links = [`[Receiver run](${input.runUrl})`];
  if (input.prUrl) links.push(`[Shadow PR](${input.prUrl})`);

  return [
    `## ${icon} Shadow test ${verdict}`,
    '',
    '| | |',
    '| --- | --- |',
    `| Consumer | \`${input.consumerRepo}@${input.consumerRef}\` |`,
    `| Provider draft | \`${input.providerRepo}@${input.providerRef}\` |`,
    `| Provider PR | #${input.providerPr} |`,
    `| Result | ${icon} ${verdict} |`,
    '',
    links.join(' · '),
    '',
  ].join('\n');
}
