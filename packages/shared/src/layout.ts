import { rockSize } from './digging.ts';
import { NETWORK_TECHS } from './network.ts';

/**
 * Version of the Mine generator. Bump it whenever generation changes what a depth produces:
 * players' devices cache Mines forever under a name that includes it.
 */
export const GENERATOR_VERSION = 4;

/** Every generator's Mines cache name starts with this (the first one was just this). */
export const LEVELS_CACHE_PREFIX = 'dmd-levels';

/** Service-worker cache holding this generator's Mines. */
export const LEVELS_CACHE = `${LEVELS_CACHE_PREFIX}-v${GENERATOR_VERSION}`;

/** Every Mine is this size. Width stays fixed for thumb-sized cells in portrait. */
export const MINE_WIDTH = 8;
export const MINE_HEIGHT = 12;

export const LAYOUT = {
  /** Share of starting holes in the 2nd row from the bottom (the bottom row is always empty)… */
  holesLow: 0.6,
  /** …falling in a straight line to this share in the top row. */
  holesTop: 0.12,
  /** Chance each bit-rock swaps with another, so Levels aren't perfectly stratified… */
  jitterChance: 0.5,
  /** …with a rock at most this many rows away. */
  jitterRows: 2,
  /** Share of hardest-Level rocks that are encrypted (the treasure chests). */
  encryptedShare: 0.25,
  /** Rows at the top / bottom kept free of Devices (fork() sits in the bottom ones). */
  clearTop: 1,
  clearBottom: 2,
  /** Chance fork() sits in the bottom-left corner (otherwise bottom-right). */
  forkLeftChance: 0.5,
  /** Columns of the bottom Wall the Entry can take (any under fork() are skipped). */
  entryColumns: [2, 3, 4, 5],
  /** A buried Device holds one rock's bytes for every this many cells of footprint, rounded up. */
  deviceCellsPerRock: 2,
} as const;

/** Seed of the Mine at `depth`: every random choice in it comes from mulberry32(seed). */
export function mineSeed(depth: number): number {
  return (depth * 2654435761) >>> 0;
}

/**
 * Seed of the port's own random stream. Keeping the port's position apart means retuning holes,
 * rocks or loot never moves it under a saved Mine.
 */
export function portSeed(seed: number): number {
  return seed ^ 0x9e3779b9;
}

/** Bytes in a buried Device of footprint w×h at rock Level `level`. Bigger masses take more diggers. */
export function buriedDeviceSize(level: number, w: number, h: number): number {
  return rockSize(level) * Math.ceil((w * h) / LAYOUT.deviceCellsPerRock);
}

/** Bytes in a Network/USB port `width` cells wide at rock Level `level`. */
export function portSize(level: number, width: number): number {
  return rockSize(level) * width;
}

/** Width of the Network/USB port's stretch of top Wall: 2 on computer 1, 3 on 2, then 4. */
export function portWidth(computer: number): number {
  return Math.min(4, 2 + computer);
}

/** Technology a new Mine's port starts at: one further along per Computer. */
export function startTech(computer: number): number {
  return Math.min(NETWORK_TECHS.length - 1, computer);
}

/** Device footprint grows by Computer: 2×2, then 2×3, then 3×3. */
export function deviceFootprint(computer: number): { w: number; h: number } {
  if (computer === 0) return { w: 2, h: 2 };
  if (computer === 1) return { w: 2, h: 3 };
  return { w: 3, h: 3 };
}

export const FORK_FOOTPRINT = { w: 2, h: 2 } as const;

/** Share of starting holes for a row, counted from the bottom (0 = bottom row). */
export function holeChance(rowFromBottom: number): number {
  if (rowFromBottom === 0) return 1;
  const t = (rowFromBottom - 1) / (MINE_HEIGHT - 2);
  return LAYOUT.holesLow + (LAYOUT.holesTop - LAYOUT.holesLow) * t;
}

/** Binomial weights for Levels median−2 … median+2: a discrete bell curve, σ = 1. */
const BELL = [1, 4, 6, 4, 1];

/**
 * How many of `n` bit-rocks get each Level, following a bell curve centred on `median` (the Rock
 * curve). A fractional median blends the curves of the Levels either side of it, so the curve
 * shifts a little every Mine. Levels below 1 fold into Level 1. Rounded with largest remainders so
 * the counts add up to n. Returns [level, count] pairs, easiest first, skipping zero counts.
 */
export function rockLevelCounts(n: number, median: number): [level: number, count: number][] {
  const low = Math.floor(median);
  const share = median - low;
  const weights = new Map<number, number>();
  for (const [centre, part] of [[low, 1 - share], [low + 1, share]] as const) {
    BELL.forEach((w, k) => {
      const level = Math.max(1, centre - 2 + k);
      weights.set(level, (weights.get(level) ?? 0) + (part * w) / 16);
    });
  }
  const exact = [...weights].map(([level, w]) => ({ level, x: w * n }));
  const counts = exact.map((e) => ({ level: e.level, count: Math.floor(e.x), rem: e.x - Math.floor(e.x) }));
  let left = n - counts.reduce((a, c) => a + c.count, 0);
  for (const c of [...counts].sort((a, b) => b.rem - a.rem)) {
    if (left-- <= 0) break;
    c.count++;
  }
  return counts
    .filter((c) => c.count > 0)
    .sort((a, b) => a.level - b.level)
    .map((c) => [c.level, c.count]);
}
