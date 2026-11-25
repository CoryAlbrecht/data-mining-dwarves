import { batch } from '@preact/signals-react';
import { CLOCK, DIG_CURVE, mineOrder, neighbor, strikeDamage, WALK_SECONDS } from '@dmd/shared';
import { dig, produceFor, reachGoal, updateDwarf, walkStep } from './actions.ts';
import { walkHeldKey } from './keyboard.ts';
import { dwarves, EXIT, isMinable, levelAt, levels, underExit, type Dwarf, type LevelState } from './world.ts';

const TICK_MS = 100;

/** Dev-only fast-forward for playtesting and balancing: http://localhost:5173/?speed=20 */
const SPEED =
  import.meta.env.DEV && typeof location !== 'undefined'
    ? Number(new URLSearchParams(location.search).get('speed')) || 1
    : 1;

// Per-dwarf timers are transient (not game state), so they live outside signals.
const walkClock = new Map<number, number>();
const strikeClock = new Map<number, { target: number; t: number }>();

/** Is `target` something this dwarf can mine from where it stands? */
function validTarget(lvl: LevelState, d: Dwarf, target: number): boolean {
  if (target === EXIT) return underExit(lvl.def, d.pos) && lvl.exit.value.buried;
  const { width, height } = lvl.def;
  const adjacent = (['up', 'left', 'down', 'right'] as const).some((dir) => neighbor(d.pos, dir, width, height) === target);
  return adjacent && isMinable(lvl, target);
}

/** Key for "the same thing being dug": a rock cell, a whole Device, or the port. */
function digKey(lvl: LevelState, target: number): string {
  if (target === EXIT) return 'exit';
  const b = lvl.blocks.value[target];
  return b?.kind === 'device' ? `d${b.device}` : `c${target}`;
}

/** Advance the game by `dt` seconds. */
export function tick(dt: number) {
  batch(() => {
    produceFor(dt);

    // 1. Walk: a held direction key, then dragged paths, one cell per WALK_SECONDS.
    walkHeldKey(dt);
    for (const d of dwarves.value.filter((x) => x.path.length > 0)) {
      let t = (walkClock.get(d.id) ?? 0) + dt;
      while (t >= WALK_SECONDS) {
        t -= WALK_SECONDS;
        if (!walkStep(d.id)) break;
        const after = dwarves.value.find((x) => x.id === d.id);
        if (!after) break; // merged away
        if (after.path.length === 0) {
          reachGoal(d.id);
          break;
        }
      }
      walkClock.set(d.id, t);
    }

    // 2. Idle dwarves start on the next thing next to them: odd Levels check W,A,S,D; even D,S,A,W.
    //    "Up" from the top row under the port means the port. They never walk or pick things up.
    for (const d of dwarves.value) {
      const lvl = levelAt(d.depth);
      if (!lvl || d.path.length > 0) continue;
      if (d.target !== null && validTarget(lvl, d, d.target)) continue;
      const { width, height } = lvl.def;
      let next: number | null = null;
      for (const dir of mineOrder(d.level)) {
        const n = neighbor(d.pos, dir, width, height);
        if (n === null && dir === 'up' && validTarget(lvl, d, EXIT)) next = EXIT;
        else if (n !== null && isMinable(lvl, n)) next = n;
        if (next !== null) break;
      }
      if (next !== d.target) updateDwarf(d.id, { target: next });
    }

    // 3. Strike. Each dwarf removes strikeDamage(Level) bytes per strike. Everyone touching the
    //    same rock, Device or port adds up.
    for (const lvl of levels.value) {
      const here = dwarves.value.filter((d) => d.depth === lvl.def.depth && d.target !== null);
      if (here.length === 0) continue;
      const damage = new Map<string, { target: number; amount: number }>();
      for (const d of here) {
        const clock = strikeClock.get(d.id);
        const t = (clock && clock.target === d.target ? clock.t : 0) + dt;
        const strikes = Math.floor(t / DIG_CURVE.strikeSeconds);
        strikeClock.set(d.id, { target: d.target!, t: t - strikes * DIG_CURVE.strikeSeconds });
        if (strikes === 0) continue;
        const key = digKey(lvl, d.target!);
        const prev = damage.get(key);
        damage.set(key, { target: d.target!, amount: (prev?.amount ?? 0) + strikes * strikeDamage(d.level) });
      }
      for (const { target, amount } of damage.values()) dig(lvl, target, amount);
    }
  });
}

/** Start the game clock. Returns a stop function. */
export function startLoop(): () => void {
  let last = performance.now();
  const id = setInterval(() => {
    const now = performance.now();
    // Cap catch-up after a backgrounded tab; offline time is credited separately.
    tick(Math.min(CLOCK.maxCatchUpSeconds, (now - last) / 1000) * SPEED);
    last = now;
  }, TICK_MS);
  return () => clearInterval(id);
}
