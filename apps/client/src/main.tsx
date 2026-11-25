import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';
import { startClock } from './state/clock.ts';
import { startLoop } from './state/loop.ts';
import { startFollowing } from './state/follow.ts';
import { startKeyboard } from './state/keyboard.ts';
import { initPersistence } from './state/persistence.ts';
import { dropStaleLevelCaches } from './state/levelCache.ts';
import { resetIfAsked, takeFreshStartNotice } from './state/reset.ts';
import { say } from './state/actions.ts';
import './fonts/index.ts';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Game bootstrap happens once, outside React — no useEffect double-fire games.
async function boot() {
  // Dev `?reset` wipes this browser's game data and reloads; the game must not start (or save).
  const reset = await resetIfAsked(location.href, import.meta.env.DEV, {
    storage: localStorage,
    caches: globalThis.caches,
    serviceWorker: navigator.serviceWorker,
    reload: (url) => location.replace(url),
  }).catch(() => false);
  if (reset) return;

  startClock();
  startKeyboard();
  startFollowing();
  await dropStaleLevelCaches().catch(() => {}); // a cache we can't clear only means older Mines
  await initPersistence();
  try {
    if (takeFreshStartNotice(localStorage)) say('Fresh start: memory wiped.');
  } catch {
    /* storage blocked: nothing to announce */
  }
  startLoop();
}
void boot();
