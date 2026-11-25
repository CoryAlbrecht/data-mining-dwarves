import { describe, expect, it } from 'vitest';
import { bufferCap, getDeviceModel, type Block, type LevelDef } from '@dmd/shared';
import { makeLevelState, type Dwarf, type LevelState } from '../state/world.ts';
import { cellView, portView, type ViewContext } from './cellView.ts';

/**
 * A tiny hand-built 4×3 Mine (row-major cell numbers), as in state/actions.test.ts:
 *
 *   ╔═╡▒▒╞═╗   port over columns 1–2 (hardness 240 B)
 *   ║ 0 1 2 3║  R R R R      R = 120 B rock (Level 1)
 *   ║ 4 5 6 7║  . R C C      C = buried 4004 CPU, 2×1 (120 B); 6 = collect spot, 7 = label
 *   ║ 8 9 A B║  . . . .
 *   ╚══╡ ╞══╝  Entry under column 1
 *
 * Depth 4 is the last Mine of computer 1, so it has a USB port instead.
 */
type Rock = Extract<Block, { kind: 'rock' }>;
const rock = (over: Partial<Rock> = {}): Rock => ({ kind: 'rock', level: 1, size: 120, remaining: 120, loot: { kind: 'bytes', amount: 50 }, ...over });
const empty = (): Block => ({ kind: 'empty' });

function fixture(depth = 1): LevelDef {
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
        rock: ['▓', '▒', '░'], encrypted: ['╬', '╪'], item: '¤', dwarf: ['☺'],
        wall: { h: '═', v: '║', tl: '╔', tr: '╗', bl: '╚', br: '╝' },
        gapL: '╡', gapR: '╞', portBuried: '▒', portOpen: ' ',
        collect: '⇩', collectFull: ['⇊', '⇓'], spawn: '+', upgrade: '⇧',
      },
    },
  };
}

const ctx = (over: Partial<ViewContext> = {}): ViewContext => ({ dwarves: [], deviceLevels: {}, frame: 0, ...over });

function dwarf(id: number, pos: number, target: number | null = null): Dwarf {
  return { id, level: 1, depth: 1, pos, target, path: [], goal: null };
}

/** The fixture Mine with its CPU dug out, and a 2×2 layout: collect, upgrade, two labels. */
function uncovered(model = 'cpu:4004-cpu'): LevelState {
  const def = fixture();
  def.blocks[2] = { kind: 'device', device: 0, role: 'label', label: 0 };
  def.blocks[3] = { kind: 'device', device: 0, role: 'label', label: 1 };
  def.blocks[6] = { kind: 'device', device: 0, role: 'collect', label: -1 };
  def.blocks[7] = { kind: 'device', device: 0, role: 'upgrade', label: -1 };
  def.devices[0] = { id: 0, model, x: 2, y: 0, w: 2, h: 2, buried: false, level: 1, size: 120 };
  return makeLevelState(def);
}

