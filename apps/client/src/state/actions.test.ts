import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Block, LevelDef } from '@dmd/shared';

/**
 * A tiny hand-built 4×3 Mine (row-major cell numbers):
 *
 *   ╔═╡▒▒╞═╗   port over columns 1–2 (hardness 240 B)
 *   ║ 0 1 2 3║  R R R R      R = 120 B rock (Level 1)
 *   ║ 4 5 6 7║  . R C C      C = buried 4004 CPU, 2×1 (120 B); 6 = collect spot, 7 = label
 *   ║ 8 9 A B║  . . . .
 *   ╚══╡ ╞══╝  Entry under column 1 → dwarves arrive on cell 9
 *
 * Depth 4 is the last Mine of computer 1, so it has a USB port instead.
 */
const rock = (): Block => ({ kind: 'rock', level: 1, size: 120, remaining: 120, loot: { kind: 'bytes', amount: 50 } });
const empty = (): Block => ({ kind: 'empty' });

function fixture(depth: number): LevelDef {
  return {
    depth,
    computer: 0,
    computerIndex: depth - 1,
    seed: depth,
    width: 4,
    height: 3,
    entry: 1,
    blocks: [
      rock(), rock(), rock(), rock(),
      empty(), rock(), { kind: 'device', device: 0, role: 'collect', label: -1 }, { kind: 'device', device: 0, role: 'label', label: 0 },
      empty(), empty(), empty(), empty(),
    ],
    devices: [{ id: 0, model: 'cpu:4004-cpu', x: 2, y: 1, w: 2, h: 1, buried: true, level: 1, size: 120 }],
    exit: { kind: depth === 4 ? 'usb' : 'port', x: 1, width: 2, level: 1, size: 240 },
    theme: {
      name: 'Test',
      style: 'crt',
      palette: { rock: '#000', rockDark: '#000', accent: '#0f0' },
      glyphs: {
        rock: ['▓', '▒', '░'], encrypted: ['╬'], item: '¤', dwarf: ['☺'],
        wall: { h: '═', v: '║', tl: '╔', tr: '╗', bl: '╚', br: '╝' },
        gapL: '╡', gapR: '╞', portBuried: '▒', portOpen: ' ',
        collect: '⇩', collectFull: ['⇩'], spawn: '+', upgrade: '⇧',
      },
    },
  };
}

vi.mock('../api/client.ts', () => ({ api: { level: async (depth: number) => fixture(depth) } }));

const A = await import('./actions.ts');
const { tick } = await import('./loop.ts');
const W = await import('./world.ts');
const K = await import('./keyboard.ts');
const { dwarves, inventory, levelAt, levels, message, EXIT } = W;

function dwarf(id: number, level: number, pos: number, depth = 1) {
  return { id, level, depth, pos, target: null, path: [], goal: null };
}
const get = (id: number) => dwarves.value.find((d) => d.id === id);
/** A key press on the page, with no modifiers and focus on nothing in particular. */
const press = (key: string, extra: Partial<Parameters<typeof K.handleKey>[0]> = {}) =>
  K.handleKey({ key, target: null, ctrlKey: false, metaKey: false, altKey: false, ...extra });
const run = (seconds: number) => {
  for (let t = 0; t < seconds; t++) tick(1);
};

beforeEach(async () => {
  levels.value = [];
  dwarves.value = [];
  inventory.value = {};
  W.bytes.value = 0;
  message.value = null;
  await A.loadLevel(1);
  await A.loadLevel(2);
});

