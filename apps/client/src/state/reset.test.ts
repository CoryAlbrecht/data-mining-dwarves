import { describe, expect, it } from 'vitest';
import { resetIfAsked, takeFreshStartNotice, type BrowserData } from './reset.ts';

/** A browser with an old game in it: a save, an older save, a non-game key, caches and a worker. */
function oldBrowser() {
  const store = new Map<string, string>([
    ['dmd-save-v5', '{"bytes":99}'],
    ['dmd-save-v4', '{}'],
    ['someone-else', 'keep me'],
  ]);
  const cacheNames = new Set(['dmd-levels-v4', 'dmd-fonts', 'workbox-precache-v2']);
  const unregistered: string[] = [];
  const reloads: string[] = [];
  const browser: BrowserData = {
    storage: {
      get length() {
        return store.size;
      },
      key: (i) => [...store.keys()][i] ?? null,
      getItem: (k) => store.get(k) ?? null,
      setItem: (k, v) => void store.set(k, v),
      removeItem: (k) => void store.delete(k),
    },
    caches: {
      keys: async () => [...cacheNames],
      delete: async (n) => cacheNames.delete(n),
    },
    serviceWorker: {
      getRegistrations: async () => [{ unregister: async () => (unregistered.push('sw'), true) }],
    },
    reload: (url) => void reloads.push(url),
  };
  return { browser, store, cacheNames, unregistered, reloads };
}

describe('dev ?reset', () => {
  it('wipes the save, caches and service worker, then reloads without the flag', async () => {
    const b = oldBrowser();
    const reset = await resetIfAsked('http://host:5173/?reset', true, b.browser);
    expect(reset).toBe(true);
    expect(b.store.has('dmd-save-v5')).toBe(false);
    expect(b.store.has('dmd-save-v4')).toBe(false);
    expect(b.store.get('someone-else')).toBe('keep me');
    expect(b.cacheNames.size).toBe(0);
    expect(b.unregistered).toEqual(['sw']);
    expect(b.reloads).toEqual(['http://host:5173/']);
  });

  it('keeps other URL flags, like ?speed, when it reloads', async () => {
    const b = oldBrowser();
    await resetIfAsked('http://host:5173/?speed=10&reset', true, b.browser);
    expect(b.reloads).toEqual(['http://host:5173/?speed=10']);
  });

  it('leaves the fresh-start line for the next page load, once', async () => {
    const b = oldBrowser();
    await resetIfAsked('http://host:5173/?reset', true, b.browser);
    expect(takeFreshStartNotice(b.browser.storage)).toBe(true);
    expect(takeFreshStartNotice(b.browser.storage)).toBe(false);
  });

  it('does nothing without the flag, so the game starts as usual', async () => {
    const b = oldBrowser();
    expect(await resetIfAsked('http://host:5173/?speed=10', true, b.browser)).toBe(false);
    expect(b.store.get('dmd-save-v5')).toBe('{"bytes":99}');
    expect(b.reloads).toEqual([]);
  });

  it('is ignored in a production build', async () => {
    const b = oldBrowser();
    expect(await resetIfAsked('https://game.example/?reset', false, b.browser)).toBe(false);
    expect(b.store.get('dmd-save-v5')).toBe('{"bytes":99}');
    expect(b.cacheNames.size).toBe(3);
  });

  it('still reloads without the flag if part of the wipe fails', async () => {
    const b = oldBrowser();
    b.browser.caches = { keys: async () => ['dmd-fonts'], delete: async () => Promise.reject(new Error('blocked')) };
    await resetIfAsked('http://host:5173/?reset', true, b.browser).catch(() => {});
    expect(b.store.has('dmd-save-v5')).toBe(false);
    expect(b.reloads).toEqual(['http://host:5173/']);
  });
});