describe('cellView: rocks, items and monsters', () => {
  it('shows a bit-rock as its wear glyph with its Level as the tiny number', () => {
    const lvl = makeLevelState(fixture());
    const v = cellView(lvl, 1, ctx());
    expect(v).toMatchObject({ glyph: '▓', tiny: 1, classes: ['cell', 'cell-rock'] });
    expect(v.title).toBe('Bit-rock, Level 1: 120 B left (30s for one L1 dwarf)');
  });

  it('wears a bit-rock down through the Theme glyphs as it is dug', () => {
    const def = fixture();
    def.blocks[1] = rock({ level: 3, remaining: 50 });
    const v = cellView(makeLevelState(def), 1, ctx());
    expect(v).toMatchObject({ glyph: '▒', tiny: 3 });
    expect(v.title).toBe('Bit-rock, Level 3: 50 B left (13s for one L1 dwarf)');
  });

  it('lights a cell next to a hole', () => {
    expect(cellView(makeLevelState(fixture()), 0, ctx()).classes).toEqual(['cell', 'cell-rock', 'cell-lit']);
  });

  it('draws an encrypted bit-rock with the encrypted glyphs', () => {
    const def = fixture();
    def.blocks[1] = rock({ encrypted: true, remaining: 30 });
    const v = cellView(makeLevelState(def), 1, ctx());
    expect(v).toMatchObject({ glyph: '╪', tiny: 1 });
    expect(v.title).toMatch(/^Encrypted bit-rock, Level 1: 30 B left/);
  });

  it('draws an empty cell as a lit blank', () => {
    expect(cellView(makeLevelState(fixture()), 4, ctx())).toEqual({ glyph: '', tiny: null, title: '', classes: ['cell', 'cell-empty', 'cell-lit'] });
  });

  it('draws an Item of bytes or chips', () => {
    const def = fixture();
    def.blocks[4] = { kind: 'item', loot: { kind: 'bytes', amount: 1536 } };
    def.blocks[8] = { kind: 'item', loot: { kind: 'chip', chip: 'cron', count: 1 } };
    const lvl = makeLevelState(def);
    expect(cellView(lvl, 4, ctx())).toEqual({
      glyph: '¤', tiny: null, title: '1.5 kB: walk onto it to pick it up', classes: ['cell', 'cell-item', 'cell-lit'],
    });
    expect(cellView(lvl, 8, ctx()).title).toBe('A chip: walk onto it to pick it up');
  });

  it('draws a monster with its HP', () => {
    const def = fixture();
    def.blocks[5] = { kind: 'monster', monster: 'bug', hp: 4 };
    expect(cellView(makeLevelState(def), 5, ctx())).toMatchObject({
      glyph: 'ж', tiny: 4, title: "Bug: It's not a feature. Tap to fight.",
    });
  });

  it('hands over the dwarf standing on a cell; the frame does not change the cell', () => {
    const lvl = makeLevelState(fixture());
    const d = dwarf(1, 9);
    expect(cellView(lvl, 9, ctx({ dwarves: [d] })).dwarf).toBe(d);
    expect(cellView(lvl, 9, ctx({ dwarves: [{ ...d, depth: 2 }] })).dwarf).toBeUndefined();
    expect(cellView(lvl, 1, ctx({ frame: 7 }))).toEqual(cellView(lvl, 1, ctx({ frame: 0 })));
  });
});

describe('cellView: Devices', () => {
  it('draws a buried Device as worn rock, with the Level on its upgrade cell only', () => {
    const def = fixture();
    def.blocks[7] = { kind: 'device', device: 0, role: 'upgrade', label: -1 };
    const lvl = makeLevelState(def);
    lvl.devices.value = [{ buried: true, remaining: 60 }];
    expect(cellView(lvl, 6, ctx())).toEqual({
      glyph: '▒', tiny: null, title: 'Buried hardware, Level 1: 60 B left', classes: ['cell', 'cell-device', 'cell-lit', 'cell-buried'],
    });
    expect(cellView(lvl, 7, ctx())).toMatchObject({ glyph: '▒', tiny: 1 });
  });

  it('draws an uncovered Device: Collect button, upgrade cell with Level, label cells', () => {
    const lvl = uncovered();
    lvl.buffers.value = [12];
    const levels = { 'cpu:4004-cpu': 3 };
    expect(cellView(lvl, 6, ctx({ deviceLevels: levels }))).toMatchObject({
      glyph: '⇩', tiny: null, title: 'Collect 12 B', classes: ['cell', 'cell-device', 'cell-lit', 'cell-hardware'],
    });
    expect(cellView(lvl, 7, ctx({ deviceLevels: levels }))).toMatchObject({
      glyph: '⇧', tiny: 3, title: 'Upgrade 4004 CPU (Level 3)', classes: ['cell', 'cell-device', 'cell-lit', 'cell-hardware'],
    });
    expect(cellView(lvl, 2, ctx())).toMatchObject({
      glyph: 'CPU', tiny: null, title: '4004 CPU: tap for details', classes: ['cell', 'cell-device', 'cell-hardware', 'cell-label'],
    });
    expect(cellView(lvl, 3, ctx()).glyph).toBe('4004');
  });

  it('pulses the full Collect button with its usual glyph, whatever the frame', () => {
    const lvl = uncovered();
    lvl.buffers.value = [bufferCap(getDeviceModel('cpu:4004-cpu'), 1) - 1];
    expect(cellView(lvl, 6, ctx()).classes).not.toContain('cell-full');
    lvl.buffers.value = [bufferCap(getDeviceModel('cpu:4004-cpu'), 1)];
    expect(cellView(lvl, 6, ctx({ frame: 0 }))).toMatchObject({ glyph: '⇩', classes: expect.arrayContaining(['cell-full']) });
    expect(cellView(lvl, 6, ctx({ frame: 4 }))).toEqual(cellView(lvl, 6, ctx({ frame: 0 })));
  });

  it('marks an automated Device ⟳ and never as full', () => {
    const lvl = uncovered();
    lvl.buffers.value = [bufferCap(getDeviceModel('cpu:4004-cpu'), 1)];
    lvl.automated.value = [0];
    const v = cellView(lvl, 6, ctx());
    expect(v).toMatchObject({ glyph: '⇩', tiny: '⟳' });
    expect(v.classes).not.toContain('cell-full');
  });

  it('draws fork() with a spawn button and fork / () labels', () => {
    const lvl = uncovered('fork');
    expect(cellView(lvl, 6, ctx())).toMatchObject({ glyph: '+', tiny: null, title: 'Spawn a dwarf' });
    expect([cellView(lvl, 2, ctx()).glyph, cellView(lvl, 3, ctx()).glyph]).toEqual(['fork', '()']);
    expect(cellView(lvl, 7, ctx())).toMatchObject({ glyph: '⇧', title: 'Upgrade fork() (Level 1)' });
  });

  it('never highlights a Device: the view takes no open dialog', () => {
    const lvl = uncovered();
    for (const i of [2, 3, 6, 7]) expect(cellView(lvl, i, ctx()).classes.filter((c) => c.includes('selected'))).toEqual([]);
  });
});

