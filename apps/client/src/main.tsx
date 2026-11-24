import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';
import { startClock } from './state/clock.ts';
import { startLoop } from './state/loop.ts';
import { startFollowing } from './state/follow.ts';
import { startKeyboard } from './state/keyboard.ts';
import { initPersistence } from './state/persistence.ts';
import './fonts/index.ts';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Game bootstrap happens once, outside React — no useEffect double-fire games.
startClock();
startKeyboard();
startFollowing();
void initPersistence().then(() => startLoop());
