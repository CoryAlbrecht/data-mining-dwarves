import { GameDialog } from './components/Dialog.tsx';
import { DragGhost } from './components/DwarfToken.tsx';
import { Hud } from './components/Hud.tsx';
import { Inventory } from './components/Inventory.tsx';
import { LevelView } from './components/LevelView.tsx';
import { Ticker } from './components/Ticker.tsx';
import { levels, loading } from './state/world.ts';

export function App() {
  return (
    <div className="app">
      <div className="top">
        <h1 className="title">Data Mining Dwarves</h1>
        <Hud />
        <Ticker />
      </div>
      {/* The Chain grows upward: newest Mine on top, scroll down to visit older ones. */}
      <main className="chain">
        {[...levels.value].reverse().map((lvl) => (
          <LevelView key={lvl.def.depth} lvl={lvl} />
        ))}
        {levels.value.length === 0 && <p className="muted">{loading.value ? 'Spinning up the drill…' : 'No signal.'}</p>}
      </main>
      <Inventory />
      <DragGhost />
      <GameDialog />
    </div>
  );
}
