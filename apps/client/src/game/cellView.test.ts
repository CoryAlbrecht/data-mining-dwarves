import { describe, expect, it } from 'vitest';
import { bufferCap, getDeviceModel, PORT_TECHS, type Block, type LevelDef } from '@dmd/shared';
import { dig, produceFor } from '../state/actions.ts';
import { deviceLevels, EXIT, levels, makeLevelState, type Dwarf, type LevelState } from '../state/world.ts';
import { cellView, portView, type ViewContext } from './cellView.ts';
import { bigLabel, noLabel, smallLabel, type PortLabel } from './labels.ts';

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
        collect: '⇩', spawn: '+', upgrade: '⇧',
      },
    },
  };
}

const ctx = (over: Partial<ViewContext> = {}): ViewContext => ({ dwarves: [], deviceLevels: {}, ...over });

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

  it('hands over the dwarf standing on a cell', () => {
    const lvl = makeLevelState(fixture());
    const d = dwarf(1, 9);
    expect(cellView(lvl, 9, ctx({ dwarves: [d] })).dwarf).toBe(d);
    expect(cellView(lvl, 9, ctx({ dwarves: [{ ...d, depth: 2 }] })).dwarf).toBeUndefined();
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

  it('pulses the full Collect button with its usual glyph', () => {
    const lvl = uncovered();
    lvl.buffers.value = [bufferCap(getDeviceModel('cpu:4004-cpu'), 1) - 1];
    expect(cellView(lvl, 6, ctx()).classes).not.toContain('cell-full');
    lvl.buffers.value = [bufferCap(getDeviceModel('cpu:4004-cpu'), 1)];
    expect(cellView(lvl, 6, ctx())).toMatchObject({ glyph: '⇩', classes: expect.arrayContaining(['cell-full']) });
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

  it('shows a producing automated Device filling up before its cron job empties it', () => {
    const lvl = uncovered();
    lvl.automated.value = [0];
    levels.value = [lvl];
    deviceLevels.value = {};
    produceFor(100); // a third of the 300 s Buffer
    const [top, , bottom] = fills(lvl);
    expect(top).toBe(0);
    expect(bottom).toBeGreaterThan(0);
    levels.value = [];
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
      glyph: '', tiny: null, title: 'Network port', classes: ['wall', 'wall-port', 'wall-port-open'], label: bigLabel('0/1', '≤L4'),
    });
  });

  it('labels a dug-out 2-wide Network port with its technology, then in use/Capacity stacked over highest Level', () => {
    const lvl = makeLevelState(fixture());
    lvl.exit.value = { buried: false, remaining: 0 };
    expect([1, 2].map((x) => portView(lvl, x, ctx()).label)).toEqual([smallLabel('RS-232'), bigLabel('0/1', '≤L4')]);
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
  const cellsOf = (lvl: LevelState) => Array.from({ length: lvl.def.exit.width }, (_, k) => portView(lvl, lvl.def.exit.x + k, ctx()).label!);
  /** Each cell's text, its lines joined by a space. */
  const labels = (lvl: LevelState) => cellsOf(lvl).map((l: PortLabel) => l.lines.join(' '));

  it('spreads the labels over a 3-wide port', () => {
    expect(cellsOf(openPort(3))).toEqual([smallLabel('RS-232'), bigLabel('0/1'), bigLabel('≤L4')]);
  });

  it('adds the port speed on a 4-wide port', () => {
    const lvl = openPort(4);
    expect(cellsOf(lvl)).toEqual([smallLabel('RS-232'), smallLabel('300 baud'), bigLabel('0/1'), bigLabel('≤L4')]);
    lvl.port.value = { ...lvl.port.value, level: 4 };
    expect(labels(lvl)).toEqual(['RS-232', '9600 baud', '0/3', '≤L4']);
  });

  it('gives every Port technology its short name and highest dwarf Level', () => {
    const lvl = openPort(3);
    const seen = PORT_TECHS.map(({ id }) => {
      lvl.port.value = { ...lvl.port.value, tech: id };
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
    expect(views.map((v) => v.label)).toEqual([smallLabel('USB'), noLabel()]);
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

describe('dig bar', () => {
  it('shows no bar on a rock with no dwarf', () => {
    expect(cellView(makeLevelState(fixture()), 1, ctx()).digBar).toBeUndefined();
  });

  it('shows no bar on a rock a dwarf stands next to but is not digging', () => {
    const lvl = makeLevelState(fixture());
    expect(cellView(lvl, 0, ctx({ dwarves: [dwarf(1, 4, 5)] })).digBar).toBeUndefined();
  });

  it('shows remaining / size on a rock a dwarf is digging', () => {
    const def = fixture();
    def.blocks[0] = rock({ remaining: 30 });
    expect(cellView(makeLevelState(def), 0, ctx({ dwarves: [dwarf(1, 4, 0)] })).digBar).toBe(0.25);
  });

  it('shows the bar on an encrypted bit-rock being dug', () => {
    const def = fixture();
    def.blocks[0] = rock({ encrypted: true, remaining: 60 });
    expect(cellView(makeLevelState(def), 0, ctx({ dwarves: [dwarf(1, 4, 0)] })).digBar).toBe(0.5);
  });

  it('adds up the strikes of several dwarves digging the same rock', () => {
    const lvl = makeLevelState(fixture());
    const diggers = ctx({ dwarves: [dwarf(1, 4, 5), dwarf(2, 9, 5)] });
    dig(lvl, 5, 30);
    dig(lvl, 5, 30);
    expect(cellView(lvl, 5, diggers).digBar).toBe(0.5);
  });

  it('shows the whole Device fraction on every cell of a buried Device when any cell is targeted', () => {
    const lvl = makeLevelState(fixture());
    lvl.devices.value = [{ buried: true, remaining: 90 }];
    const c = ctx({ dwarves: [dwarf(1, 11, 7)] });
    expect(cellView(lvl, 6, c).digBar).toBe(0.75);
    expect(cellView(lvl, 7, c).digBar).toBe(0.75);
  });

  it('shows no bar on a dug-out Device', () => {
    const lvl = uncovered();
    expect(cellView(lvl, 6, ctx({ dwarves: [dwarf(1, 10, 6)] })).digBar).toBeUndefined();
  });

  it('shows the bar on every port cell while a dwarf digs the port', () => {
    const lvl = makeLevelState(fixture());
    lvl.exit.value = { buried: true, remaining: 60 };
    const c = ctx({ dwarves: [dwarf(1, 1, EXIT)] });
    expect(portView(lvl, 1, c).digBar).toBe(0.25);
    expect(portView(lvl, 2, c).digBar).toBe(0.25);
    expect(portView(lvl, 1, ctx()).digBar).toBeUndefined();
  });

  it('shows the bar on the USB port while it is dug', () => {
    const lvl = makeLevelState(fixture(4));
    const c = ctx({ dwarves: [{ ...dwarf(1, 1, EXIT), depth: 4 }] });
    expect(portView(lvl, 1, c).digBar).toBe(1);
  });

  it('ignores dwarves digging the same cell in another Mine', () => {
    const lvl = makeLevelState(fixture());
    expect(cellView(lvl, 0, ctx({ dwarves: [{ ...dwarf(1, 4, 0), depth: 2 }] })).digBar).toBeUndefined();
  });

  it('drops the bar once the dwarf leaves a half-dug rock, keeping the wear glyph', () => {
    const def = fixture();
    def.blocks[0] = rock({ remaining: 50 });
    const lvl = makeLevelState(def);
    expect(cellView(lvl, 0, ctx({ dwarves: [dwarf(1, 4, 0)] })).digBar).toBeCloseTo(50 / 120);
    const v = cellView(lvl, 0, ctx({ dwarves: [dwarf(1, 8, null)] }));
    expect(v.digBar).toBeUndefined();
    expect(v.glyph).toBe('▒');
  });
});
