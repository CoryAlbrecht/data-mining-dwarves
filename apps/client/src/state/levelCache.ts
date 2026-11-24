/**
 * Mines are cached forever, so a new generator version would otherwise leave players on old
 * Mines. At startup, drop every levels cache but the current one.
 */
import { LEVELS_CACHE, LEVELS_CACHE_PREFIX } from '@dmd/shared';

/** The cache names among `names` that hold Mines from an older generator. */
export function staleLevelCaches(names: string[]): string[] {
  return names.filter((n) => (n === LEVELS_CACHE_PREFIX || n.startsWith(`${LEVELS_CACHE_PREFIX}-v`)) && n !== LEVELS_CACHE);
}

/** Delete old generators' Mines. Safe to skip where the Cache API is missing. */
export async function dropStaleLevelCaches() {
  if (!globalThis.caches) return;
  await Promise.all(staleLevelCaches(await caches.keys()).map((n) => caches.delete(n)));
}
