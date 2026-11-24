import { getDeviceModel, type DeviceKind } from '@dmd/shared';

const KIND: Record<DeviceKind, string> = { cpu: 'CPU', dram: 'RAM', storage: 'DISK', vram: 'VID', forge: 'fork' };

/** Words a model name doesn't need on its label cells, and short forms for the rest. */
const SHORTEN: [RegExp, string][] = [
  [/\s*(CPU|DRAM|VRAM)\b/g, ''],
  [/\s*Floppy\b/g, ' FD'],
  [/\s*Hard Drive\b/g, ' HD'],
  [/\s*Zip Disk\b/g, ' ZIP'],
  [/(\d) (kB|MB|GB)/g, '$1$2'],
];

/**
 * Text for a Device's label cells, in reading order: the kind first, then the model spread over
 * the remaining cells. E.g. a 2×2 CPU → ["CPU", "4004"]; a 3×3 floppy → ["DISK", "5¼″", "360kB", "FD"…].
 */
export function deviceLabels(model: string, cells: number): string[] {
  const m = getDeviceModel(model);
  if (m.kind === 'forge') return ['fork', '()', ...Array<string>(Math.max(0, cells - 2)).fill('')].slice(0, cells);
  let name = m.name;
  for (const [re, to] of SHORTEN) name = name.replace(re, to);
  const words = name.trim().split(/\s+/);
  const out = [KIND[m.kind]];
  const room = cells - 1;
  // One word per cell; if there are more words than cells, the last cell takes the rest.
  for (const word of words) {
    if (out.length - 1 < room) out.push(word);
    else out[out.length - 1] = `${out.at(-1)}${word}`;
  }
  while (out.length < cells) out.push('');
  return out.slice(0, cells);
}
