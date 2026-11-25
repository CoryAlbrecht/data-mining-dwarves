/**
 * Measures generated Mines, so a tuning change (holes, Rock curve, loot) is judged on numbers.
 *
 *   npm run mine-stats                 depths 1–12 (the first two Computers)
 *   npm run mine-stats -- 1 40         any depth range
 *
 * One row per depth, then the average.
 */
import { pathToFileURL } from 'node:url';
import { FORGE_ID, rockMedian, type LevelDef } from '@dmd/shared';
import { generateLevel } from '../apps/server/src/data/levels.ts';

export interface MineStats {
  depth: number;
  median: number;
  rocks: number;
  holes: number;
  monsters: number;
  encrypted: number;
  /** Producing Devices (CPU, DRAM, storage, VRAM) in the Mine. */
  devices: number;
  /** Chips for those Devices held by the Mine's bit-rocks, per Device. */
  chipsPerDevice: number;
  /** Share of bit-rocks holding bytes. */
  byteShare: number;
}

export function mineStats(def: LevelDef): MineStats {
  const producing = new Set(def.devices.filter((d) => d.model !== FORGE_ID).map((d) => d.model));
  let rocks = 0, holes = 0, monsters = 0, encrypted = 0, chips = 0, byteRocks = 0;
  for (const b of def.blocks) {
    if (b.kind === 'empty') holes++;
    else if (b.kind === 'monster') monsters++;
    else if (b.kind === 'rock') {
      rocks++;
      if (b.encrypted) encrypted++;
      if (b.loot.kind === 'bytes') byteRocks++;
      else if (producing.has(b.loot.chip)) chips += b.loot.count;
    }
  }
  return {
    depth: def.depth,
    median: rockMedian(def.depth),
    rocks,
    holes,
    monsters,
    encrypted,
    devices: producing.size,
    chipsPerDevice: producing.size ? chips / producing.size : 0,
    byteShare: rocks ? byteRocks / rocks : 0,
  };
}

/** Column, header, decimals per row, decimals in the average row. */
const COLUMNS: [keyof MineStats, string, number, number][] = [
  ['median', 'Median', 2, 2],
  ['rocks', 'Rocks', 0, 1],
  ['holes', 'Holes', 0, 1],
  ['monsters', 'Monsters', 0, 1],
  ['encrypted', 'Encrypted', 0, 1],
  ['devices', 'Devices', 0, 1],
  ['chipsPerDevice', 'Chips/Device', 2, 2],
  ['byteShare', 'Byte share', 2, 2],
];

function main() {
  const [from = 1, to = 12] = process.argv.slice(2).map(Number);
  const rows = Array.from({ length: to - from + 1 }, (_, k) => mineStats(generateLevel(from + k)));
  const avg = (k: keyof MineStats) => rows.reduce((a, r) => a + r[k], 0) / rows.length;
  const line = (cells: string[]) => `| ${cells.join(' | ')} |`;
  console.log(line(['Depth', ...COLUMNS.map(([, h]) => h)]));
  console.log(line(['---:', ...COLUMNS.map(() => '---:')]));
  for (const r of rows) console.log(line([String(r.depth), ...COLUMNS.map(([k, , dp]) => r[k].toFixed(dp))]));
  console.log(line([`avg ${from}–${to}`, ...COLUMNS.map(([k, , , dp]) => avg(k).toFixed(dp))]));
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main();
