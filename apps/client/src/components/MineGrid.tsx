import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { bufferCap, getDeviceModel, MONSTERS, secondsToDig, type Block, type LevelGlyphs } from '@dmd/shared';
import { formatBytes, formatDuration } from '../game/format.ts';
import { tapCell, tapExit } from '../state/actions.ts';
import { frame } from '../state/clock.ts';
import { dwarfAt, levelOf, dialogSubject, type LevelState } from '../state/world.ts';
import { DwarfToken } from './DwarfToken.tsx';
import { deviceLabels } from './hardware.ts';

/** Pick a wear glyph: untouched → nearly dug out. */
function worn(glyphs: string[], remaining: number, size: number): string {
  const used = 1 - remaining / size;
  return glyphs[Math.min(glyphs.length - 1, Math.floor(used * glyphs.length))]!;
}

function Wall({ glyph, className = '', ...rest }: { glyph: string } & HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`wall ${className}`} {...rest}>
      <span className="glyph">{glyph}</span>
    </div>
  );
}

/** One Mine: the grid of cells framed by its Wall, with the port above and the Entry below. */
export function MineGrid({ lvl }: { lvl: LevelState }) {
  const { def } = lvl;
  const { width, height, depth } = def;
  const g = def.theme.glyphs;
  const f = frame.value;
  const exit = lvl.exit.value;
  const inPort = (x: number) => x >= def.exit.x && x < def.exit.x + def.exit.width;
  const labelsFor = new Map<number, string[]>();

  const cells: ReactNode[] = [];

  // ── Top Wall, with the port's stretch ──
  const portGlyph = exit.buried ? worn([g.portBuried, g.portBuried, g.portBuried], exit.remaining, def.exit.size) : g.portOpen;
  const portTitle =
    def.exit.kind === 'usb'
      ? `USB port${exit.buried ? `: ${formatBytes(exit.remaining)} of rock in the way` : ': walk a dwarf under it to sneakernet'}`
      : `Network port${exit.buried ? `: ${formatBytes(exit.remaining)} of rock in the way` : ''}`;
  for (let x = -1; x <= width; x++) {
    let glyph = x === -1 ? g.wall.tl : x === width ? g.wall.tr : g.wall.h;
    if (x === def.exit.x - 1) glyph = g.gapL;
    if (x === def.exit.x + def.exit.width) glyph = g.gapR;
    if (x >= 0 && x < width && inPort(x)) {
      cells.push(
        <Wall
          key={`t${x}`}
          glyph={portGlyph}
          className={`wall-port${exit.buried ? '' : ' wall-port-open'}${dialogSubject.value?.kind === 'port' && dialogSubject.value.depth === depth ? ' wall-selected' : ''}`}
          title={portTitle}
          data-depth={depth}
          data-exit=""
          onClick={() => tapExit(depth)}
        />,
      );
    } else {
      cells.push(<Wall key={`t${x}`} glyph={glyph} />);
    }
  }

  // ── Rows ──
  for (let y = 0; y < height; y++) {
    cells.push(<Wall key={`l${y}`} glyph={g.wall.v} />);
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      cells.push(<Cell key={i} lvl={lvl} i={i} glyphs={g} f={f} labelsFor={labelsFor} />);
    }
    cells.push(<Wall key={`r${y}`} glyph={g.wall.v} />);
  }

  // ── Bottom Wall, with the Entry ──
  for (let x = -1; x <= width; x++) {
    let glyph = x === -1 ? g.wall.bl : x === width ? g.wall.br : g.wall.h;
    if (x === def.entry - 1) glyph = g.gapL;
    if (x === def.entry + 1) glyph = g.gapR;
    if (x === def.entry) glyph = ' ';
    cells.push(<Wall key={`b${x}`} glyph={glyph} className={x === def.entry ? 'wall-entry' : ''} title={x === def.entry ? 'Entry' : undefined} />);
  }

  return (
    <div className="mine-grid" style={{ '--cols': width + 2 } as CSSProperties}>
      {cells}
    </div>
  );
}

