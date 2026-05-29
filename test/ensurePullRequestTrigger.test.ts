import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parse } from 'yaml';
import { ensurePullRequestTrigger } from '../src/core/ensurePullRequestTrigger.ts';

describe('ensurePullRequestTrigger', () => {
  it('adds pull_request to a mapping `on:` that lacks it', () => {
    const input = ['on:', '  push:', '    branches: [main]', 'jobs: {}'].join('\n');
    const out = parse(ensurePullRequestTrigger(input));
    assert.ok('pull_request' in out.on);
    assert.ok('push' in out.on);
  });

  it('is a no-op when pull_request is already present (mapping)', () => {
    const input = ['on:', '  pull_request:', '  push:', 'jobs: {}'].join('\n');
    assert.equal(ensurePullRequestTrigger(input), ensurePullRequestTrigger(ensurePullRequestTrigger(input)));
  });

  it('appends pull_request to a sequence `on:`', () => {
    const input = ['on: [push, workflow_dispatch]', 'jobs: {}'].join('\n');
    const out = parse(ensurePullRequestTrigger(input));
    assert.ok(out.on.includes('pull_request'));
    assert.ok(out.on.includes('push'));
    assert.ok(out.on.includes('workflow_dispatch'));
  });

  it('does not duplicate in a sequence that already has pull_request', () => {
    const input = ['on: [push, pull_request]', 'jobs: {}'].join('\n');
    const out = parse(ensurePullRequestTrigger(input));
    assert.equal(out.on.filter((e: string) => e === 'pull_request').length, 1);
  });

  it('promotes a scalar `on:` to a sequence including pull_request', () => {
    const input = ['on: push', 'jobs: {}'].join('\n');
    const out = parse(ensurePullRequestTrigger(input));
    assert.ok(out.on.includes('push'));
    assert.ok(out.on.includes('pull_request'));
  });

  it('preserves comments', () => {
    const input = ['# triggers', 'on:', '  push:', 'jobs: {}'].join('\n');
    assert.ok(ensurePullRequestTrigger(input).includes('# triggers'));
  });
});
