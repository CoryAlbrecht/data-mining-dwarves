import { describe, expect, it } from 'vitest';
import { areAdjacent, DIG_CURVE, digSeconds, mineOrder, neighbor, PACING_TARGETS, rockSize, strikeDamage } from './digging.ts';
import { withOverrides } from './tunables.ts';

describe('digging', () => {
  it('pins L1 dwarf vs L1 rock at 20 seconds', () => {
    expect(rockSize(1)).toBe(120);
    expect(strikeDamage(1)).toBe(6);
    expect(digSeconds(1, 1)).toBe(20);
  });

  it('follows time(d, r) = 20 s · 2.4^(r−1) · 1.045^((r−1)²) / 2.1^(d−1), in whole strikes', () => {
    for (let d = 1; d <= 8; d++) {
      for (let r = 1; r <= 10; r++) {
        const size = Math.round(120 * 2.4 ** (r - 1) * 1.045 ** ((r - 1) ** 2));
        expect(digSeconds(d, r)).toBe(Math.max(1, Math.ceil(size / (6 * 2.1 ** (d - 1)) - 1e-9)));
      }
    }
  });

  it.each(PACING_TARGETS)('digs an L%i dwarf vs L%i rock within −25%%/+30%% of %i s', (d, r, target) => {
    expect(digSeconds(d, r)).toBeGreaterThanOrEqual(target * 0.75);
    expect(digSeconds(d, r)).toBeLessThanOrEqual(target * 1.3);
  });

  it('gives the plain exponential curve with rockBend = 1', () => {
    const plain = withOverrides('DIG_CURVE', DIG_CURVE, { DMD_DIG_CURVE__ROCK_BEND: '1' });
    for (let r = 1; r <= 12; r++) {
      expect(rockSize(r, plain)).toBe(Math.round(120 * DIG_CURVE.rockGrowth ** (r - 1)));
    }
  });

  it('makes a merged dwarf out-dig the two it was made from', () => {
    for (let d = 1; d < 10; d++) expect(strikeDamage(d + 1)).toBeGreaterThan(2 * strikeDamage(d));
  });

  it('makes equal-level matchups take longer as levels rise', () => {
    for (let n = 2; n <= 20; n++) expect(digSeconds(n, n)).toBeGreaterThanOrEqual(digSeconds(n - 1, n - 1));
    expect(digSeconds(10, 10)).toBeGreaterThan(digSeconds(2, 2));
  });

  it('takes at least one strike', () => {
    expect(digSeconds(50, 1)).toBe(1);
  });
});

describe('grid', () => {
  it('uses WASD order for odd levels and DSAW for even', () => {
    expect(mineOrder(1)).toEqual(['up', 'left', 'down', 'right']);
    expect(mineOrder(2)).toEqual(['right', 'down', 'left', 'up']);
  });

  it('finds orthogonal neighbors only', () => {
    // 3×3 grid, center = 4
    expect(neighbor(4, 'up', 3, 3)).toBe(1);
    expect(neighbor(4, 'right', 3, 3)).toBe(5);
    expect(neighbor(0, 'left', 3, 3)).toBeNull();
    expect(neighbor(2, 'right', 3, 3)).toBeNull(); // no wrapping to the next row
    expect(areAdjacent(0, 4, 3)).toBe(false); // diagonal
    expect(areAdjacent(1, 4, 3)).toBe(true);
  });
});