describe('cellView: Device fill', () => {
  const cap = bufferCap(getDeviceModel('cpu:4004-cpu'), 1);
  const fills = (lvl: LevelState) => [2, 3, 6, 7].map((i) => cellView(lvl, i, ctx()).fill);

  it('leaves every cell of a Device with an empty Buffer unfilled', () => {
    const lvl = uncovered();
    lvl.buffers.value = [0];
    expect(fills(lvl)).toEqual([0, 0, 0, 0]);
  });

  it('fills every cell of a Device with a full Buffer, even past the cap', () => {
    const lvl = uncovered();
    lvl.buffers.value = [cap];
    expect(fills(lvl)).toEqual([1, 1, 1, 1]);
    lvl.buffers.value = [cap * 2];
    expect(fills(lvl)).toEqual([1, 1, 1, 1]);
  });

  it('fills a two-row Device bottom row first, sharing the level between its rows', () => {
    const lvl = uncovered(); // cells 2, 3 on top; 6, 7 below
    lvl.buffers.value = [cap / 4];
    expect(fills(lvl)).toEqual([0, 0, 0.5, 0.5]);
    lvl.buffers.value = [cap / 2];
    expect(fills(lvl)).toEqual([0, 0, 1, 1]);
    lvl.buffers.value = [(cap * 3) / 4];
    expect(fills(lvl)).toEqual([0.5, 0.5, 1, 1]);
  });

  it('fills an automated Device too', () => {
    const lvl = uncovered();
    lvl.buffers.value = [cap / 2];
    lvl.automated.value = [0];
    expect(fills(lvl)).toEqual([0, 0, 1, 1]);
  });

  it('never fills fork(), which is not a producing Device, nor a buried Device', () => {
    expect(fills(uncovered('fork'))).toEqual([undefined, undefined, undefined, undefined]);
    const lvl = makeLevelState(fixture());
    lvl.buffers.value = [cap];
    expect([6, 7].map((i) => cellView(lvl, i, ctx()).fill)).toEqual([undefined, undefined]);
  });
});

