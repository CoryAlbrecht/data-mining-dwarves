import { describe, expect, it } from 'vitest';
import { chipCount, encryptedChipCount } from './loot.ts';

describe('chip loot', () => {
  it('drops one chip per 3 rock Levels, rounded up', () => {
    const noBonus = 0.5;
    expect([1, 3, 4, 6, 7].map((l) => chipCount(l, noBonus))).toEqual([1, 1, 2, 2, 3]);
  });

  it('adds one extra chip 20% of the time', () => {
    expect(chipCount(1, 0.19)).toBe(2);
    expect(chipCount(1, 0.2)).toBe(1);
    expect(chipCount(4, 0)).toBe(3);
  });

  it('fills encrypted bit-rocks with 3 times the usual stack', () => {
    expect([1, 3, 4, 7].map(encryptedChipCount)).toEqual([3, 3, 6, 9]);
  });
});
