import { bufferCap, getDeviceModel, MONSTERS, secondsToDig, type Block } from '@dmd/shared';
import { deviceLabels } from '../components/hardware.ts';
import { EXIT, type DialogSubject, type Dwarf, type LevelState } from '../state/world.ts';
import { formatBytes, formatDuration } from './format.ts';

/**
 * The rest of the world a cell's look depends on, passed in so the cell-view functions stay pure.
 * `frame` is only for frame-driven animation (the full-Buffer glyph swap); nothing else reads it.
 */
export interface ViewContext {
  dwarves: readonly Dwarf[];
  /** Level of each Device model (models not listed are Level 1). */
  deviceLevels: Readonly<Record<string, number>>;
  /** The open dialog, if any. */
  dialog: DialogSubject | null;
  frame: number;
}

/**
 * What to draw in one Mine cell or one port cell of the top Wall. The grid renders only this.
 * Later display additions (dig-bar fraction, Device fill, label text, corner mark) join here.
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

const levelOf = (ctx: ViewContext, model: string) => ctx.deviceLevels[model] ?? 1;

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
      deviceCell(lvl, b, ctx, v);
      break;
  }
  return v;
}

function deviceCell(lvl: LevelState, b: Extract<Block, { kind: 'device' }>, ctx: ViewContext, v: CellView): void {
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
  const level = levelOf(ctx, def.model);
  if (b.role === 'collect') {
    if (model.kind === 'forge') v.glyph = g.spawn;
    else {
      const full = (lvl.buffers.value[b.device] ?? 0) >= bufferCap(model, level) - 1e-6;
      const auto = lvl.automated.value.includes(b.device);
      v.glyph = full && !auto ? g.collectFull[Math.floor(ctx.frame / 4) % g.collectFull.length]! : g.collect;
      if (full && !auto) v.classes.push('cell-full');
      if (auto) v.tiny = '⟳';
    }
    v.title = model.kind === 'forge' ? 'Spawn a dwarf' : `Collect ${formatBytes(lvl.buffers.value[b.device] ?? 0)}`;
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
  const open = ctx.dialog;
  if (open?.kind === 'device' && open.depth === lvl.def.depth && open.device === b.device) v.classes.push('cell-selected');
}

/** How to draw the port's cell at column `x` of the top Wall (x is inside the port's stretch). */
export function portView(lvl: LevelState, _x: number, ctx: ViewContext): CellView {
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
  if (ctx.dialog?.kind === 'port' && ctx.dialog.depth === def.depth) classes.push('wall-selected');
  const v: CellView = {
    glyph: exit.buried ? worn([g.portBuried, g.portBuried, g.portBuried], exit.remaining, def.exit.size) : g.portOpen,
    tiny: null,
    title,
    classes,
  };
  if (exit.buried && beingDug(lvl, ctx, (t) => t === EXIT)) v.digBar = exit.remaining / def.exit.size;
  return v;
}
