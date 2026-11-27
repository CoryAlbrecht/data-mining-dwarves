import { tunable } from './tunables.ts';

/**
 * What a bit-rock holds when it breaks. A model chip (a Device, fork() or Port technology)
 * comes as a small stack that grows with the rock's Level; duplex and cron chips come singly.
 */
export const LOOT = tunable('LOOT', {
  /** One chip in the stack for every this many rock Levels, rounded up. */
  levelsPerChip: 3,
  /** Chance of one extra chip on top. */
  bonusChance: 0.2,
  /** Bytes in a bytes bit-rock: base · growth^(depth−1), times a random 0.5–1.5. */
  bytes: { base: 8, growth: 1.5 },
  /** Encrypted bit-rocks hold this many times the usual stack (without the bonus). */
  encryptedStacks: 3,
  /**
   * How often each chip appears in an encrypted bit-rock's draw: every producing Device's chip
   * this many times, fork() and each Port technology chip once each.
   */
  encryptedWeights: { device: 2, fork: 1, portTech: 1 },
  /** "Other" chips go at most this many ladder tiers above this Mine's model of the same kind. */
  otherTierWindow: 4,
  /** The next Port technology's chips drop from this depth on. */
  nextTechFromDepth: 2,
  /**
   * Share of ordinary bit-rocks holding each kind of loot (adds up to 1). Chips for this Mine's
   * producing Devices get the biggest chip share, so upgrading them feels reachable in one Mine.
   */
  share: {
    bytes: 0.55,
    /** Chips for this Mine's producing Devices (CPU, DRAM, storage, VRAM), picked evenly. */
    device: 0.24,
    fork: 0.03,
    /** Chips for this Mine's Port technologies, picked evenly. */
    portTech: 0.06,
    /** Chips for models that aren't in this Mine. */
    other: 0.09,
    duplex: 0.015,
    cron: 0.015,
  },
} as const);

export type LootKind = keyof typeof LOOT.share;

/** Which kind of loot a bit-rock holds, from a uniform 0–1 roll. */
export function lootKind(roll: number): LootKind {
  let edge = 0;
  for (const [kind, share] of Object.entries(LOOT.share) as [LootKind, number][]) {
    edge += share;
    if (roll < edge) return kind;
  }
  return 'cron';
}

/** Bytes in a bytes bit-rock at `depth`. `roll` is a uniform 0–1 draw for the spread. */
export function byteLoot(depth: number, roll: number): number {
  return Math.round(LOOT.bytes.base * LOOT.bytes.growth ** (depth - 1) * (0.5 + roll));
}

/** Model chips in a bit-rock of `level`. `roll` is a uniform 0–1 draw for the bonus chip. */
export function chipCount(level: number, roll: number): number {
  return Math.ceil(level / LOOT.levelsPerChip) + (roll < LOOT.bonusChance ? 1 : 0);
}

/**
 * The chips an encrypted bit-rock draws from, weighted by repetition (LOOT.encryptedWeights).
 * Order matters: the generator picks from it with its seeded stream.
 */
export function encryptedChipPool(deviceChips: readonly string[], forkChip: string, portTechChips: readonly string[]): string[] {
  const w = LOOT.encryptedWeights;
  const repeat = (xs: readonly string[], n: number) => Array.from({ length: n }, () => xs).flat();
  return [...repeat(deviceChips, w.device), ...repeat([forkChip], w.fork), ...repeat(portTechChips, w.portTech)];
}

/** Chips in an encrypted bit-rock of `level`. */
export function encryptedChipCount(level: number): number {
  return LOOT.encryptedStacks * Math.ceil(level / LOOT.levelsPerChip);
}
