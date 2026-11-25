export type MonsterId = 'bug' | 'worm' | 'troll' | 'phisher' | 'kernel-panic';

export interface MonsterDef {
  id: MonsterId;
  name: string;
  /** Character drawn for this monster in glyph-based (CRT) levels. */
  glyph: string;
  pun: string;
  hp: number;
  /** Bytes awarded for squashing it. */
  bounty: number;
}

/** What breaking a bit-rock gives you. `chip` is any chip id (device model, network tech, special). */
export type Loot = { kind: 'bytes'; amount: number } | { kind: 'chip'; chip: string; count: number };

/** What a cell of a Device does when tapped. */
export type DeviceRole = 'collect' | 'upgrade' | 'label';

/**
 * A cell in a Mine. Bit-rocks have a Level, a size in bytes, and `remaining` bytes that dwarves
 * chip down to 0. Device cells point at a Device; the Device holds the shared state.
 */
export type Block =
  /** A hole: empty, walkable. Mined-out cells become holes too. */
  | { kind: 'empty' }
  /** Loot left by a broken bit-rock. A dwarf has to step on it to pick it up. */
  | { kind: 'item'; loot: Loot }
  | { kind: 'rock'; level: number; size: number; remaining: number; loot: Loot; encrypted?: boolean }
  | { kind: 'monster'; monster: MonsterId; hp: number }
  /** One cell of a Device's footprint. `label` numbers the label cells in reading order. */
  | { kind: 'device'; device: number; role: DeviceRole; label: number };

/** A Device mounted against a side of the Mine. Its footprint cells are `device` blocks. */
export interface DeviceDef {
  id: number;
  model: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** fork() starts uncovered; everything else starts buried. */
  buried: boolean;
  /** Hardness while buried: the Mine's second-hardest rock Level. */
  level: number;
  size: number;
}

/** The way on: a stretch of the top Wall. */
export interface ExitDef {
  kind: 'port' | 'usb';
  /** First column of the stretch. */
  x: number;
  width: number;
  /** Hardness: the Mine's hardest rock Level. */
  level: number;
  size: number;
}

/** How a level is drawn. Themes are skins only: they never change the rules. */
export type LevelStyle = 'crt' | 'classic';

/** Characters a Theme draws with. Everything in the Basic Multilingual Plane, no emoji. */
export interface LevelGlyphs {
  /** Bit-rock glyphs from untouched to nearly dug out. */
  rock: string[];
  encrypted: string[];
  item: string;
  /** Dwarf frames: [0] is idle; while mining it cycles through all of them. */
  dwarf: string[];
  /** Wall pieces: horizontal, vertical, corners (top-left, top-right, bottom-left, bottom-right). */
  wall: { h: string; v: string; tl: string; tr: string; bl: string; br: string };
  /** Ends of a port/Entry stretch of wall, and its fill when buried / open. */
  gapL: string;
  gapR: string;
  portBuried: string;
  portOpen: string;
  /** Device spots: collect, its slow "I'm full" cycle, fork()'s spawn, upgrade. */
  collect: string;
  collectFull: string[];
  spawn: string;
  upgrade: string;
}

export interface LevelTheme {
  name: string;
  style: LevelStyle;
  glyphs: LevelGlyphs;
  /** CSS colors the client applies to the mine for this level. */
  palette: { rock: string; rockDark: string; accent: string };
  /** Optional server-hosted art for the level (relative to the API origin). */
  tilesetUrl?: string;
}

export interface LevelDef {
  depth: number;
  /** Which computer this Mine belongs to (0-based) and its position in it. */
  computer: number;
  computerIndex: number;
  seed: number;
  width: number;
  height: number;
  /** Column of the Entry in the bottom Wall. */
  entry: number;
  /** Row-major, length === width * height. */
  blocks: Block[];
  devices: DeviceDef[];
  exit: ExitDef;
  theme: LevelTheme;
}

export interface LeaderboardEntry {
  playerName: string;
  depth: number;
  bytesMined: number;
  submittedAt: string;
}

export interface LeaderboardSubmission {
  playerName: string;
  depth: number;
  bytesMined: number;
}

export type StoreItemKind = 'cosmetic' | 'booster';

export interface StoreItem {
  id: string;
  name: string;
  description: string;
  kind: StoreItemKind;
  /** Price in bytes — in-game currency only. There is no real-money path. */
  price: number;
}

export interface PurchaseRequest {
  itemId: string;
  /** Client-reported balance. TODO: replace with a server-held wallet. */
  balance: number;
}

export type PurchaseResponse =
  | { ok: true; item: StoreItem; balance: number }
  | { ok: false; error: string };
