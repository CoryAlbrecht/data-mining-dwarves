import { describe, expect, it } from 'vitest';
import { LEVELS_CACHE } from '@dmd/shared';
import { staleLevelCaches } from './levelCache.ts';

describe('stale levels caches', () => {
  it('picks out Mines cached by older generators, and nothing else', () => {
    const names = ['dmd-levels', 'dmd-levels-v1', LEVELS_CACHE, 'dmd-fonts', 'dmd-api', 'workbox-precache-v2'];
    expect(staleLevelCaches(names)).toEqual(['dmd-levels', 'dmd-levels-v1']);
  });
});