describe('moving and mining', () => {
  it('starts with one L1 dwarf just inside the Entry', () => {
    A.ensureStartingDwarf();
    expect(dwarves.value).toEqual([expect.objectContaining({ level: 1, pos: 9 })]);
  });

  it('moves orthogonally through holes; the Wall stops it', () => {
    dwarves.value = [dwarf(1, 1, 9)];
    A.moveDwarf(1, 'right');
    expect(get(1)!.pos).toBe(10);
    A.moveDwarf(1, 'down'); // bottom Wall, not the Entry
    expect(get(1)!.pos).toBe(10);
  });

  it('mines a rock it bumps into instead of moving', () => {
    dwarves.value = [dwarf(1, 1, 4)];
    A.moveDwarf(1, 'up');
    expect(get(1)).toMatchObject({ pos: 4, target: 0 });
  });

  it('picks the next target in WASD order (odd Levels) or DSAW order (even)', () => {
    dwarves.value = [dwarf(1, 1, 4)];
    tick(0.1);
    expect(get(1)!.target).toBe(0); // up first
    dwarves.value = [dwarf(2, 2, 4)];
    tick(0.1);
    expect(get(2)!.target).toBe(5); // right first
  });

  it('breaks a 120 B rock in 30 s for one L1 dwarf and leaves the loot on the floor', () => {
    dwarves.value = [dwarf(1, 1, 4)];
    A.moveDwarf(1, 'right');
    run(29);
    expect(levelAt(1)!.blocks.value[5]!.kind).toBe('rock');
    run(1);
    expect(levelAt(1)!.blocks.value[5]).toMatchObject({ kind: 'item' });
    expect(get(1)!.pos).toBe(4);
  });

  it('digs a buried Device as one mass from any side, then it is solid', () => {
    dwarves.value = [dwarf(1, 2, 10), dwarf(2, 2, 11)]; // even Levels: D,S,A,W — force them up
    A.moveDwarf(1, 'up');
    A.moveDwarf(2, 'up');
    run(10); // 2 dwarves × 6 B/s → 120 B in 10 s
    expect(levelAt(1)!.devices.value[0]).toEqual({ buried: false, remaining: 0 });
    A.moveDwarf(1, 'up');
    expect(get(1)!.pos).toBe(10); // solid
  });

  it('picks up an item only when a dwarf steps onto it', () => {
    A.setBlock(levelAt(1)!, 4, { kind: 'item', loot: { kind: 'chip', chip: 'cron', count: 1 } });
    dwarves.value = [dwarf(1, 1, 8)];
    A.moveDwarf(1, 'up');
    expect(inventory.value.cron).toBe(1);
    expect(levelAt(1)!.blocks.value[4]!.kind).toBe('empty');
  });

  it('merges by moving onto a same-Level dwarf, and blocks different Levels', () => {
    dwarves.value = [dwarf(1, 1, 8), dwarf(2, 1, 9), dwarf(3, 2, 10)];
    A.moveDwarf(2, 'right');
    expect(get(2)!.pos).toBe(9);
    A.moveDwarf(1, 'right');
    expect(dwarves.value).toHaveLength(2);
    expect(get(2)!.level).toBe(2);
  });

  it('walks a dragged dwarf next to the drop target, then mines it', () => {
    dwarves.value = [dwarf(1, 1, 9)];
    A.walkTo(1, 1, 0);
    expect(get(1)!.path).toEqual([8, 4]);
    // One cell per 333 ms of game time (docs/DESIGN.md → Walking pace).
    tick(0.33);
    expect(get(1)!.pos).toBe(9);
    tick(0.01); // 0.34 s
    expect(get(1)!.pos).toBe(8);
    tick(0.32); // 0.66 s
    expect(get(1)).toMatchObject({ pos: 8, target: null });
    tick(0.01); // 0.67 s
    expect(get(1)).toMatchObject({ pos: 4, target: 0 });
  });
});

