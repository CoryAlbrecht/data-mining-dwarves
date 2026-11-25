import type { CSSProperties } from 'react';
import type { LevelTheme } from '@dmd/shared';

/** CSS colour variables for a Theme, shared by a Mine and the dialogs opened from it. */
export function themeVars(theme: LevelTheme): CSSProperties {
  return {
    '--rock': theme.palette.rock,
    '--rock-dark': theme.palette.rockDark,
    '--accent': theme.palette.accent,
  } as CSSProperties;
}
