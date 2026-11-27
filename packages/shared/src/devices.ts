import { tunable } from './tunables.ts';

/**
 * Hardware catalog. Every device model has a chip of the same id; chips work like cards:
 * spend enough of them and that model's level goes up, so it produces more bytes.
 *
 * Each kind has a ladder of models, oldest → newest. A model's `tier` is its rung on that ladder.
 * Which tier a level shows is decided per kind in computers.ts (CPUs change only between
 * computers; RAM and storage creep up level by level).
 */
export type DeviceKind = 'cpu' | 'dram' | 'storage' | 'vram' | 'forge';

export interface DeviceModel {
  /** Also the id of the chips that upgrade it. */
  id: string;
  kind: DeviceKind;
  name: string;
  pun: string;
  /** Rung on this kind's ladder (0 = oldest). */
  tier: number;
  /** Bytes per second at device level 1 (0 for devices that don't produce, like the forge). */
  baseRate: number;
}

type Ladder = ReadonlyArray<readonly [name: string, pun: string]>;

export type ProducingKind = Exclude<DeviceKind, 'forge'>;

const LADDERS: Record<ProducingKind, { rate: number; models: Ladder }> = {
  cpu: {
    rate: 1,
    models: [
      ['4004 CPU', '4 bits of pure ambition.'],
      ['8008 CPU', 'Twice the bits, twice the 0s.'],
      ['8080 CPU', 'Runs CP/M and errands.'],
      ['Z80 CPU', 'Zilog, not Zzz-log.'],
      ['8086 CPU', 'Segmentation fault? Segmentation feature.'],
      ['80286 CPU', 'Protected mode, unprotected puns.'],
      ['80386 CPU', 'Flat memory, sharp wit.'],
      ['80486 CPU', 'Now with a math co-pro-cessor.'],
      ['Pentium CPU', 'Divides opinion. And sometimes floats.'],
      ['Pentium Pro CPU', 'Went pro. Still dwarf-sized.'],
      ['Pentium II CPU', 'Comes in a cartridge, like a game.'],
      ['Athlon CPU', 'Goes the distance.'],
    ],
  },
  dram: {
    rate: 0.6,
    models: [
      ['1 kB DRAM', 'Remembers almost nothing. Relatable.'],
      ['4 kB DRAM', 'Four times the forgetting.'],
      ['8 kB DRAM', 'Byte-sized and proud.'],
      ['16 kB DRAM', 'Sixteen candles, kilobytes edition.'],
      ['64 kB DRAM', 'Should be enough for anyone. Probably.'],
      ['256 kB DRAM', 'A quarter meg of memories.'],
      ['640 kB DRAM', "Ought to be enough. (It wasn't.)"],
      ['1 MB DRAM', 'A whole meg! Mega!'],
      ['4 MB DRAM', 'Runs Windows. Slowly.'],
      ['16 MB DRAM', 'Sweet sixteen.'],
      ['64 MB DRAM', "Now we're SIMM-ing."],
      ['256 MB DRAM', 'DIMM-inishing returns.'],
    ],
  },
  storage: {
    rate: 0.4,
    models: [
      ['8″ 80 kB Floppy', 'Floppy by name, frisbee by nature.'],
      ['8″ 250 kB Floppy', 'Bigger plate, same lunch.'],
      ['5¼″ 160 kB Floppy', 'Single-sided, double-hearted.'],
      ['5¼″ 360 kB Floppy', 'Flip it. Notch it. Love it.'],
      ['3½″ 720 kB Floppy', 'Hard case, still floppy.'],
      ['3½″ 1.44 MB Floppy', 'The save icon, in person.'],
      ['10 MB Hard Drive', 'Spins up. Calms down.'],
      ['20 MB Hard Drive', 'Head crash survivor.'],
      ['40 MB Hard Drive', 'Click. Click. Click. (Normal.)'],
      ['100 MB Zip Disk', 'Zip it.'],
      ['540 MB Hard Drive', 'Spinning rust, polished.'],
      ['1 GB Hard Drive', 'A gig! The band is thrilled.'],
    ],
  },
  vram: {
    rate: 0.8,
    models: [
      ['2 kB VRAM', 'Text mode, but make it shiny.'],
      ['4 kB MDA VRAM', 'Monochrome and moody.'],
      ['16 kB CGA VRAM', 'Four colors. All of them loud.'],
      ['64 kB VRAM', 'Sees things more clearly now.'],
      ['256 kB EGA VRAM', 'Sixteen colors! Pick one.'],
      ['256 kB VGA VRAM', 'Mode 13h, baby.'],
      ['1 MB SVGA VRAM', 'Super. Very. Good. Actually.'],
      ['2 MB VRAM', 'Double-buffered, double-dared.'],
      ['4 MB VRAM', 'Can render a whole dwarf.'],
      ['1 GB VRAM', 'From the far future. How did this get here?'],
    ],
  },
};

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[½]/g, '.5')
    .replace(/[¼]/g, '.25')
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/^-|-$/g, '');

