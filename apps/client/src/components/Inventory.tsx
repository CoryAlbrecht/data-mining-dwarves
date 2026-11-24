import { chipName } from '@dmd/shared';
import { inventory } from '../state/world.ts';

export function Inventory() {
  const chips = Object.entries(inventory.value).filter(([, n]) => n > 0);
  return (
    <section className="inventory" aria-label="Chips">
      <h2>Chips</h2>
      {chips.length === 0 ? (
        <p className="muted">None yet. Bit-rocks that glint usually hold chips.</p>
      ) : (
        <ul>
          {chips.map(([id, n]) => (
            <li key={id}>
              <span>{chipName(id)}</span>
              <span>×{n}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
