import { getDeviceModel, networkTech, portCapacity, portSpeed, type DeviceKind, type NetworkTechId, type PortState } from '@dmd/shared';

/** Pads a list of cell labels with empty cells, or cuts it, to exactly `cells` entries. */
function padTo(out: string[], cells: number): string[] {
  while (out.length < cells) out.push('');
  return out.slice(0, cells);
}

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
  if (m.kind === 'forge') return padTo(['fork', '()'], cells);
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
  return padTo(out, cells);
}

/** Short Port technology names for the port's label cells, by technology id. */
const PORT_TECH_SHORT: Record<NetworkTechId, string> = {
  'net:serial': 'RS-232',
  'net:ethernet-1m': '1Mb ETH',
  'net:token-ring-2m': 'TOKEN',
  'net:ethernet-10m': '10BASE-T',
  'net:fast-ethernet': 'FAST ETH',
  'net:gigabit': 'GbE',
};

/**
 * Text for a dug-out Network port's cells, left to right, by port width:
 * 2 → [tech, "in use/Capacity ≤Lmax"]; 3 → [tech, "in use/Capacity", "≤Lmax"];
 * 4 → [tech, speed, "in use/Capacity", "≤Lmax"].
 */
export function portLabels(port: PortState, cells: number): string[] {
  const tech = networkTech(port.tech);
  const name = PORT_TECH_SHORT[tech.id];
  const use = `${port.passed}/${portCapacity(port.level)}`;
  const max = `≤L${tech.maxDwarfLevel}`;
  return padTo(cells <= 2 ? [name, `${use} ${max}`] : cells === 3 ? [name, use, max] : [name, portSpeed(port), use, max], cells);
}
