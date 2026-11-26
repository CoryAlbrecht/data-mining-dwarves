import { bufferCap, getDeviceModel, MONSTERS, secondsToDig, type Block } from '@dmd/shared';
import { EXIT, levelIn, type Dwarf, type LevelState } from '../state/world.ts';
import { formatBytes, formatDuration } from './format.ts';
import { deviceLabels, labelCell, portLabels, type PortLabel } from './labels.ts';

/**
 * The rest of the world a cell's look depends on, passed in so the cell-view functions stay pure.
 */
export interface ViewContext {
  dwarves: readonly Dwarf[];
  /** Level of each Device model (models not listed are Level 1). */
  deviceLevels: Readonly<Record<string, number>>;
}

/**
 * What to draw in one Mine cell or one port cell of the top Wall. The grid renders only this:
 * glyph and corner marks, label text, Device fill and the dig bar all come from here.
 */
export interface CellView {
  glyph: string;
  /** Small number or mark in the bottom-right corner, if any. */
  tiny: string | number | null;
  /** Hover text; '' for none. */
  title: string;
  classes: string[];
  /** The dwarf standing on the cell; when set, the grid draws it instead of glyph and tiny. */
  dwarf?: Dwarf;
  /** Label text drawn in place of the glyph (a dug-out port's cells). */
  label?: PortLabel;
  /** Small mark in the top-right corner (⇅ on a port with duplex). */
  corner?: string;
  /** How much of this cell a producing Device's Buffer level covers, bottom up: 0..1. */
  fill?: number;
  /** Dig bar: the fraction (remaining / size) left of what's being dug; set only while a dwarf digs it. */
  digBar?: number;
}

/** Pick a wear glyph: untouched → nearly dug out. */
function worn(glyphs: readonly string[], remaining: number, size: number): string {
  const used = 1 - remaining / size;
  return glyphs[Math.min(glyphs.length - 1, Math.floor(used * glyphs.length))]!;
}

/** Whether any dwarf in this Mine is digging a target that `hit` accepts (a cell number or EXIT). */
const beingDug = (lvl: LevelState, ctx: ViewContext, hit: (target: number) => boolean) =>
  ctx.dwarves.some((d) => d.depth === lvl.def.depth && d.target !== null && hit(d.target));

/** How to draw Mine cell `i`. */
export function cellView(lvl: LevelState, i: number, ctx: ViewContext): CellView {
  const depth = lvl.def.depth;
  const g = lvl.def.theme.glyphs;
  const b = lvl.blocks.value[i]!;
  const dwarf = ctx.dwarves.find((d) => d.depth === depth && d.pos === i);
  const v: CellView = { glyph: '', tiny: null, title: '', classes: ['cell', `cell-${b.kind}`] };
  if (dwarf) v.dwarf = dwarf;
  if (lvl.exposed.value.has(i) || b.kind === 'empty' || b.kind === 'item') v.classes.push('cell-lit');

  switch (b.kind) {
    case 'empty':
      break;
    case 'item':
      v.glyph = g.item;
      v.title = b.loot.kind === 'bytes' ? `${formatBytes(b.loot.amount)}: walk onto it to pick it up` : 'A chip: walk onto it to pick it up';
      break;
    case 'rock':
      v.glyph = worn(b.encrypted ? g.encrypted : g.rock, b.remaining, b.size);
      v.tiny = b.level;
      if (beingDug(lvl, ctx, (t) => t === i)) v.digBar = b.remaining / b.size;
      v.title = `${b.encrypted ? 'Encrypted bit-rock' : 'Bit-rock'}, Level ${b.level}: ${formatBytes(b.remaining)} left (${formatDuration(secondsToDig(1, b.remaining))} for one L1 dwarf)`;
      break;
    case 'monster':
      v.glyph = MONSTERS[b.monster].glyph;
      v.tiny = b.hp;
      v.title = `${MONSTERS[b.monster].name}: ${MONSTERS[b.monster].pun} Tap to fight.`;
      break;
    case 'device':
      deviceCell(lvl, b, ctx, v, i);
      break;
  }
  return v;
}