describe('portView', () => {
  it('draws a buried Network port as rock with the bytes in the way', () => {
    expect(portView(makeLevelState(fixture()), 1, ctx())).toEqual({
      glyph: '▒', tiny: null, title: 'Network port: 240 B of rock in the way', classes: ['wall', 'wall-port'],
    });
  });

  it('draws an open Network port', () => {
    const lvl = makeLevelState(fixture());
    lvl.exit.value = { buried: false, remaining: 0 };
    expect(portView(lvl, 2, ctx())).toEqual({
      glyph: '', tiny: null, title: 'Network port', classes: ['wall', 'wall-port', 'wall-port-open'], label: '0/1 ≤L4',
    });
  });

  it('labels a dug-out 2-wide Network port with its technology, then in use/Capacity and highest Level', () => {
    const lvl = makeLevelState(fixture());
    lvl.exit.value = { buried: false, remaining: 0 };
    expect([1, 2].map((x) => portView(lvl, x, ctx()).label)).toEqual(['RS-232', '0/1 ≤L4']);
    expect(portView(lvl, 1, ctx()).glyph).toBe('');
  });

  /** The fixture Mine with a dug-out Network port `width` cells wide (columns 0 up). */
  function openPort(width: number): LevelState {
    const def = fixture();
    def.exit = { ...def.exit, x: 0, width };
    const lvl = makeLevelState(def);
    lvl.exit.value = { buried: false, remaining: 0 };
    return lvl;
  }
  const labels = (lvl: LevelState) => Array.from({ length: lvl.def.exit.width }, (_, k) => portView(lvl, lvl.def.exit.x + k, ctx()).label);

  it('spreads the labels over a 3-wide port', () => {
    expect(labels(openPort(3))).toEqual(['RS-232', '0/1', '≤L4']);
  });

  it('adds the port speed on a 4-wide port', () => {
    const lvl = openPort(4);
    expect(labels(lvl)).toEqual(['RS-232', '300 baud', '0/1', '≤L4']);
    lvl.port.value = { ...lvl.port.value, level: 4 };
    expect(labels(lvl)).toEqual(['RS-232', '9600 baud', '0/3', '≤L4']);
  });

  it('gives every Port technology its short name and highest dwarf Level', () => {
    const lvl = openPort(3);
    const seen = [0, 1, 2, 3, 4, 5].map((tech) => {
      lvl.port.value = { ...lvl.port.value, tech };
      const [name, , max] = labels(lvl);
      return `${name} ${max}`;
    });
    expect(seen).toEqual(['RS-232 ≤L4', '1Mb ETH ≤L5', 'TOKEN ≤L6', '10BASE-T ≤L7', 'FAST ETH ≤L8', 'GbE ≤L9']);
  });

  it('counts dwarves through against the Capacity of the port Level', () => {
    const lvl = openPort(3);
    lvl.port.value = { ...lvl.port.value, passed: 1 };
    expect(labels(lvl)[1]).toBe('1/1');
    lvl.port.value = { ...lvl.port.value, level: 3, passed: 2 };
    expect(labels(lvl)[1]).toBe('2/2');
    lvl.port.value = { ...lvl.port.value, passed: 0 };
    expect(labels(lvl)[1]).toBe('0/2');
  });

  it('marks duplex with ⇅ in the leftmost cell only', () => {
    const lvl = openPort(3);
    expect([0, 1, 2].map((x) => portView(lvl, x, ctx()).corner)).toEqual([undefined, undefined, undefined]);
    lvl.port.value = { ...lvl.port.value, duplex: true };
    expect([0, 1, 2].map((x) => portView(lvl, x, ctx()).corner)).toEqual(['⇅', undefined, undefined]);
  });

  it('shows no labels or duplex mark on a buried port', () => {
    const lvl = makeLevelState(fixture());
    lvl.port.value = { ...lvl.port.value, duplex: true };
    for (const x of [1, 2]) {
      const v = portView(lvl, x, ctx());
      expect(v.label).toBeUndefined();
      expect(v.corner).toBeUndefined();
      expect(v.glyph).toBe('▒');
    }
  });

  it('labels a dug-out USB port only with USB', () => {
    const lvl = makeLevelState(fixture(4));
    lvl.port.value = { ...lvl.port.value, duplex: true, passed: 1 };
    expect([1, 2].map((x) => portView(lvl, x, ctx()).label)).toEqual([undefined, undefined]);
    lvl.exit.value = { buried: false, remaining: 0 };
    const views = [1, 2].map((x) => portView(lvl, x, ctx()));
    expect(views.map((v) => v.label)).toEqual(['USB', '']);
    expect(views.map((v) => v.corner)).toEqual([undefined, undefined]);
  });

  it('titles a USB port for sneakernet', () => {
    const lvl = makeLevelState(fixture(4));
    expect(portView(lvl, 1, ctx()).title).toBe('USB port: 240 B of rock in the way');
    lvl.exit.value = { buried: false, remaining: 0 };
    expect(portView(lvl, 1, ctx()).title).toBe('USB port: walk a dwarf under it to sneakernet');
  });

  it('never blinks the port: the view takes no open dialog', () => {
    const lvl = makeLevelState(fixture());
    lvl.exit.value = { buried: false, remaining: 0 };
    expect(portView(lvl, 1, ctx()).classes).toEqual(['wall', 'wall-port', 'wall-port-open']);
  });
});
