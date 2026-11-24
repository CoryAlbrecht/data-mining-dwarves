/**
 * Bit-rocks have a size in bytes; each strike of a dwarf's pick removes some of it.
 *
 *   rockSize(r)       = 120 B · 1.6^(r−1)          (r = rock "level", only used to generate sizes)
 *   strikeDamage(d)   = 4 B · 1.5^(d−1)            (d = dwarf level, one strike per second)
 *   seconds to dig    = ceil(size / damage) strikes
 *
 * That gives: L1 dwarf vs 120 B (L1) rock = 30 s; L2 dwarf vs L1 rock = 20 s (faster, but not
 * twice as fast); L2 vs L2 (192 B) = 32 s; equal matchups keep slowly getting longer, because
 * ROCK_GROWTH > DWARF_GROWTH.
 *
 * Up to 4 dwarves can strike the same rock at once (one from each orthogonal side).
 */
export const DIG_CURVE = {
  baseRockSize: 120,
  baseSeconds: 30,
  rockGrowth: 1.6,
  dwarfGrowth: 1.5,
  strikeSeconds: 1,
} as const;

export function rockSize(rockLevel: number): number {
  return Math.round(DIG_CURVE.baseRockSize * DIG_CURVE.rockGrowth ** (rockLevel - 1));
}

/** Bytes removed by one strike. */
export function strikeDamage(dwarfLevel: number): number {
  const base = (DIG_CURVE.baseRockSize / DIG_CURVE.baseSeconds) * DIG_CURVE.strikeSeconds;
  return base * DIG_CURVE.dwarfGrowth ** (dwarfLevel - 1);
}

/** Seconds for one dwarf to dig out `bytes` of rock. */
export function secondsToDig(dwarfLevel: number, bytes: number): number {
  return Math.max(1, Math.ceil(bytes / strikeDamage(dwarfLevel) - 1e-9)) * DIG_CURVE.strikeSeconds;
}

/** Seconds for a dwarf of level d to dig a rock of level r on its own. */
export function digSeconds(dwarfLevel: number, rockLevel: number): number {
  return secondsToDig(dwarfLevel, rockSize(rockLevel));
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
