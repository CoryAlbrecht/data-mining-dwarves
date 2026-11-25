/**
 * Game state lives in module-level signals, not component state.
 *
 * Rules of thumb for this codebase:
 *  - State = `signal()`. Derived values = `computed()`. Never mirror one signal into another.
 *  - Mutations go through action functions (state/actions.ts); wrap multi-signal updates in `batch()`.
 *  - Components just read `.value`; the signals Babel transform subscribes them automatically.
 *  - Side effects (timers, persistence) live in state/ modules, not in useEffect.
 *
 * Each Mine in the Chain owns its own signals (LevelState), so a change in one Mine only
 * re-renders that Mine. Terms follow GLOSSARY.md.
 */
import { computed, signal, type ReadonlySignal, type Signal } from '@preact/signals-react';
import {
  deviceRate,
  getDeviceModel,
  startTech,
  type Block,
  type DeviceDef,
  type LevelDef,
  type PortState,
} from '@dmd/shared';

/** Target value meaning "the port in the top Wall" rather than a cell. */
export const EXIT = -1;

export interface Dwarf {
  id: number;
  level: number;
  /** Depth of the Mine this dwarf is in. */
  depth: number;
  /** Cell the dwarf stands on. One dwarf per cell. */
  pos: number;
  /** What it's mining: an adjacent cell, EXIT (the port above the top row), or null. */
  target: number | null;
  /** Cells still to walk through (from a drag), in order. */
  path: number[];
  /** What to mine once the path is walked: a cell, EXIT, or null. */
  goal: number | null;
}

/** The changing part of a Device or port: is it still buried, and how much is left to dig. */
export interface DigState {
  buried: boolean;
  remaining: number;
}

export interface LevelState {
  def: LevelDef;
  blocks: Signal<Block[]>;
  /** Indexed by Device id. */
  devices: Signal<DigState[]>;
  exit: Signal<DigState>;
  /** Uncollected bytes, indexed by Device id. */
  buffers: Signal<number[]>;
  /** Device ids with a cron job (they collect their own bytes). */
  automated: Signal<number[]>;
  port: Signal<PortState>;
  /** Cells next to a hole or item: the ones a dwarf could be standing beside. */
  exposed: ReadonlySignal<Set<number>>;
}

export interface SavedLevel {
  depth: number;
  blocks: Block[];
  devices: DigState[];
  exit: DigState;
  buffers: number[];
  automated: number[];
  port: PortState;
}

// ── Core state ────────────────────────────────────────────────────────────────
export const bytes = signal(0);
export const lifetimeBytes = signal(0);
/** The current Computer's Chain, oldest Mine first. Look Mines up with levelAt(depth). */
export const levels = signal<LevelState[]>([]);
export const dwarves = signal<Dwarf[]>([]);
/** How many dwarves have been bought from fork(); each costs more than the last. */
export const dwarvesBought = signal(0);
/** Chip counts by chip id. */
export const inventory = signal<Record<string, number>>({});
/** Level of each Device model (shared by every Device of that model). */
export const deviceLevels = signal<Record<string, number>>({});
/** The dwarf keyboard moves apply to (follows focus / tap). */
export const selectedDwarf = signal<number | null>(null);
/** What a dialog over the page is showing: one Device's or one port's details. */
export type DialogSubject = { kind: 'device'; depth: number; device: number } | { kind: 'port'; depth: number };
/** The one open dialog, if any. */
export const dialogSubject = signal<DialogSubject | null>(null);
/** A dwarf being dragged with mouse or touch, and where the pointer is. */
export const drag = signal<{ id: number; x: number; y: number } | null>(null);
export const message = signal<string | null>(null);
export const loading = signal(false);

// ── Lookups ───────────────────────────────────────────────────────────────────
export function levelAt(depth: number): LevelState | undefined {
  const first = levels.value[0]?.def.depth;
  return first === undefined ? undefined : levels.value[depth - first];
}

/** Holes and items are walkable. Devices are solid, even once uncovered. */
export function isWalkable(b: Block | undefined): boolean {
  return !!b && (b.kind === 'empty' || b.kind === 'item');
}

/** Can a dwarf mine this cell? Rocks, and cells of a still-buried Device. */
export function isMinable(lvl: LevelState, i: number): boolean {
  const b = lvl.blocks.value[i];
  if (b?.kind === 'rock') return true;
  return b?.kind === 'device' && (lvl.devices.value[b.device]?.buried ?? false);
}

export function levelOf(model: string): number {
  return deviceLevels.value[model] ?? 1;
}

/** Cell just inside the Entry, where dwarves arrive. */
export function arrivalCell(def: LevelDef): number {
  return (def.height - 1) * def.width + def.entry;
}

/** Is cell i in the top row, directly under the port's stretch of Wall? */
export function underExit(def: LevelDef, i: number): boolean {
  const x = i % def.width;
  return i < def.width && x >= def.exit.x && x < def.exit.x + def.exit.width;
}

export function deviceDef(lvl: LevelState, id: number): DeviceDef {
  return lvl.def.devices[id]!;
}

export function makeLevelState(def: LevelDef, saved?: SavedLevel): LevelState {
  const n = def.blocks.length;
  const fits = <T,>(xs: T[] | undefined, len: number): xs is T[] => xs?.length === len;
  const blocks = signal(fits(saved?.blocks, n) ? saved.blocks : def.blocks);
  const nd = def.devices.length;
  const exposed = computed(() => {
    const bs = blocks.value;
    const { width, height } = def;
    const out = new Set<number>();
    bs.forEach((b, i) => {
      if (isWalkable(b)) return;
      const x = i % width;
      const y = Math.floor(i / width);
      const open = (nx: number, ny: number) =>
        nx >= 0 && nx < width && ny >= 0 && ny < height && isWalkable(bs[ny * width + nx]);
      if (open(x - 1, y) || open(x + 1, y) || open(x, y - 1) || open(x, y + 1)) out.add(i);
    });
    return out;
  });
  return {
    def,
    blocks,
    devices: signal(
      fits(saved?.devices, nd) ? saved.devices : def.devices.map((d) => ({ buried: d.buried, remaining: d.size })),
    ),
    exit: signal(saved?.exit ?? { buried: true, remaining: def.exit.size }),
    buffers: signal(fits(saved?.buffers, nd) ? saved.buffers : Array<number>(nd).fill(0)),
    automated: signal(saved?.automated ?? []),
    port: signal(saved?.port ?? { tech: startTech(def.computer), level: 1, duplex: false, passed: 0 }),
    exposed,
  };
}

// ── Derived state ─────────────────────────────────────────────────────────────
/** Total bytes/second from every uncovered producing Device in the Chain. */
export const totalRate = computed(() => {
  let sum = 0;
  for (const lvl of levels.value) {
    lvl.def.devices.forEach((d, id) => {
      if (!lvl.devices.value[id]?.buried) sum += deviceRate(getDeviceModel(d.model), levelOf(d.model));
    });
  }
  return sum;
});

/** Dwarf standing on each cell, keyed "depth:pos". */
export const occupancy = computed(() => {
  const map = new Map<string, Dwarf>();
  for (const d of dwarves.value) map.set(`${d.depth}:${d.pos}`, d);
  return map;
});

export function dwarfAt(depth: number, pos: number): Dwarf | undefined {
  return occupancy.value.get(`${depth}:${pos}`);
}
