import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { cellView, portView, type CellView, type ViewContext } from '../game/cellView.ts';
import { tapCell, tapExit } from '../state/actions.ts';
import { frame } from '../state/clock.ts';
import { deviceLevels, dwarves, type LevelState } from '../state/world.ts';
import { DwarfToken } from './DwarfToken.tsx';

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
  const ctx: ViewContext = { dwarves: dwarves.value, deviceLevels: deviceLevels.value, frame: frame.value };
  const inPort = (x: number) => x >= def.exit.x && x < def.exit.x + def.exit.width;

  const cells: ReactNode[] = [];

  // ── Top Wall, with the port's stretch ──
  for (let x = -1; x <= width; x++) {
    let glyph = x === -1 ? g.wall.tl : x === width ? g.wall.tr : g.wall.h;
    if (x === def.exit.x - 1) glyph = g.gapL;
    if (x === def.exit.x + def.exit.width) glyph = g.gapR;
    if (x >= 0 && x < width && inPort(x)) {
      const v = portView(lvl, x, ctx);
      cells.push(
        <div key={`t${x}`} className={v.classes.join(' ')} title={v.title || undefined} data-depth={depth} data-exit="" onClick={() => tapExit(depth)}>
          {v.label === undefined ? <span className="glyph">{v.glyph}</span> : (
            <span className="glyph port-label" style={{ '--chars': Math.max(4, v.label.length) } as CSSProperties}>
              {v.label}
            </span>
          )}
          {v.corner && <span className="corner">{v.corner}</span>}
          <DigBar v={v} />
        </div>,
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
      cells.push(<Cell key={i} lvl={lvl} i={i} ctx={ctx} />);
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

/** One Mine cell: draws what cellView() says, or the dwarf standing on it. */
function Cell({ lvl, i, ctx }: { lvl: LevelState; i: number; ctx: ViewContext }) {
  const v = cellView(lvl, i, ctx);
  const depth = lvl.def.depth;
  return (
    <div
      role="gridcell"
      data-depth={depth}
      data-cell={i}
      className={v.classes.join(' ')}
      style={v.fill === undefined ? undefined : ({ '--fill': v.fill } as CSSProperties)}
      title={v.title || undefined}
      onClick={() => tapCell(depth, i)}
    >
      {v.dwarf ? (
        <DwarfToken d={v.dwarf} frames={lvl.def.theme.glyphs.dwarf} f={ctx.frame} />
      ) : (
        <>
          <span className="glyph">{v.glyph}</span>
          {v.tiny !== null && <small className="tiny">{v.tiny}</small>}
        </>
      )}
      <DigBar v={v} />
    </div>
  );
}

/** The dig bar along the top edge of a cell being dug, its width the fraction left. */
function DigBar({ v }: { v: CellView }) {
  return v.digBar === undefined ? null : <span className="dig-bar" style={{ width: `${v.digBar * 100}%` }} />;
}
