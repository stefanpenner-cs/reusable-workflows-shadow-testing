import { describe, it, expect } from 'vitest';
import { requireEnv } from '../src/core/requireEnv.ts';

describe('requireEnv', () => {
  it('returns the value when set and non-empty', () => {
    expect(requireEnv('REQUIRE_ENV_TEST', { REQUIRE_ENV_TEST: 'value' })).toBe('value');
  });

  it('throws naming the variable when missing', () => {
    expect(() => requireEnv('REQUIRE_ENV_MISSING', {})).toThrow(/REQUIRE_ENV_MISSING/);
  });

  it('throws when empty', () => {
    expect(() => requireEnv('REQUIRE_ENV_EMPTY', { REQUIRE_ENV_EMPTY: '' })).toThrow();
  });
});
