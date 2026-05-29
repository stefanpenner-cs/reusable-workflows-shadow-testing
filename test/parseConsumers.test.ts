import { describe, it, expect } from 'vitest';
import { parseConsumers } from '../src/core/parseConsumers.ts';

describe('parseConsumers', () => {
  it('parses a list of {repo, ref}', () => {
    expect(parseConsumers('[{"repo":"stefanpenner/shared-workflow-consumer","ref":"main"}]')).toEqual(
      [{ repo: 'stefanpenner/shared-workflow-consumer', ref: 'main' }],
    );
  });

  it('defaults ref to main when omitted', () => {
    expect(parseConsumers('[{"repo":"o/r"}]')).toEqual([{ repo: 'o/r', ref: 'main' }]);
  });

  it('allows an empty list', () => {
    expect(parseConsumers('[]')).toEqual([]);
  });

  it('throws on malformed JSON', () => {
    expect(() => parseConsumers('not json')).toThrow();
  });

  it('throws when repo is missing', () => {
    expect(() => parseConsumers('[{"ref":"main"}]')).toThrow();
  });

  it('throws when repo is not owner/name', () => {
    expect(() => parseConsumers('[{"repo":"nope"}]')).toThrow();
  });
});
