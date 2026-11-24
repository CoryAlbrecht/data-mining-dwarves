/**
 * Keyboard play: WASD / arrow keys / E always drive the Selected dwarf (GLOSSARY.md), wherever
 * keyboard focus happens to be. One listener on the page, so moving a dwarf (which remounts its
 * button in another cell) or clicking a panel button can't break the next keystroke.
 */
import type { Direction } from '@dmd/shared';
import { moveDwarf, selectDwarf, useAdjacentDevice } from './actions.ts';
import { selectedDwarf } from './world.ts';

const MOVES: Record<string, Direction> = {
  w: 'up', a: 'left', s: 'down', d: 'right',
  arrowup: 'up', arrowleft: 'left', arrowdown: 'down', arrowright: 'right',
};

/** The parts of a KeyboardEvent the game looks at. */
export interface KeyPress {
  key: string;
  target: unknown;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
}

/** Is the key going into something the player types in? Those keep their keys. */
function isTextField(target: unknown): boolean {
  const el = target as { tagName?: string; isContentEditable?: boolean } | null;
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || !!el.isContentEditable);
}

/**
 * Apply a key press to the game. Returns true if the key should do nothing else (the caller then
 * prevents the browser default, e.g. arrows scrolling the page).
 */
export function handleKey(e: KeyPress): boolean {
  if (e.ctrlKey || e.metaKey || e.altKey || isTextField(e.target)) return false;
  const key = e.key.toLowerCase();
  if (key === 'escape') {
    selectDwarf(null);
    return false; // leave the browser's own Escape alone (popups, fullscreen)
  }
  const id = selectedDwarf.value;
  if (id === null) return false;
  const dir = MOVES[key];
  if (dir) {
    moveDwarf(id, dir);
    return true;
  }
  if (key === 'e') {
    useAdjacentDevice(id);
    return true;
  }
  return false;
}

/** Listen for game keys on the whole page. Call once at startup. */
export function startKeyboard(page: EventTarget = document) {
  page.addEventListener('keydown', (e) => {
    if (handleKey(e as KeyboardEvent)) e.preventDefault();
  });
}
