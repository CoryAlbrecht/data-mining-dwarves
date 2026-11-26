import {
  buriedDeviceSize,
  byteLoot,
  chipCount,
  CRON_CHIP,
  DEVICE_MODELS,
  deviceFootprint,
  DUPLEX_CHIP,
  encryptedChipCount,
  encryptedChipPool,
  FORGE_ID,
  FORK_FOOTPRINT,
  hardwareFor,
  holeChance,
  LAYOUT,
  LOOT,
  lootKind,
  MINE_HEIGHT,
  MINE_WIDTH,
  mineSeed,
  monsterChance,
  monsterFor,
  MONSTER_SPAWN,
  MONSTERS,
  mulberry32,
  nextNetworkTech,
  placeOf,
  portSeed,
  portSize,
  portWidth,
  rockLevelCounts,
  rockMedian,
  rockSize,
  startTech,
  type Block,
  type DeviceDef,
  type DeviceRole,
  type LevelDef,
  type LevelGlyphs,
  type LevelTheme,
  type Loot,
} from '@dmd/shared';

const W = MINE_WIDTH;
const H = MINE_HEIGHT;

const WALL = { h: '═', v: '║', tl: '╔', tr: '╗', bl: '╚', br: '╝' };

/** Green-phosphor CRT. No emoji: everything here is plain BMP text. */
const CRT_GLYPHS: LevelGlyphs = {
  rock: ['▓', '▒', '░'],
  encrypted: ['╬', '┼', '·'],
  item: '¤',
  dwarf: ['☺', '☻', '☺', '☼'],
  wall: WALL,
  gapL: '╡',
  gapR: '╞',
  portBuried: '▒',
  portOpen: ' ',
  collect: '⇩',
  spawn: '+',
  upgrade: '⇧',
};

/** Placeholder skin for later Computers until the CGA theme exists. */
const TILE_GLYPHS: LevelGlyphs = {
  ...CRT_GLYPHS,
  rock: ['█', '▓', '▒'],
  encrypted: ['◘', '◙', '○'],
  item: '♦',
};

const CRT_THEMES: Omit<LevelTheme, 'style' | 'glyphs'>[] = [
  { name: 'C:\\> The Shallow Cache', palette: { rock: '#1f3d22', rockDark: '#0d1a0f', accent: '#5dff7a' } },
  { name: 'Legacy Code Caverns', palette: { rock: '#1d3a20', rockDark: '#0b170d', accent: '#5dff7a' } },
  { name: 'The BASIC Basement', palette: { rock: '#213f24', rockDark: '#0e1b10', accent: '#5dff7a' } },
];

const CLASSIC_THEMES: Omit<LevelTheme, 'style' | 'glyphs'>[] = [
  { name: 'The Data Lake (Frozen)', palette: { rock: '#5a6f80', rockDark: '#36444f', accent: '#7fd8ff' } },
  { name: 'Spaghetti Strata', palette: { rock: '#8a5a4a', rockDark: '#57372d', accent: '#ff9d6b' } },
  { name: 'The Deep Web', palette: { rock: '#4b4566', rockDark: '#2c2840', accent: '#c58bff' } },
];

/** The first computer is a green-phosphor terminal. TODO(cga): CGA 8-color text for computer 2. */
function themeFor(computer: number, index: number): LevelTheme {
  if (computer === 0) return { ...CRT_THEMES[index % CRT_THEMES.length]!, style: 'crt', glyphs: CRT_GLYPHS };
  return { ...CLASSIC_THEMES[index % CLASSIC_THEMES.length]!, style: 'classic', glyphs: TILE_GLYPHS };
}

const idx = (x: number, y: number) => y * W + x;

/**
 * Where the port sits in the top Wall. It has its own random stream, so retuning holes, rocks or
 * loot never moves the port under a saved Mine.
 */
function portX(seed: number, width: number): number {
  return Math.floor(mulberry32(portSeed(seed))() * (W - width + 1));
}

/**
 * Lay a Device's footprint into the grid. The collect and upgrade spots go in the column facing
 * the middle of the Mine (collect lowest, upgrade highest); the rest are label cells.
 */