function Cell({
  lvl,
  i,
  glyphs: g,
  f,
  labelsFor,
}: {
  lvl: LevelState;
  i: number;
  glyphs: LevelGlyphs;
  f: number;
  labelsFor: Map<number, string[]>;
}) {
  const depth = lvl.def.depth;
  const b = lvl.blocks.value[i]!;
  const dwarf = dwarfAt(depth, i);
  let glyph = '';
  let tiny: string | number | null = null;
  let title = '';
  const classes = ['cell', `cell-${b.kind}`];
  if (lvl.exposed.value.has(i) || b.kind === 'empty' || b.kind === 'item') classes.push('cell-lit');

  switch (b.kind) {
    case 'empty':
      break;
    case 'item':
      glyph = g.item;
      title = b.loot.kind === 'bytes' ? `${formatBytes(b.loot.amount)}: walk onto it to pick it up` : 'A chip: walk onto it to pick it up';
      break;
    case 'rock':
      glyph = worn(b.encrypted ? g.encrypted : g.rock, b.remaining, b.size);
      tiny = b.level;
      title = `${b.encrypted ? 'Encrypted bit-rock' : 'Bit-rock'}, Level ${b.level}: ${formatBytes(b.remaining)} left (${formatDuration(secondsToDig(1, b.remaining))} for one L1 dwarf)`;
      break;
    case 'monster':
      glyph = MONSTERS[b.monster].glyph;
      tiny = b.hp;
      title = `${MONSTERS[b.monster].name}: ${MONSTERS[b.monster].pun} Tap to fight.`;
      break;
    case 'device': {
      const def = lvl.def.devices[b.device]!;
      const state = lvl.devices.value[b.device]!;
      if (state.buried) {
        glyph = worn(g.rock, state.remaining, def.size);
        if (b.role === 'upgrade') tiny = def.level;
        title = `Buried hardware, Level ${def.level}: ${formatBytes(state.remaining)} left`;
        classes.push('cell-buried');
        break;
      }
      classes.push('cell-hardware');
      const model = getDeviceModel(def.model);
      const level = levelOf(def.model);
      if (b.role === 'collect') {
        if (model.kind === 'forge') glyph = g.spawn;
        else {
          const full = (lvl.buffers.value[b.device] ?? 0) >= bufferCap(model, level) - 1e-6;
          const auto = lvl.automated.value.includes(b.device);
          glyph = full && !auto ? g.collectFull[Math.floor(f / 4) % g.collectFull.length]! : g.collect;
          if (full && !auto) classes.push('cell-full');
          if (auto) tiny = '⟳';
        }
        title = model.kind === 'forge' ? 'Spawn a dwarf' : `Collect ${formatBytes(lvl.buffers.value[b.device] ?? 0)}`;
      } else if (b.role === 'upgrade') {
        glyph = g.upgrade;
        tiny = level;
        title = `Upgrade ${model.name} (Level ${level})`;
      } else {
        if (!labelsFor.has(b.device)) {
          const n = lvl.blocks.value.filter((c) => c.kind === 'device' && c.device === b.device && c.role === 'label').length;
          labelsFor.set(b.device, deviceLabels(def.model, n));
        }
        glyph = labelsFor.get(b.device)![b.label] ?? '';
        classes.push('cell-label');
        title = `${model.name}: tap for details`;
      }
      const open = dialogSubject.value;
      if (open?.kind === 'device' && open.depth === depth && open.device === b.device) classes.push('cell-selected');
      break;
    }
  }

  return (
    <div
      role="gridcell"
      data-depth={depth}
      data-cell={i}
      className={classes.join(' ')}
      title={title || undefined}
      onClick={() => tapCell(depth, i)}
    >
      {dwarf ? (
        <DwarfToken d={dwarf} frames={g.dwarf} f={f} />
      ) : (
        <>
          <span className="glyph">{glyph}</span>
          {tiny !== null && <small className="tiny">{tiny}</small>}
        </>
      )}
    </div>
  );
}

