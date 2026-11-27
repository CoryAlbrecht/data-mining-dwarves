import { tunable } from './tunables.ts';

/**
 * Bit-rocks have a size in bytes; each strike of a dwarf's pick removes some of it.
 *
 *   rockSize(r)       = 120 B · 2.4^(r−1) · 1.045^((r−1)²)   (r = rock "level", only used to generate sizes)
 *   strikeDamage(d)   = 6 B · 2.1^(d−1)                      (d = dwarf level, one strike per second)
 *   seconds to dig    = ceil(size / damage) strikes
 *
 * That gives: L1 dwarf vs 120 B (L1) rock = 20 s; L1 vs L2 = 51 s; L2 vs L3 = 66 s. The bend
 * (`rockBend`) makes each rock Level a little steeper than the last, so deep rocks reward merging;
 * with `rockBend = 1` the size is the plain exponential curve. A merge gains digging power:
 * one L(d+1) dwarf strikes 2.1× an L(d) dwarf, a bit more than the two dwarves it was made from.
 * The numbers were fitted to the pacing targets in docs/FORMULAS.md.
 *
 * Up to 4 dwarves can strike the same rock at once (one from each orthogonal side).
 */
export const DIG_CURVE = tunable('DIG_CURVE', {
  baseRockSize: 120,
  baseSeconds: 20,
  rockGrowth: 2.4,
  rockBend: 1.045,
  dwarfGrowth: 2.1,
  strikeSeconds: 1,
} as const);

/**
 * The pacing targets DIG_CURVE was fitted to: [dwarf Level, rock Level, target seconds] for one
 * dwarf. Our own guess at how long an idle game should make a rock feel; not a tunable, since
 * nothing in the game reads it. digging.test.ts holds digSeconds within −25%/+30% of each.
 */
export const PACING_TARGETS: readonly (readonly [dwarf: number, rock: number, seconds: number])[] = [
  [1, 1, 20], [1, 2, 40], [1, 3, 180], [1, 4, 420], [1, 5, 1260], [1, 6, 3900], [1, 7, 16680],
  [2, 3, 60], [2, 4, 240], [2, 5, 600], [2, 6, 1860], [2, 7, 7980],
  [3, 4, 120], [3, 5, 300], [3, 6, 900], [3, 7, 3780],
  [4, 7, 1800],
  [6, 8, 1920],
];

/** The dig curve's numbers; the functions below take another one to compare curves. */
export type DigCurve = typeof DIG_CURVE;

export function rockSize(rockLevel: number, curve: DigCurve = DIG_CURVE): number {
  const steps = rockLevel - 1;
  return Math.round(curve.baseRockSize * curve.rockGrowth ** steps * curve.rockBend ** (steps * steps));
}

/** Bytes removed by one strike. */
export function strikeDamage(dwarfLevel: number, curve: DigCurve = DIG_CURVE): number {
  const base = (curve.baseRockSize / curve.baseSeconds) * curve.strikeSeconds;
  return base * curve.dwarfGrowth ** (dwarfLevel - 1);
}

/** Seconds for one dwarf to dig out `bytes` of rock. */
export function secondsToDig(dwarfLevel: number, bytes: number, curve: DigCurve = DIG_CURVE): number {
  return Math.max(1, Math.ceil(bytes / strikeDamage(dwarfLevel, curve) - 1e-9)) * curve.strikeSeconds;
}

/** Seconds for a dwarf of level d to dig a rock of level r on its own. */
export function digSeconds(dwarfLevel: number, rockLevel: number, curve: DigCurve = DIG_CURVE): number {
  return secondsToDig(dwarfLevel, rockSize(rockLevel, curve), curve);
}

// ── Grid movement ─────────────────────────────────────────────────────────────
export type Direction = 'up' | 'left' | 'down' | 'right';

/** Seconds of game time for a dwarf to walk one cell. */
export const WALK_SECONDS = 0.333;

/**
 * The order an idle dwarf checks its neighbors for the next rock to mine.
 * Odd-level dwarves go W, A, S, D (up, left, down, right); even-level dwarves go D, S, A, W.
 */
export function mineOrder(dwarfLevel: number): readonly Direction[] {
  return dwarfLevel % 2 === 1 ? ['up', 'left', 'down', 'right'] : ['right', 'down', 'left', 'up'];
}

/** Index of the orthogonal neighbor in `dir`, or null off the edge. Diagonals don't exist. */
export function neighbor(index: number, dir: Direction, width: number, height: number): number | null {
  const x = index % width;
  const y = Math.floor(index / width);
  const [nx, ny] = dir === 'up' ? [x, y - 1] : dir === 'down' ? [x, y + 1] : dir === 'left' ? [x - 1, y] : [x + 1, y];
  return nx >= 0 && nx < width && ny >= 0 && ny < height ? ny * width + nx : null;
}

export function areAdjacent(a: number, b: number, width: number): boolean {
  const dx = Math.abs((a % width) - (b % width));
  const dy = Math.abs(Math.floor(a / width) - Math.floor(b / width));
  return dx + dy === 1;
}