function deviceCell(lvl: LevelState, b: Extract<Block, { kind: 'device' }>, ctx: ViewContext, v: CellView, i: number): void {
  const g = lvl.def.theme.glyphs;
  const def = lvl.def.devices[b.device]!;
  const state = lvl.devices.value[b.device]!;
  if (state.buried) {
    v.glyph = worn(g.rock, state.remaining, def.size);
    if (b.role === 'upgrade') v.tiny = def.level;
    v.title = `Buried hardware, Level ${def.level}: ${formatBytes(state.remaining)} left`;
    v.classes.push('cell-buried');
    // The whole Device's bar shows on every one of its cells when a dwarf digs any of them.
    const ofThisDevice = (t: number) => {
      const c = lvl.blocks.value[t];
      return c?.kind === 'device' && c.device === b.device;
    };
    if (beingDug(lvl, ctx, ofThisDevice)) v.digBar = state.remaining / def.size;
    return;
  }
  v.classes.push('cell-hardware');
  const model = getDeviceModel(def.model);
  const level = levelIn(ctx.deviceLevels, def.model);
  const buffer = lvl.buffers.value[b.device] ?? 0;
  const cap = bufferCap(model, level);
  if (model.kind !== 'forge') v.fill = fillShare(lvl, def, i, buffer / cap);
  if (b.role === 'collect') {
    if (model.kind === 'forge') v.glyph = g.spawn;
    else {
      const full = buffer >= cap - 1e-6;
      const auto = lvl.automated.value.includes(b.device);
      v.glyph = g.collect;
      if (full && !auto) v.classes.push('cell-full');
      if (auto) v.tiny = '⟳';
    }
    v.title = model.kind === 'forge' ? 'Spawn a dwarf' : `Collect ${formatBytes(buffer)}`;
  } else if (b.role === 'upgrade') {
    v.glyph = g.upgrade;
    v.tiny = level;
    v.title = `Upgrade ${model.name} (Level ${level})`;
  } else {
    const n = lvl.blocks.value.filter((c) => c.kind === 'device' && c.device === b.device && c.role === 'label').length;
    v.glyph = deviceLabels(def.model, n)[b.label] ?? '';
    v.classes.push('cell-label');
    v.title = `${model.name}: tap for details`;
  }
}

/**
 * The share of cell `i` that a Device's Buffer level covers. The level (`full`, clamped to 0..1)
 * rises across the Device's whole footprint like a tank, bottom row first, so a cell's share comes
 * from its row's place inside the Device and can be partial.
 */
function fillShare(lvl: LevelState, def: { y: number; h: number }, i: number, full: number): number {
  const rowsBelow = def.y + def.h - 1 - Math.floor(i / lvl.def.width);
  return Math.min(1, Math.max(0, full * def.h - rowsBelow));
}

/** How to draw the port's cell at column `x` of the top Wall (x is inside the port's stretch). */
export function portView(lvl: LevelState, x: number, ctx: ViewContext): CellView {
  const { def } = lvl;
  const g = def.theme.glyphs;
  const exit = lvl.exit.value;
  const rubble = exit.buried ? ` ${formatBytes(exit.remaining)} of rock in the way` : '';
  const title =
    def.exit.kind === 'usb'
      ? `USB port:${rubble || ' walk a dwarf under it to sneakernet'}`
      : `Network port${rubble && `:${rubble}`}`;
  const classes = ['wall', 'wall-port'];
  if (!exit.buried) classes.push('wall-port-open');
  const v: CellView = {
    glyph: exit.buried ? worn([g.portBuried, g.portBuried, g.portBuried], exit.remaining, def.exit.size) : g.portOpen,
    tiny: null,
    title,
    classes,
  };
  if (exit.buried && beingDug(lvl, ctx, (t) => t === EXIT)) v.digBar = exit.remaining / def.exit.size;
  if (!exit.buried) portLabel(lvl, x - def.exit.x, v);
  return v;
}

/** A dug-out port's label text (and duplex mark) for its cell `k` from the left. */
function portLabel(lvl: LevelState, k: number, v: CellView): void {
  const { exit } = lvl.def;
  const port = lvl.port.value;
  v.glyph = '';
  if (exit.kind === 'usb') {
    v.label = k === 0 ? labelCell(false, 'USB') : labelCell(false);
    return;
  }
  v.label = portLabels(port, exit.width)[k] ?? labelCell(false);
  if (k === 0 && port.duplex) v.corner = '⇅';
}
