import type { CSSProperties } from 'react';
import type { LevelTheme } from '@dmd/shared';
import { dwarves, type LevelState } from '../state/world.ts';
import { MineGrid } from './MineGrid.tsx';

/** CSS colour variables for a Theme, shared by a Mine and the dialogs opened from it. */
export function themeVars(theme: LevelTheme): CSSProperties {
  return {
    '--rock': theme.palette.rock,
    '--rock-dark': theme.palette.rockDark,
    '--accent': theme.palette.accent,
  } as CSSProperties;
}

/** One Mine of the Chain. Its look comes from the Theme (a skin only). */
export function LevelView({ lvl }: { lvl: LevelState }) {
  const { theme, depth, computer } = lvl.def;
  const style = themeVars(theme);
  const crew = dwarves.value.filter((d) => d.depth === depth);
  return (
    <section className={`level theme-${theme.style}`} style={style} aria-label={`Mine ${depth}`}>
      <header className="level-header">
        <span>
          Computer {computer + 1} · Mine {depth}
        </span>
        <span className="muted">{theme.name}</span>
      </header>
      <MineGrid lvl={lvl} />
      <p className="level-footer muted">
        {crew.length === 0 ? 'No dwarves here.' : `Dwarves: ${crew.map((d) => `L${d.level}`).join(' ')}`}
      </p>
    </section>
  );
}
