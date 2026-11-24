import { describe, expect, it } from 'vitest';
import { cpuTier, firstDepthOf, hardwareFor, placeOf, rockMedian } from './computers.ts';

describe('computers', () => {
  it('splits depths into computers of 4, 8, 16… levels (placeholder rule)', () => {
    expect(placeOf(1)).toMatchObject({ computer: 0, index: 0, last: false });
    expect(placeOf(4)).toMatchObject({ computer: 0, index: 3, last: true });
    expect(placeOf(5)).toMatchObject({ computer: 1, index: 0, firstDepth: 5 });
    expect(placeOf(12)).toMatchObject({ computer: 1, index: 7, last: true });
    expect(firstDepthOf(2)).toBe(13);
  });

  it('keeps the CPU fixed within a computer and jumps 2–3 models between computers', () => {
    const cpus = (c: number) => {
      const first = firstDepthOf(c);
      return new Set(Array.from({ length: 4 }, (_, k) => hardwareFor(first + k)[0]!.id));
    };
    expect(cpus(0).size).toBe(1);
    expect(cpus(1).size).toBe(1);
    expect(hardwareFor(1)[0]!.name).toBe('4004 CPU');
    const jump = cpuTier(1) - cpuTier(0);
    expect(jump === 2 || jump === 3).toBe(true); // 8080 or Z80
  });

  it('grows RAM every level, and drops storage back (but not to the start) on a new computer', () => {
    const dram = (d: number) => hardwareFor(d).find((m) => m.kind === 'dram')!.tier;
    const disk = (d: number) => hardwareFor(d).find((m) => m.kind === 'storage')!.tier;
    expect(dram(2)).toBe(dram(1) + 1);
    expect(disk(4)).toBeGreaterThan(disk(5)); // last level of computer 1 vs first of computer 2
    expect(disk(5)).toBeGreaterThan(disk(1));
  });

  it('raises the Rock curve median half a Level every Mine', () => {
    expect([1, 2, 3, 4].map(rockMedian)).toEqual([1, 1.5, 2, 2.5]);
  });

  it('starts each new Computer a quarter of the way up the last one', () => {
    // Computer 1 runs 1 → 2.5, so Computer 2 starts at 1.375 and runs 8 Mines to 4.875.
    expect(rockMedian(5)).toBeCloseTo(1.375);
    expect(rockMedian(12)).toBeCloseTo(4.875);
    // Computer 3: 1.375 + (4.875 − 1.375) / 4 = 2.25, then 16 Mines to 9.75.
    expect(rockMedian(13)).toBeCloseTo(2.25);
    expect(rockMedian(28)).toBeCloseTo(9.75);
    expect(rockMedian(29)).toBeCloseTo(4.125);
  });
});

import { rockLevelCounts, holeChance, portWidth } from './layout.ts';

describe('layout rules', () => {
  it('spreads rock Levels in a bell curve that adds up', () => {
    const counts = rockLevelCounts(32, 4);
    expect(counts.map(([l]) => l)).toEqual([2, 3, 4, 5, 6]);
    expect(counts.reduce((a, [, c]) => a + c, 0)).toBe(32);
    const peak = counts.find(([l]) => l === 4)![1];
    expect(peak).toBeGreaterThan(counts.find(([l]) => l === 2)![1]);
  });

  it('shifts the bell curve by half-steps for a half-Level median', () => {
    const mean = (median: number) => {
      const counts = rockLevelCounts(64, median);
      expect(counts.reduce((a, [, c]) => a + c, 0)).toBe(64);
      expect(counts.every(([l]) => Number.isInteger(l))).toBe(true);
      return counts.reduce((a, [l, c]) => a + l * c, 0) / 64;
    };
    expect(mean(4.5)).toBeGreaterThan(mean(4));
    expect(mean(4.5)).toBeLessThan(mean(5));
    expect(mean(4.5)).toBeCloseTo(4.5, 1);
  });

  it('folds Levels below 1 into Level 1', () => {
    expect(rockLevelCounts(16, 1)).toEqual([
      [1, 11],
      [2, 4],
      [3, 1],
    ]);
  });

  it('starts the bottom row empty, then 50% down to 10% holes', () => {
    expect(holeChance(0)).toBe(1);
    expect(holeChance(1)).toBe(0.5);
    expect(holeChance(11)).toBeCloseTo(0.1);
  });

  it('widens the port with each computer, up to 4', () => {
    expect([0, 1, 2, 5].map(portWidth)).toEqual([2, 3, 4, 4]);
  });
});
