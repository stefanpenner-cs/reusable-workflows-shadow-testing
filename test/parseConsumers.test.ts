import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseConsumers } from '../src/core/parseConsumers.ts';

describe('parseConsumers', () => {
  it('parses a list of {repo, ref}', () => {
    assert.deepEqual(parseConsumers('[{"repo":"stefanpenner-cs/reusable-workflows-consumer","ref":"main"}]'), [
      { repo: 'stefanpenner-cs/reusable-workflows-consumer', ref: 'main' },
    ]);
  });

  it('defaults ref to main when omitted', () => {
    assert.deepEqual(parseConsumers('[{"repo":"o/r"}]'), [{ repo: 'o/r', ref: 'main' }]);
  });

  it('allows an empty list', () => {
    assert.deepEqual(parseConsumers('[]'), []);
  });

  it('throws on malformed JSON', () => {
    assert.throws(() => parseConsumers('not json'));
  });

  it('throws when repo is missing', () => {
    assert.throws(() => parseConsumers('[{"ref":"main"}]'));
  });

  it('throws when repo is not owner/name', () => {
    assert.throws(() => parseConsumers('[{"repo":"nope"}]'));
  });
});
