import { networkTechAt, type NetworkTechId, type PortState } from '@dmd/shared';
import type { SavedLevel } from './world.ts';

/** A port as a save may hold it: saves from before technology ids keep an index into NETWORK_TECHS. */
export type StoredPort = Omit<PortState, 'tech'> & { tech: NetworkTechId | number };

/** A Mine as a save may hold it, before migration. */
export type StoredLevel = Omit<SavedLevel, 'port'> & { port: StoredPort };

/** Bring a saved port up to date, keeping it on the same Port technology. */
export function migratePort(port: StoredPort): PortState {
  return { ...port, tech: typeof port.tech === 'number' ? networkTechAt(port.tech) : port.tech };
}

/** Bring a saved Mine up to date. */
export function migrateSavedLevel(level: StoredLevel): SavedLevel {
  return { ...level, port: migratePort(level.port) };
}
