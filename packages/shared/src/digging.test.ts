import { describe, expect, it } from 'vitest';
import { areAdjacent, digSeconds, mineOrder, neighbor, rockSize, strikeDamage } from './digging.ts';

describe('digging', () => {
  it('pins L1 dwarf vs L1 rock at 30 seconds', () => {
    expect(rockSize(1)).toBe(120);
    expect(strikeDamage(1)).toBe(4);
    expect(digSeconds(1, 1)).toBe(30);
  });

  it('makes a higher-level dwarf faster, but less than proportionally', () => {
    expect(digSeconds(2, 1)).toBe(20);
  });

  it('makes equal-level matchups take longer as levels rise', () => {
    expect(digSeconds(2, 2)).toBe(32);
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
