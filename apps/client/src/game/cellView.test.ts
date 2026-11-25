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

const ctx = (over: Partial<ViewContext> = {}): ViewContext => ({ dwarves: [], deviceLevels: {}, dialog: null, frame: 0, ...over });

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
    expect(cellView(lvl, 6, ctx({ deviceLevels: levels }))).toEqual({
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

  it('swaps the full Collect button through the Theme glyphs by frame and pulses it', () => {
    const lvl = uncovered();
    lvl.buffers.value = [bufferCap(getDeviceModel('cpu:4004-cpu'), 1)];
    expect(cellView(lvl, 6, ctx({ frame: 0 }))).toMatchObject({ glyph: '⇊', classes: expect.arrayContaining(['cell-full']) });
    expect(cellView(lvl, 6, ctx({ frame: 4 })).glyph).toBe('⇓');
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

  it('highlights every cell of the Device whose dialog is open', () => {
    const lvl = uncovered();
    const open = ctx({ dialog: { kind: 'device', depth: 1, device: 0 } });
    expect(cellView(lvl, 2, open).classes).toContain('cell-selected');
    expect(cellView(lvl, 6, open).classes).toContain('cell-selected');
    expect(cellView(lvl, 6, ctx({ dialog: { kind: 'device', depth: 2, device: 0 } })).classes).not.toContain('cell-selected');
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
    expect(portView(lvl, 2, ctx())).toEqual({ glyph: ' ', tiny: null, title: 'Network port', classes: ['wall', 'wall-port', 'wall-port-open'] });
  });

  it('titles a USB port for sneakernet', () => {
    const lvl = makeLevelState(fixture(4));
    expect(portView(lvl, 1, ctx()).title).toBe('USB port: 240 B of rock in the way');
    lvl.exit.value = { buried: false, remaining: 0 };
    expect(portView(lvl, 1, ctx()).title).toBe('USB port: walk a dwarf under it to sneakernet');
  });

  it('highlights the port while its dialog is open', () => {
    const lvl = makeLevelState(fixture());
    expect(portView(lvl, 1, ctx({ dialog: { kind: 'port', depth: 1 } })).classes).toContain('wall-selected');
    expect(portView(lvl, 1, ctx({ dialog: { kind: 'port', depth: 2 } })).classes).not.toContain('wall-selected');
  });
});
