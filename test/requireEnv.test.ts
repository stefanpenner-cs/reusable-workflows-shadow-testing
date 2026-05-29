import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { requireEnv } from '../src/core/requireEnv.ts';

describe('requireEnv', () => {
  it('returns the value when set and non-empty', () => {
    assert.equal(requireEnv('REQUIRE_ENV_TEST', { REQUIRE_ENV_TEST: 'value' }), 'value');
  });

  it('throws naming the variable when missing', () => {
    assert.throws(() => requireEnv('REQUIRE_ENV_MISSING', {}), /REQUIRE_ENV_MISSING/);
  });

  it('throws when empty', () => {
    assert.throws(() => requireEnv('REQUIRE_ENV_EMPTY', { REQUIRE_ENV_EMPTY: '' }));
  });
});
