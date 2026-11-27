import type { MonsterDef, MonsterId } from './types.ts';
import { tunable } from './tunables.ts';

/**
 * Where Monsters appear. Each cell left over after holes (outside the bottom rows) becomes a
 * Monster with chance base + perDepth · min(depth, depthCap); the kind steps up every
 * depthsPerKind Mines along MONSTER_BY_DEPTH.
 */
export const MONSTER_SPAWN = tunable('MONSTER_SPAWN', {
  base: 0.03,
  perDepth: 0.003,
  depthCap: 20,
  depthsPerKind: 5,
  /** Rows at the bottom of a Mine that never hold a Monster. */
  clearBottom: 2,
} as const);

export const MONSTER_BY_DEPTH: readonly MonsterId[] = ['bug', 'worm', 'troll', 'phisher', 'kernel-panic'];

/** HP one tap knocks off a Monster. */
export const TAP_DAMAGE = 1;

/** Chance that a free cell of the Mine at `depth` holds a Monster. */
export function monsterChance(depth: number): number {
  return MONSTER_SPAWN.base + Math.min(depth, MONSTER_SPAWN.depthCap) * MONSTER_SPAWN.perDepth;
}

/** Which Monster lives in the Mine at `depth`. */
export function monsterFor(depth: number): MonsterId {
  return MONSTER_BY_DEPTH[Math.min(MONSTER_BY_DEPTH.length - 1, Math.floor(depth / MONSTER_SPAWN.depthsPerKind))]!;
}

/** Each Monster's name and look are fixed; its `hp` and `bounty` are tunable. */
export const MONSTERS = tunable<Record<MonsterId, MonsterDef>>('MONSTERS', {
  bug: { glyph: 'ж', id: 'bug', name: 'Bug', pun: "It's not a feature.", hp: 6, bounty: 25 },
  worm: { glyph: '∿', id: 'worm', name: 'Worm', pun: 'Spreads itself thin.', hp: 10, bounty: 60 },
  troll: { glyph: 'Ŧ', id: 'troll', name: 'Forum Troll', pun: 'Actually, well, um…', hp: 18, bounty: 150 },
  phisher: { glyph: '¶', id: 'phisher', name: 'Phisher', pun: 'Wants your pass-word.', hp: 26, bounty: 300 },
  'kernel-panic': { glyph: '☠',
    id: 'kernel-panic',
    name: 'Kernel Panic',
    pun: "Don't panic. It will.",
    hp: 50,
    bounty: 900,
  },
});
