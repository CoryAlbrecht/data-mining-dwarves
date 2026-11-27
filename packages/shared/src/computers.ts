import { mulberry32 } from './rng.ts';
import { modelAt, type DeviceModel, type ProducingKind } from './devices.ts';
import { tunable } from './tunables.ts';

/**
 * The game is a series of computers. Each computer is a run of levels; the last level of a
 * computer has a USB port instead of a network port, and dwarves leave by sneakernet for the
 * next computer. Depths are numbered globally (computer 2 starts where computer 1 ended).
 *
 * TBD: the exact length rule. The design says "variable, but a power of two"; until that's
 * decided this placeholder doubles each time: 4, 8, 16, 32… levels.
 */
export function computerLength(computer: number): number {
  return 2 ** (computer + 2);
}

export interface Place {
  /** 0-based computer number. */
  computer: number;
  /** 0-based level within the computer. */
  index: number;
  /** Levels in this computer. */
  length: number;
  /** Global depth of the computer's first level. */
  firstDepth: number;
  /** True on the computer's last level (it has the USB port). */
  last: boolean;
}

export function placeOf(depth: number): Place {
  let firstDepth = 1;
  for (let computer = 0; ; computer++) {
    const length = computerLength(computer);
    if (depth < firstDepth + length) {
      const index = depth - firstDepth;
      return { computer, index, length, firstDepth, last: index === length - 1 };
    }
    firstDepth += length;
  }
}

/** First global depth of a computer. */
export function firstDepthOf(computer: number): number {
  let d = 1;
  for (let c = 0; c < computer; c++) d += computerLength(c);
  return d;
}

/**
 * The CPU is fixed for a whole computer and jumps 2–3 models per new computer
 * (4004 → 8080 or Z80 → …). Deterministic per computer.
 */
export function cpuTier(computer: number): number {
  let tier = 0;
  for (let c = 1; c <= computer; c++) tier += 2 + (mulberry32(c * 7919)() < 0.5 ? 0 : 1);
  return tier;
}

/**
 * How fast each non-CPU part advances. Within a computer the tier rises `perLevel` per level.
 * A new computer restarts the part partway back: it keeps `keep` of the progress the previous
 * computer made, so it drops lower than where the last computer ended but never all the way
 * back to the start.
 */
export const PART_PACE = tunable<Record<Exclude<ProducingKind, 'cpu'>, { perLevel: number; keep: number }>>('PART_PACE', {
  dram: { perLevel: 1, keep: 0.75 },
  storage: { perLevel: 0.75, keep: 0.5 },
  vram: { perLevel: 0.5, keep: 0.5 },
});

export function partTier(kind: Exclude<ProducingKind, 'cpu'>, computer: number, index: number): number {
  const { perLevel, keep } = PART_PACE[kind];
  let start = 0;
  for (let c = 0; c < computer; c++) start += Math.floor((computerLength(c) - 1) * perLevel * keep);
  return start + Math.floor(index * perLevel);
}

/**
 * Parts advance at different rates, like real hardware did: the CPU is fixed per computer
 * (see cpuTier); DRAM, storage and VRAM creep up level by level (see PART_PACE). VRAM first
 * appears on the 3rd level of the first computer.
 */
export function hardwareFor(depth: number): DeviceModel[] {
  const { computer: c, index: i } = placeOf(depth);
  const devices = [
    modelAt('cpu', cpuTier(c)),
    modelAt('dram', partTier('dram', c, i)),
    modelAt('storage', partTier('storage', c, i)),
  ];
  if (c > 0 || i >= 2) devices.push(modelAt('vram', partTier('vram', c, i) - (c === 0 ? 1 : 0)));
  return devices;
}

/** How the Rock curve's median climbs (GLOSSARY.md: Rock curve). */
export const ROCK_CURVE = tunable('ROCK_CURVE', {
  /** Median Level of the very first Mine. */
  firstMedian: 1,
  /** Levels the median rises with each Mine of a Computer. */
  perMine: 0.5,
  /** A new Computer starts this far up the previous Computer's first-to-last range. */
  handover: 0.25,
} as const);

/**
 * Median bit-rock Level of the Mine at `depth`. It climbs smoothly through a Computer; after
 * Sneakernet the next Computer starts a quarter of the way up the last one, since the player is
 * rebuilding from one dwarf.
 */
export function rockMedian(depth: number): number {
  const { computer, index } = placeOf(depth);
  let start = ROCK_CURVE.firstMedian;
  for (let c = 0; c < computer; c++) start += (computerLength(c) - 1) * ROCK_CURVE.perMine * ROCK_CURVE.handover;
  return start + index * ROCK_CURVE.perMine;
}

export type { ProducingKind };
