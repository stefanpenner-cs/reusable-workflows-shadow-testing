import { describe, it, expect } from 'vitest';
import { parse } from 'yaml';
import { ensurePullRequestTrigger } from '../src/core/ensurePullRequestTrigger.ts';

describe('ensurePullRequestTrigger', () => {
  it('adds pull_request to a mapping `on:` that lacks it', () => {
    const input = ['on:', '  push:', '    branches: [main]', 'jobs: {}'].join('\n');
    const out = parse(ensurePullRequestTrigger(input));
    expect(out.on).toHaveProperty('pull_request');
    expect(out.on).toHaveProperty('push');
  });

  it('is a no-op when pull_request is already present (mapping)', () => {
    const input = ['on:', '  pull_request:', '  push:', 'jobs: {}'].join('\n');
    expect(ensurePullRequestTrigger(input)).toBe(ensurePullRequestTrigger(ensurePullRequestTrigger(input)));
  });

  it('appends pull_request to a sequence `on:`', () => {
    const input = ['on: [push, workflow_dispatch]', 'jobs: {}'].join('\n');
    const out = parse(ensurePullRequestTrigger(input));
    expect(out.on).toContain('pull_request');
    expect(out.on).toContain('push');
    expect(out.on).toContain('workflow_dispatch');
  });

  it('does not duplicate in a sequence that already has pull_request', () => {
    const input = ['on: [push, pull_request]', 'jobs: {}'].join('\n');
    const out = parse(ensurePullRequestTrigger(input));
    expect(out.on.filter((e: string) => e === 'pull_request')).toHaveLength(1);
  });

  it('promotes a scalar `on:` to a sequence including pull_request', () => {
    const input = ['on: push', 'jobs: {}'].join('\n');
    const out = parse(ensurePullRequestTrigger(input));
    expect(out.on).toContain('push');
    expect(out.on).toContain('pull_request');
  });

  it('preserves comments', () => {
    const input = ['# triggers', 'on:', '  push:', 'jobs: {}'].join('\n');
    expect(ensurePullRequestTrigger(input)).toContain('# triggers');
  });
});
