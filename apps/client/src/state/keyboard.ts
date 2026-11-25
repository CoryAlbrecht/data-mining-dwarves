/**
 * Keyboard play: WASD / arrow keys / E always drive the Selected dwarf (GLOSSARY.md), wherever
 * keyboard focus happens to be. One listener on the page, so moving a dwarf (which remounts its
 * button in another cell) or clicking a dialog button can't break the next keystroke.
 */
import { WALK_SECONDS, type Direction } from '@dmd/shared';
import { closeDialog, moveDwarf, selectDwarf, useAdjacentDevice } from './actions.ts';
import { dwarves, openDialog, selectedDwarf } from './world.ts';

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
  /** True for the keyboard's own auto-repeat while a key is held down. */
  repeat?: boolean;
}

/** A direction key being held down: which key, which way, for which dwarf. Input state, not game state. */
interface HeldKey {
  key: string;
  dir: Direction;
  id: number;
  /** Game seconds since the dwarf's last step. */
  sinceStep: number;
}
let held: HeldKey | null = null;

/**
 * Move the dwarf one cell. True if it walked to a new cell; false if it started mining whatever it
 * bumped into, was blocked, or merged away. Only a real step keeps a held key walking.
 */
function walkOneCell(id: number, dir: Direction): boolean {
  const find = () => dwarves.value.find((d) => d.id === id);
  const before = find();
  moveDwarf(id, dir);
  const after = find();
  return !!before && !!after && after.target === null && (after.pos !== before.pos || after.depth !== before.depth);
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
  if (openDialog.value) {
    // A dialog is up: game keys rest, and Escape closes only the dialog (the dwarf stays selected).
    held = null;
    if (key === 'escape') closeDialog();
    return false;
  }
  if (key === 'escape') {
    held = null;
    selectDwarf(null);
    return false; // leave the browser's own Escape alone (popups, fullscreen)
  }
  const id = selectedDwarf.value;
  if (id === null) return false;
  const dir = MOVES[key];
  if (dir) {
    if (e.repeat) return true; // held keys walk at the walking pace (walkHeldKey), not the OS repeat rate
    held = walkOneCell(id, dir) ? { key, dir, id, sinceStep: 0 } : null;
    return true;
  }
  if (key === 'e') {
    useAdjacentDevice(id);
    return true;
  }
  return false;
}

/** A key was released: stop walking if it was the held direction key. */
export function handleKeyUp(e: { key: string }) {
  if (held?.key === e.key.toLowerCase()) held = null;
}

/** Called by the game loop: while a direction key is held, step once per WALK_SECONDS. */
export function walkHeldKey(dt: number) {
  if (!held) return;
  if (selectedDwarf.value !== held.id || openDialog.value) {
    held = null; // deselected (Escape), another dwarf picked, or a dialog opened: stop
    return;
  }
  held.sinceStep += dt;
  while (held && held.sinceStep >= WALK_SECONDS) {
    held.sinceStep -= WALK_SECONDS;
    if (!walkOneCell(held.id, held.dir)) held = null;
  }
}

/** Listen for game keys on the whole page. Call once at startup. */
export function startKeyboard(page: EventTarget = document) {
  page.addEventListener('keydown', (e) => {
    if (handleKey(e as KeyboardEvent)) e.preventDefault();
  });
  page.addEventListener('keyup', (e) => handleKeyUp(e as KeyboardEvent));
  // Switching windows mid-hold means the key-up never arrives here: stop walking.
  globalThis.addEventListener?.('blur', () => (held = null));
}
