import { signal } from '@preact/signals-react';

/**
 * Animation frame counter for glyph animations (dancing dwarves, full Devices, the blinking
 * selected dwarf). Purely cosmetic: game rules never read it.
 */
export const frame = signal(0);

export const FRAME_MS = 180;

export function startClock(): () => void {
  const id = setInterval(() => (frame.value += 1), FRAME_MS);
  return () => clearInterval(id);
}
