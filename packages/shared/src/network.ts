/**
 * The network port connects a level to the next one down. Its technology caps which dwarf
 * levels fit through; its level (raised with that technology's chips) sets how many may pass.
 * Switching to a newer technology resets the port to level 1.
 */
export interface NetworkTech {
  /** Also the id of the chips that upgrade it. */
  id: string;
  name: string;
  /** Highest dwarf level this technology can carry. */
  maxDwarfLevel: number;
  /** Speed label per port level (the last entry repeats past the end). */
  speeds: readonly string[];
}

export const NETWORK_TECHS = [
  {
    id: 'net:serial',
    name: 'Serial Port',
    maxDwarfLevel: 4,
    speeds: ['300 baud', '1200 baud', '2400 baud', '9600 baud', '19.2 kbps', '38.4 kbps', '57.6 kbps', '115.2 kbps'],
  },
  { id: 'net:ethernet-1m', name: '1 Mb Ethernet', maxDwarfLevel: 5, speeds: ['1 Mbps'] },
  { id: 'net:token-ring-2m', name: '2 Mb Token Ring', maxDwarfLevel: 6, speeds: ['2 Mbps'] },
  { id: 'net:ethernet-10m', name: '10BASE-T Ethernet', maxDwarfLevel: 7, speeds: ['10 Mbps'] },
  { id: 'net:fast-ethernet', name: 'Fast Ethernet', maxDwarfLevel: 8, speeds: ['100 Mbps'] },
  { id: 'net:gigabit', name: 'Gigabit Ethernet', maxDwarfLevel: 9, speeds: ['1 Gbps'] },
] as const satisfies readonly NetworkTech[];

/** The id of one Port technology in NETWORK_TECHS. */
export type NetworkTechId = (typeof NETWORK_TECHS)[number]['id'];

/** One entry of NETWORK_TECHS, with its id narrowed to a NetworkTechId. */
export type NetworkTechEntry = (typeof NETWORK_TECHS)[number];

/** The Port technology with this id. */
export function networkTech(id: NetworkTechId): NetworkTechEntry {
  return NETWORK_TECHS.find((t) => t.id === id)!;
}

/** The id of the Port technology at this position in NETWORK_TECHS; past the end, the last one. */
export function networkTechAt(index: number): NetworkTechId {
  return NETWORK_TECHS[Math.min(index, NETWORK_TECHS.length - 1)]!.id;
}

/** The Port technology a port rewires to after this one, or undefined after the last. */
export function nextNetworkTech(id: NetworkTechId): NetworkTechEntry | undefined {
  return NETWORK_TECHS[NETWORK_TECHS.findIndex((t) => t.id === id) + 1];
}

/** Chip that lets dwarves travel back up through a port. */
export const DUPLEX_CHIP = 'duplex';
/** Chip that automates a device (it collects its own output). */
export const CRON_CHIP = 'cron';

export interface PortState {
  tech: NetworkTechId;
  level: number;
  duplex: boolean;
  /** Dwarves currently on the far side that came through this port. */
  passed: number;
}

export const NEW_PORT: PortState = { tech: 'net:serial', level: 1, duplex: false, passed: 0 };

/** floor(L/2) + 1 dwarves may be through the port at once. */
export function portCapacity(level: number): number {
  return Math.floor(level / 2) + 1;
}

export function portSpeed(port: PortState): string {
  const t = networkTech(port.tech);
  return t.speeds[Math.min(port.level, t.speeds.length) - 1]!;
}
