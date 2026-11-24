import type { KeyboardEvent, PointerEvent } from 'react';
import type { Direction } from '@dmd/shared';
import { moveDwarf, useAdjacentDevice, walkTo } from '../state/actions.ts';
import { drag, EXIT, selectedDwarf, type Dwarf } from '../state/world.ts';

const KEYS: Record<string, Direction> = {
  w: 'up', a: 'left', s: 'down', d: 'right',
  ArrowUp: 'up', ArrowLeft: 'left', ArrowDown: 'down', ArrowRight: 'right',
};

/** Pixels the pointer must travel before a press becomes a drag (otherwise it's a tap/select). */
const DRAG_THRESHOLD = 6;

/** Find the Mine cell (or the port's stretch of Wall) under a screen point. */
function cellAt(x: number, y: number): { depth: number; cell: number } | null {
  const el = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-cell], [data-exit]');
  if (!el) return null;
  return { depth: Number(el.dataset.depth), cell: el.dataset.exit !== undefined ? EXIT : Number(el.dataset.cell) };
}

// Pointer bookkeeping for the drag in progress. Not game state, so not a signal.
let press: { id: number; x0: number; y0: number; dragging: boolean } | null = null;

function onPointerDown(e: PointerEvent<HTMLButtonElement>, d: Dwarf) {
  e.currentTarget.setPointerCapture(e.pointerId);
  press = { id: d.id, x0: e.clientX, y0: e.clientY, dragging: false };
}

function onPointerMove(e: PointerEvent<HTMLButtonElement>) {
  if (!press) return;
  if (!press.dragging && Math.hypot(e.clientX - press.x0, e.clientY - press.y0) < DRAG_THRESHOLD) return;
  press.dragging = true;
  drag.value = { id: press.id, x: e.clientX, y: e.clientY };
}

function onPointerUp(e: PointerEvent<HTMLButtonElement>) {
  const p = press;
  press = null;
  drag.value = null;
  if (!p?.dragging) return; // a plain tap: focus/selection already happened
  const hit = cellAt(e.clientX, e.clientY);
  if (hit) walkTo(p.id, hit.depth, hit.cell);
}

function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, d: Dwarf) {
  const dir = KEYS[e.key] ?? KEYS[e.key.toLowerCase()];
  if (dir) {
    e.preventDefault(); // arrows would scroll the page
    moveDwarf(d.id, dir);
    return;
  }
  // E: collect from (or use) a Device next to this dwarf.
  if (e.key.toLowerCase() === 'e') {
    e.preventDefault();
    useAdjacentDevice(d.id);
  }
}

/**
 * A dwarf standing on a cell, drawn as a glyph that dances through the Theme's frames while it
 * mines. Tab/Shift+Tab move focus between dwarves; WASD/arrows move the focused one; E uses a
 * Device next to it; mouse or touch drag walks it somewhere. The selected dwarf blinks.
 */
export function DwarfToken({ d, frames, f }: { d: Dwarf; frames: string[]; f: number }) {
  const selected = selectedDwarf.value === d.id;
  const mining = d.target !== null;
  const glyph = mining ? frames[f % frames.length]! : frames[0]!;
  return (
    <button
      type="button"
      className={`dwarf${selected ? ' dwarf-selected' : ''}${drag.value?.id === d.id ? ' dwarf-dragging' : ''}`}
      aria-label={`L${d.level} dwarf${mining ? ', mining' : ''}. Arrow keys or WASD to move, E to use a Device.`}
      // Keep focus on the dwarf when it moves to another cell (that remounts the button).
      ref={(el) => {
        if (el && selected && document.activeElement !== el && document.activeElement?.classList.contains('dwarf')) {
          el.focus({ preventScroll: true });
        }
      }}
      onFocus={() => (selectedDwarf.value = d.id)}
      onKeyDown={(e) => onKeyDown(e, d)}
      onPointerDown={(e) => onPointerDown(e, d)}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        press = null;
        drag.value = null;
      }}
      onClick={(e) => {
        e.stopPropagation();
        e.currentTarget.focus();
      }}
    >
      <span className="glyph">{glyph}</span>
      <small className="tiny">{d.level}</small>
    </button>
  );
}

/** The dwarf following the pointer during a drag. */
export function DragGhost() {
  const g = drag.value;
  if (!g) return null;
  return (
    <div className="drag-ghost" style={{ left: g.x, top: g.y }} aria-hidden>
      ☺
    </div>
  );
}