export const FORGE_ID = 'fork';

export const FORGE: DeviceModel = {
  id: FORGE_ID,
  kind: 'forge',
  name: 'fork()',
  pun: 'Spawns child processes. The children are dwarves.',
  tier: 0,
  baseRate: 0,
};

export const DEVICE_MODELS: readonly DeviceModel[] = [
  FORGE,
  ...(Object.entries(LADDERS) as [ProducingKind, (typeof LADDERS)['cpu']][]).flatMap(
    ([kind, ladder]) =>
      ladder.models.map(
        ([name, pun], i): DeviceModel => ({
          id: `${kind}:${slug(name)}`,
          kind,
          name,
          pun,
          tier: i,
          baseRate: Math.round(ladder.rate * 2 ** i * 100) / 100,
        }),
      ),
  ),
];

const BY_ID = new Map(DEVICE_MODELS.map((m) => [m.id, m]));

export function getDeviceModel(id: string): DeviceModel {
  const m = BY_ID.get(id);
  if (!m) throw new Error(`Unknown device model ${id}`);
  return m;
}

/** All models of a kind, oldest first. */
export function ladder(kind: ProducingKind): DeviceModel[] {
  return DEVICE_MODELS.filter((m) => m.kind === kind);
}

/** The model of `kind` at `tier`, clamped to the ladder. */
export function modelAt(kind: ProducingKind, tier: number): DeviceModel {
  const l = ladder(kind);
  return l[Math.max(0, Math.min(l.length - 1, tier))]!;
}

// ── Economy curves ────────────────────────────────────────────────────────────
export const ECONOMY = tunable('ECONOMY', {
  /** Chips to go from level L to L+1: ceil(chipBase · chipGrowth^(L−1)). */
  chipBase: 2,
  chipGrowth: 1.5,
  /** Output multiplier per device level. */
  outputGrowth: 1.5,
  /** A device's uncollected buffer holds this many seconds of output. */
  bufferSeconds: 300,
  /** Collecting does nothing below this many bytes in the Buffer. */
  minCollect: 0.5,
  /** Dwarf n (0-based count already bought) costs round(dwarfBase · dwarfGrowth^n) bytes. */
  dwarfBase: 50,
  dwarfGrowth: 1.25,
} as const);

export function chipsToUpgrade(level: number): number {
  return Math.ceil(ECONOMY.chipBase * ECONOMY.chipGrowth ** (level - 1));
}

export function deviceRate(model: DeviceModel, level: number): number {
  return model.baseRate * ECONOMY.outputGrowth ** (level - 1);
}

export function bufferCap(model: DeviceModel, level: number): number {
  return deviceRate(model, level) * ECONOMY.bufferSeconds;
}

export function dwarfPrice(alreadyBought: number): number {
  return Math.round(ECONOMY.dwarfBase * ECONOMY.dwarfGrowth ** alreadyBought);
}
