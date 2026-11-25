/**
 * Dev-only `?reset`: wipe everything the game keeps in this browser, so the next load is exactly
 * a first-time visit. Runs at boot, before the game (and its autosave) starts, then reloads.
 */

/** The browser storage the game uses: this origin's localStorage, Cache Storage and worker. */
export interface BrowserData {
  storage: Pick<Storage, 'length' | 'key' | 'getItem' | 'setItem' | 'removeItem'>;
  caches?: Pick<CacheStorage, 'keys' | 'delete'>;
  serviceWorker?: { getRegistrations(): Promise<readonly { unregister(): Promise<boolean> }[]> };
  reload(url: string): void;
}

/** Every key the game writes starts with this (saves of every version included). */
const GAME_KEY_PREFIX = 'dmd-';
/** Set by a reset so the fresh game can say so. */
const FRESH_START_KEY = 'dmd-fresh-start';

async function wipeGameData(b: BrowserData) {
  const keys = Array.from({ length: b.storage.length }, (_, i) => b.storage.key(i)).filter(
    (k): k is string => !!k?.startsWith(GAME_KEY_PREFIX),
  );
  for (const k of keys) b.storage.removeItem(k);
  if (b.caches) await Promise.all((await b.caches.keys()).map((n) => b.caches!.delete(n)));
  if (b.serviceWorker) await Promise.all((await b.serviceWorker.getRegistrations()).map((r) => r.unregister()));
}

/**
 * If this is a dev build and the URL has `?reset`, wipe the game's data and reload at the same
 * URL without the flag. Returns true when it did, and the caller must not start the game.
 */
export async function resetIfAsked(href: string, dev: boolean, b: BrowserData): Promise<boolean> {
  const url = new URL(href);
  if (!dev || !url.searchParams.has('reset')) return false;
  await wipeGameData(b);
  b.storage.setItem(FRESH_START_KEY, '1');
  url.searchParams.delete('reset');
  b.reload(url.href);
  return true;
}

/** True once after a reset, so the fresh game can tell the player. */
export function takeFreshStartNotice(storage: BrowserData['storage']): boolean {
  const fresh = storage.getItem(FRESH_START_KEY) !== null;
  storage.removeItem(FRESH_START_KEY);
  return fresh;
}