function placeDevice(blocks: Block[], d: DeviceDef) {
  const inner = d.x === 0 ? d.x + d.w - 1 : d.x;
  let label = 0;
  for (let y = d.y; y < d.y + d.h; y++) {
    for (let x = d.x; x < d.x + d.w; x++) {
      let role: DeviceRole = 'label';
      if (x === inner && y === d.y + d.h - 1) role = 'collect';
      else if (x === inner && y === d.y) role = 'upgrade';
      blocks[idx(x, y)] = { kind: 'device', device: d.id, role, label: role === 'label' ? label++ : -1 };
    }
  }
}

/**
 * Deterministically generate a Mine. The same depth always yields the same Mine, which keeps
 * leaderboard runs comparable and lets the client cache Mines offline.
 */
export function generateLevel(depth: number): LevelDef {
  const seed = mineSeed(depth);
  const rand = mulberry32(seed);
  const pick = <T>(xs: readonly T[]): T => xs[Math.floor(rand() * xs.length)]!;
  const shuffle = <T>(xs: T[]): T[] => {
    for (let i = xs.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [xs[i], xs[j]] = [xs[j]!, xs[i]!];
    }
    return xs;
  };

  const place = placeOf(depth);
  const median = rockMedian(depth);
  const hardware = hardwareFor(depth);
  const blocks: (Block | null)[] = Array(W * H).fill(null);
  const devices: DeviceDef[] = [];

  // 1. fork(): a 2×2 in a bottom corner, uncovered from the start.
  const forkLeft = rand() < LAYOUT.forkLeftChance;
  const fork: DeviceDef = {
    id: 0,
    model: FORGE_ID,
    x: forkLeft ? 0 : W - FORK_FOOTPRINT.w,
    y: H - FORK_FOOTPRINT.h,
    w: FORK_FOOTPRINT.w,
    h: FORK_FOOTPRINT.h,
    buried: false,
    level: 0,
    size: 0,
  };
  devices.push(fork);

  // 2. The Entry: a middle column of the bottom Wall, never under fork().
  const entryCols = LAYOUT.entryColumns.filter((x) => x < fork.x || x >= fork.x + fork.w);
  const entry = pick(entryCols);

  // 3. Producing Devices against the sides, alternating, spread out vertically
  //    between the top clear row and the bottom clear rows.
  const { w: dw, h: dh } = deviceFootprint(place.computer);
  const top = LAYOUT.clearTop;
  const span = H - LAYOUT.clearTop - LAYOUT.clearBottom;
  const firstSide = rand() < LAYOUT.firstSideLeftChance ? 0 : 1;
  const sides: [typeof hardware, typeof hardware] = [[], []];
  hardware.forEach((m, k) => sides[(firstSide + k) % 2]!.push(m));
  sides.forEach((models, side) => {
    const gap = (span - models.length * dh) / (models.length + 1);
    models.forEach((m, k) => {
      devices.push({
        id: devices.length,
        model: m.id,
        x: side === 0 ? 0 : W - dw,
        y: top + Math.round(gap * (k + 1) + k * dh),
        w: dw,
        h: dh,
        buried: true,
        level: 0, // set from the rock curve below
        size: 0,
      });
    });
  });
  for (const d of devices) placeDevice(blocks as Block[], d);

  // 4. Holes: the whole bottom row, everything touching fork(), then 60% → 12% going up.
  const touchesFork = (x: number, y: number) =>
    x >= fork.x - 1 && x <= fork.x + fork.w && y >= fork.y - 1 && y <= fork.y + fork.h;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = idx(x, y);
      if (blocks[i]) continue;
      if (touchesFork(x, y) || rand() < holeChance(H - 1 - y)) blocks[i] = { kind: 'empty' };
    }
  }

  // 5. Monsters: scattered, never in the bottom 2 rows.
  const monster = monsterFor(depth);
  for (let y = 0; y < H - MONSTER_SPAWN.clearBottom; y++) {
    for (let x = 0; x < W; x++) {
      if (!blocks[idx(x, y)] && rand() < monsterChance(depth)) {
        blocks[idx(x, y)] = { kind: 'monster', monster, hp: MONSTERS[monster].hp };
      }
    }
  }

  // 6. Bit-rocks: Levels from a bell curve, easiest at the bottom, hardest at the top, then
  //    each rock has a 50% chance to swap with one up to 2 rows away.
  const rockCells: number[] = [];
  for (let y = H - 1; y >= 0; y--) {
    const row = shuffle(Array.from({ length: W }, (_, x) => idx(x, y)).filter((i) => !blocks[i]));
    rockCells.push(...row);
  }
  const levels = rockLevelCounts(rockCells.length, median).flatMap(([l, c]) => Array<number>(c).fill(l));
  const levelAt = new Map(rockCells.map((cell, k) => [cell, levels[k]!]));
  for (const cell of rockCells) {
    if (rand() >= LAYOUT.jitterChance) continue;
    const y = Math.floor(cell / W);
    const near = rockCells.filter((c) => c !== cell && Math.abs(Math.floor(c / W) - y) <= LAYOUT.jitterRows);
    if (!near.length) continue;
    const other = pick(near);
    const a = levelAt.get(cell)!;
    levelAt.set(cell, levelAt.get(other)!);
    levelAt.set(other, a);
  }

  const distinct = [...new Set(levels)].sort((a, b) => b - a);
  const hardest = distinct[0] ?? Math.round(median);
  const second = distinct[1] ?? hardest;

  // Chips worth finding here: this Mine's producing Devices (most often), fork(), and network chips.
  const deviceIds = hardware.map((d) => d.id);
  const tech = startTech(place.computer);
  const nextTech = nextNetworkTech(tech);
  const netChips = [tech, ...(nextTech && depth >= LOOT.nextTechFromDepth ? [nextTech.id] : [])];
  // Encrypted bit-rocks: producing Devices twice as likely as fork() or a network chip.
  const encryptedChips = encryptedChipPool(deviceIds, FORGE_ID, netChips);
  const here = new Set(deviceIds);
  const otherChips = DEVICE_MODELS.filter((m) => {
    const local = hardware.find((d) => d.kind === m.kind);
    return m.kind !== 'forge' && !here.has(m.id) && (!local || m.tier <= local.tier + LOOT.otherTierWindow);
  }).map((m) => m.id);

  const modelChips = (chip: string, level: number): Loot => ({ kind: 'chip', chip, count: chipCount(level, rand()) });
  const rockLoot = (level: number): Loot => {
    const kind = lootKind(rand());
    if (kind === 'device') return modelChips(pick(deviceIds), level);
    if (kind === 'fork') return modelChips(FORGE_ID, level);
    if (kind === 'network') return modelChips(pick(netChips), level);
    if (kind === 'other' && otherChips.length) return modelChips(pick(otherChips), level);
    if (kind === 'duplex') return { kind: 'chip', chip: DUPLEX_CHIP, count: 1 };
    if (kind === 'cron') return { kind: 'chip', chip: CRON_CHIP, count: 1 };
    return { kind: 'bytes', amount: byteLoot(depth, rand()) };
  };

  for (const cell of rockCells) {
    const level = levelAt.get(cell)!;
    const size = rockSize(level);
    const encrypted = level === hardest && distinct.length > 1 && rand() < LAYOUT.encryptedShare;
    blocks[cell] = encrypted
      ? { kind: 'rock', level, size, remaining: size, encrypted, loot: { kind: 'chip', chip: pick(encryptedChips), count: encryptedChipCount(level) } }
      : { kind: 'rock', level, size, remaining: size, loot: rockLoot(level) };
  }

  // 7. Hardness: buried Devices use the second-hardest Level; the port the hardest. Bigger
  //    masses hold proportionally more bytes, since more dwarves can dig them at once.
  for (const d of devices) {
    if (!d.buried) continue;
    d.level = second;
    d.size = buriedDeviceSize(second, d.w, d.h);
  }
  const pw = portWidth(place.computer);
  const exit = {
    kind: place.last ? ('usb' as const) : ('port' as const),
    x: portX(seed, pw),
    width: pw,
    level: hardest,
    size: portSize(hardest, pw),
  };

  return {
    depth,
    computer: place.computer,
    computerIndex: place.index,
    seed,
    width: W,
    height: H,
    entry,
    blocks: blocks as Block[],
    devices,
    exit,
    theme: themeFor(place.computer, place.index),
  };
}
