import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { renderShadowSummary } from '../src/core/summary.ts';

const base = {
  consumerRepo: 'o/consumer',
  consumerRef: 'main',
  providerRepo: 'o/provider',
  providerRef: 'abc123',
  providerPr: 7,
  runUrl: 'https://example.com/run',
  prUrl: 'https://example.com/pr',
} as const;

describe('renderShadowSummary', () => {
  it('renders a passing summary with both links', () => {
    const md = renderShadowSummary({ ...base, result: 'passed' });
    assert.match(md, /## ✅ Shadow test passed/);
    assert.match(md, /`o\/consumer@main`/);
    assert.match(md, /`o\/provider@abc123`/);
    assert.match(md, /\| Provider PR \| #7 \|/);
    assert.match(md, /\[Receiver run\]\(https:\/\/example\.com\/run\)/);
    assert.match(md, /\[Shadow PR\]\(https:\/\/example\.com\/pr\)/);
  });

  it('renders a failing summary', () => {
    const md = renderShadowSummary({ ...base, result: 'failed' });
    assert.match(md, /## ❌ Shadow test failed/);
    assert.match(md, /\| Result \| ❌ failed \|/);
  });

  it('omits the shadow PR link when none exists', () => {
    const md = renderShadowSummary({ ...base, result: 'passed', prUrl: null });
    assert.doesNotMatch(md, /Shadow PR/);
    assert.match(md, /\[Receiver run\]/);
  });
});
