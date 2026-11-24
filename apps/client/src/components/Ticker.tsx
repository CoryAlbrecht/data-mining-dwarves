import { message } from '../state/world.ts';

/** One-line status ticker for finds, merges, and puns. */
export function Ticker() {
  return (
    <p className="ticker" role="status" aria-live="polite">
      {message.value ?? 'Welcome to the data mines. Tab to a dwarf, move with WASD/arrows, or drag it. Dwarves mine whatever they bump into.'}
    </p>
  );
}
