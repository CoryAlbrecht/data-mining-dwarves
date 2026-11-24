/**
 * Mines are cached forever, so a new generator version would otherwise leave players on old
 * Mines. At startup, drop every levels cache but the current one.
 */
import { LEVELS_CACHE } from '@dmd/shared';

/** The cache names among `names` that hold Mines from an older generator. */
export function staleLevelCaches(names: string[]): string[] {
  return names.filter((n) => (n === 'dmd-levels' || n.startsWith('dmd-levels-v')) && n !== LEVELS_CACHE);
}

/** Delete old generators' Mines. Safe to skip where the Cache API is missing. */
export async function dropStaleLevelCaches() {
  if (!globalThis.caches) return;
  await Promise.all(staleLevelCaches(await caches.keys()).map((n) => caches.delete(n)));
}