describe('network port in the top Wall', () => {
  function openTopRow() {
    A.setBlock(levelAt(1)!, 1, empty());
    A.setBlock(levelAt(1)!, 2, empty());
  }

  it('is dug from the top row under it, then walking up goes to the next Mine', () => {
    openTopRow();
    dwarves.value = [dwarf(1, 1, 1), dwarf(2, 1, 2)];
    A.moveDwarf(1, 'up');
    expect(get(1)!.target).toBe(EXIT);
    run(30); // 240 B, two L1 dwarves at 4 B/s
    expect(levelAt(1)!.exit.value.buried).toBe(false);
    A.moveDwarf(1, 'up');
    expect(get(1)).toMatchObject({ depth: 2, pos: 9 });
  });

  it('respects capacity and technology limits', () => {
    openTopRow();
    levelAt(1)!.exit.value = { buried: false, remaining: 0 };
    A.setBlock(levelAt(1)!, 3, empty());
    dwarves.value = [dwarf(1, 5, 1), dwarf(2, 1, 2), dwarf(3, 1, 3)];
    A.moveDwarf(1, 'up');
    expect(message.value).toMatch(/can't carry an L5/);
    A.moveDwarf(2, 'up');
    expect(get(2)!.depth).toBe(2);
    A.moveDwarf(3, 'left'); // into cell 2, under the port
    A.moveDwarf(3, 'up'); // a Level 1 serial port carries 1 dwarf
    expect(get(3)).toMatchObject({ depth: 1, pos: 2 });
    expect(message.value).toMatch(/port is full/);
  });

  it('lets dwarves walk back down through the Entry only with duplex', () => {
    openTopRow();
    levelAt(1)!.port.value = { tech: 0, level: 1, duplex: false, passed: 1 };
    dwarves.value = [dwarf(1, 1, 9, 2)];
    A.moveDwarf(1, 'down');
    expect(get(1)!.depth).toBe(2);
    inventory.value = { duplex: 1 };
    A.installDuplex(1);
    A.moveDwarf(1, 'down');
    expect(get(1)).toMatchObject({ depth: 1, pos: 1 });
    expect(levelAt(1)!.port.value.passed).toBe(0);
  });

  it('upgrading adds capacity; rewiring to new technology resets it to Level 1', () => {
    inventory.value = { 'net:serial': 10, 'net:ethernet-1m': 2 };
    A.upgradePort(1);
    expect(levelAt(1)!.port.value.level).toBe(2);
    A.upgradePortTech(1);
    expect(levelAt(1)!.port.value).toMatchObject({ tech: 1, level: 1 });
  });
});

describe('Devices', () => {
  it('collects with E from an adjacent dwarf, and fork() puts new dwarves by the Entry', () => {
    const lvl = levelAt(1)!;
    lvl.devices.value = [{ buried: false, remaining: 0 }];
    lvl.buffers.value = [42];
    dwarves.value = [dwarf(1, 1, 10)];
    A.useAdjacentDevice(1);
    expect(W.bytes.value).toBe(42);

    W.bytes.value = 1000;
    A.buyDwarf(1);
    expect(dwarves.value.at(-1)).toMatchObject({ pos: 9, level: 1 });
  });
});

describe('sneakernet', () => {
  it('needs a dwarf under the open USB port, then leaves the old computer behind', async () => {
    levels.value = [];
    for (let d = 1; d <= 4; d++) await A.loadLevel(d);
    const last = levelAt(4)!;
    last.exit.value = { buried: false, remaining: 0 };
    W.bytes.value = 500;
    inventory.value = { cron: 2 };
    dwarves.value = [dwarf(1, 3, 9, 4)];

    await A.sneakernet(4);
    expect(message.value).toMatch(/Walk a dwarf under the USB port/);

    A.setBlock(last, 1, empty());
    dwarves.value = [dwarf(1, 3, 1, 4), dwarf(2, 2, 9, 2)];
    await A.sneakernet(4);
    expect(levels.value.map((l) => l.def.depth)).toEqual([5]);
    expect(dwarves.value).toEqual([expect.objectContaining({ level: 1, depth: 5, pos: 9 })]);
    expect(W.bytes.value).toBe(500);
    expect(inventory.value.cron).toBe(2);
  });
});

describe('keyboard drives the Selected dwarf', () => {

  beforeEach(() => {
    dwarves.value = [dwarf(1, 1, 8)];
    W.selectedDwarf.value = 1;
  });

  it('moves on every key in a row: D, D, A, ← (regression for #2)', () => {
    const cells = ['d', 'd', 'a', 'ArrowLeft'].map((k) => (press(k), get(1)!.pos));
    expect(cells).toEqual([9, 10, 9, 8]);
  });

  it('listens on the page and stops arrow keys from scrolling it', () => {
    const page = new EventTarget();
    K.startKeyboard(page);
    const keydown = (key: string) =>
      Object.assign(new Event('keydown', { cancelable: true }), { key, ctrlKey: false, metaKey: false, altKey: false });
    const arrow = keydown('ArrowRight');
    page.dispatchEvent(arrow);
    expect(arrow.defaultPrevented).toBe(true);
    page.dispatchEvent(keydown('ArrowRight'));
    expect(get(1)!.pos).toBe(10);
    const escape = keydown('Escape');
    page.dispatchEvent(escape);
    expect(W.selectedDwarf.value).toBeNull();
    expect(escape.defaultPrevented).toBe(false); // the browser keeps its own Escape (popups, fullscreen)
  });

  it('leaves keys alone while typing in a text field', () => {
    expect(press('d', { target: { tagName: 'INPUT' } })).toBe(false);
    expect(get(1)!.pos).toBe(8);
  });

  it('leaves shortcuts with Ctrl, Cmd or Alt to the browser', () => {
    expect(press('d', { ctrlKey: true })).toBe(false);
    expect(get(1)!.pos).toBe(8);
  });

  it('Escape clears the selection, and then keys do nothing', () => {
    press('Escape');
    expect(W.selectedDwarf.value).toBeNull();
    expect(press('d')).toBe(false);
    expect(get(1)!.pos).toBe(8);
  });

  it('E uses a Device next to the Selected dwarf', () => {
    levelAt(1)!.devices.value = [{ buried: false, remaining: 0 }];
    levelAt(1)!.buffers.value = [42];
    dwarves.value = [dwarf(1, 1, 10)];
    press('e');
    expect(W.bytes.value).toBe(42);
  });
});

describe('the Selected dwarf follows merges and Mine changes', () => {
  it('selects the merged dwarf after a merge', () => {
    dwarves.value = [dwarf(1, 1, 8), dwarf(2, 1, 9)];
    W.selectedDwarf.value = 1;
    press('d');
    expect(dwarves.value).toEqual([expect.objectContaining({ id: 2, level: 2 })]);
    expect(W.selectedDwarf.value).toBe(2);
  });

  it('stays selected going up through the port and back down through the Entry', () => {
    A.setBlock(levelAt(1)!, 1, empty());
    levelAt(1)!.exit.value = { buried: false, remaining: 0 };
    inventory.value = { duplex: 1 };
    A.installDuplex(1);
    dwarves.value = [dwarf(1, 1, 1)];
    W.selectedDwarf.value = 1;
    press('w');
    expect(get(1)).toMatchObject({ depth: 2, pos: 9 });
    expect(W.selectedDwarf.value).toBe(1);
    press('s');
    expect(get(1)).toMatchObject({ depth: 1, pos: 1 });
    expect(W.selectedDwarf.value).toBe(1);
  });
});

describe('holding a key walks the Selected dwarf', () => {
  const release = (key: string) => K.handleKeyUp({ key });

  beforeEach(() => {
    release('d'); // no key left held over from another test
    dwarves.value = [dwarf(1, 1, 8)];
    W.selectedDwarf.value = 1;
  });

  it('steps at once, then one cell per 333 ms of game time, ignoring key auto-repeat', () => {
    press('d');
    expect(get(1)!.pos).toBe(9);
    for (let i = 0; i < 5; i++) press('d', { repeat: true }); // the OS repeats much faster
    expect(get(1)!.pos).toBe(9);
    tick(0.33);
    expect(get(1)!.pos).toBe(9);
    tick(0.01);
    expect(get(1)!.pos).toBe(10);
    tick(0.333);
    expect(get(1)!.pos).toBe(11);
  });

  it('ends the walk when it bumps into a rock and starts mining it, even if the key stays down', () => {
    press('w'); // 8 → 4 (a hole)
    expect(get(1)!.pos).toBe(4);
    tick(0.34); // up from 4 is rock 0: mine it instead of moving
    expect(get(1)).toMatchObject({ pos: 4, target: 0 });
    run(40); // the rock breaks after 30 s and leaves its loot on the floor
    expect(levelAt(1)!.blocks.value[0]!.kind).toBe('item');
    expect(get(1)!.pos).toBe(4); // dwarves never step onto loot by themselves
  });

  it('stops when the key is released on the page', () => {
    const page = new EventTarget();
    K.startKeyboard(page);
    const key = (type: string, k: string) =>
      Object.assign(new Event(type), { key: k, ctrlKey: false, metaKey: false, altKey: false, repeat: false });
    page.dispatchEvent(key('keydown', 'd'));
    expect(get(1)!.pos).toBe(9);
    page.dispatchEvent(key('keyup', 'd'));
    tick(1);
    expect(get(1)!.pos).toBe(9);
  });

  it('turns when another direction is pressed while holding, at the same pace', () => {
    dwarves.value = [dwarf(1, 1, 9)];
    press('d'); // 9 → 10
    press('a'); // 10 → 9, now walking left
    release('d'); // letting go of the old key doesn't stop the new walk
    tick(0.34);
    expect(get(1)!.pos).toBe(8);
  });

  it('stops when the selection is cleared mid-walk', () => {
    press('d'); // 8 → 9
    press('Escape');
    W.selectedDwarf.value = 1; // picked again, key still physically down
    tick(1);
    expect(get(1)!.pos).toBe(9);
  });
});

describe('Device and port dialogs', () => {
  beforeEach(() => {
    A.closeDialog();
    W.selectedDwarf.value = null;
  });
  const uncover = (depth: number) => (levelAt(depth)!.devices.value = [{ buried: false, remaining: 0 }]);

  it("opens an uncovered Device's dialog from its label", () => {
    uncover(1);
    A.tapCell(1, 7);
    expect(W.openDialog.value).toEqual({ kind: 'device', depth: 1, device: 0 });
  });

  it('opens nothing for a buried Device, just the ticker hint', () => {
    A.tapCell(1, 7);
    expect(W.openDialog.value).toBeNull();
    expect(message.value).toMatch(/Buried hardware/);
  });

  it('still collects in one tap from the collect spot, without a dialog', () => {
    uncover(1);
    levelAt(1)!.buffers.value = [42];
    A.tapCell(1, 6);
    expect(W.bytes.value).toBe(42);
    expect(W.openDialog.value).toBeNull();
  });

  it("opens the port's dialog, and only one dialog at a time", () => {
    A.tapExit(1);
    expect(W.openDialog.value).toEqual({ kind: 'port', depth: 1 });
    uncover(2);
    A.tapCell(2, 7);
    expect(W.openDialog.value).toEqual({ kind: 'device', depth: 2, device: 0 });
  });

  it('ignores game keys while a dialog is open', () => {
    dwarves.value = [dwarf(1, 1, 9)];
    W.selectedDwarf.value = 1;
    A.tapExit(1);
    expect(press('d')).toBe(false);
    expect(press('ArrowLeft')).toBe(false);
    expect(get(1)!.pos).toBe(9);
  });

  it('closes the dialog on Escape and keeps the dwarf selected', () => {
    dwarves.value = [dwarf(1, 1, 9)];
    W.selectedDwarf.value = 1;
    A.tapExit(1);
    press('Escape');
    expect(W.openDialog.value).toBeNull();
    expect(W.selectedDwarf.value).toBe(1);
    press('d');
    expect(get(1)!.pos).toBe(10); // keys work again
  });
});
