import { describe, expect, it } from 'vitest';
import { generateLevel } from '../apps/server/src/data/levels.ts';
import { mineStats } from './mine-stats.ts';

describe('mine-stats', () => {
  it('accounts for every cell of a generated Mine', () => {
    for (const depth of [1, 7, 20]) {
      const def = generateLevel(depth);
      const s = mineStats(def);
      const deviceCells = def.devices.reduce((a, d) => a + d.w * d.h, 0);
      expect(s.rocks + s.holes + s.monsters + deviceCells).toBe(def.width * def.height);
      expect(s.encrypted).toBeLessThanOrEqual(s.rocks);
      expect(s.byteShare).toBeGreaterThanOrEqual(0);
      expect(s.byteShare).toBeLessThanOrEqual(1);
    }
  });
});
