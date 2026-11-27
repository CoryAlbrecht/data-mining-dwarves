import { describe, expect, it } from 'vitest';
import {
  assertKnownOverrides,
  DIG_CURVE,
  envKeyPart,
  LEVELS_CACHE,
  levelsCacheName,
  GENERATOR_VERSION,
  overridesHash,
  withOverrides,
} from './index.ts';

describe('withOverrides', () => {
  const defaults = { rockGrowth: 1.6, bytes: { base: 8 }, columns: [2, 3], label: 'x' } as const;

  it('replaces a key named DMD_<OBJECT>__<KEY>, at any depth', () => {
    const env = { DMD_CURVE__ROCK_GROWTH: '2.4', DMD_CURVE__BYTES__BASE: '10', DMD_CURVE__COLUMNS: '[1, 5]' };
    expect(withOverrides('CURVE', defaults, env)).toEqual({
      rockGrowth: 2.4,
      bytes: { base: 10 },
      columns: [1, 5],
      label: 'x',
    });
  });

  it('keeps the defaults with no overrides, and leaves them untouched', () => {
    expect(withOverrides('CURVE', defaults, {})).toEqual(defaults);
    withOverrides('CURVE', defaults, { DMD_CURVE__ROCK_GROWTH: '9' });
    expect(defaults.rockGrowth).toBe(1.6);
  });

  it('stops on a malformed value, naming the variable', () => {
    expect(() => withOverrides('CURVE', defaults, { DMD_CURVE__ROCK_GROWTH: 'fast' })).toThrow(
      'DMD_CURVE__ROCK_GROWTH',
    );
    expect(() => withOverrides('CURVE', defaults, { DMD_CURVE__ROCK_GROWTH: '' })).toThrow('expected a number');
    expect(() => withOverrides('CURVE', defaults, { DMD_CURVE__COLUMNS: '2,3' })).toThrow('DMD_CURVE__COLUMNS');
  });
});

describe('envKeyPart', () => {
  it('turns code keys into SCREAMING_SNAKE_CASE', () => {
    expect(envKeyPart('rockGrowth')).toBe('ROCK_GROWTH');
    expect(envKeyPart('kernel-panic')).toBe('KERNEL_PANIC');
    expect(envKeyPart('maxOfflineSeconds')).toBe('MAX_OFFLINE_SECONDS');
    expect(envKeyPart('base')).toBe('BASE');
  });
});

describe('assertKnownOverrides', () => {
  it('accepts every key of the registered tunables, and env vars without the prefix', () => {
    expect(() =>
      assertKnownOverrides({
        DMD_DIG_CURVE__ROCK_GROWTH: '2.4',
        DMD_ROCK_CURVE__FIRST_MEDIAN: '3.25',
        DMD_MONSTER_SPAWN__BASE: '0.1',
        DMD_PART_PACE__DRAM__PER_LEVEL: '2',
        DMD_MONSTERS__KERNEL_PANIC__HP: '60',
        DMD_LAYOUT__ENTRY_COLUMNS: '[3]',
        HOME: '/home/dwarf',
      }),
    ).not.toThrow();
  });

  it('stops on a key that names no tunable, naming it', () => {
    expect(() => assertKnownOverrides({ DMD_DIG_CURVE__ROCK_GROWHT: '2' })).toThrow('DMD_DIG_CURVE__ROCK_GROWHT');
    expect(() => assertKnownOverrides({ DMD_NOPE: '1' })).toThrow('names no tunable');
    // Only numbers are tunable: a Monster's name is not.
    expect(() => assertKnownOverrides({ DMD_MONSTERS__BUG__NAME: 'Moth' })).toThrow('DMD_MONSTERS__BUG__NAME');
  });
});

describe('the Mine cache name', () => {
  it('is the generator version alone with no overrides', () => {
    expect(overridesHash({ HOME: '/x' })).toBe('');
    expect(levelsCacheName('')).toBe(`dmd-levels-v${GENERATOR_VERSION}`);
  });

  it('changes when an override does', () => {
    const a = overridesHash({ DMD_ROCK_CURVE__PER_MINE: '0.6' });
    const b = overridesHash({ DMD_ROCK_CURVE__PER_MINE: '0.7' });
    const c = overridesHash({ DMD_ROCK_CURVE__HANDOVER: '0.6' });
    expect(new Set(['', a, b, c]).size).toBe(4);
    expect(levelsCacheName(a)).toBe(`dmd-levels-v${GENERATOR_VERSION}-${a}`);
  });
});

describe('tests run on the code defaults', () => {
  it('whatever the env files hold', () => {
    expect(DIG_CURVE.rockGrowth).toBe(2.4);
    expect(LEVELS_CACHE).toBe(`dmd-levels-v${GENERATOR_VERSION}`);
  });
});
