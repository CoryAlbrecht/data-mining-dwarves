import { bytes, dwarves, levels, totalRate } from '../state/world.ts';
import { formatBytes } from '../game/format.ts';

export function Hud() {
  return (
    <header className="hud">
      <div className="hud-stat">
        <span className="hud-label">Depth</span>
        <span className="hud-value">{levels.value.at(-1)?.def.depth ?? 1}</span>
      </div>
      <div className="hud-stat hud-main">
        <span className="hud-label">Bytes</span>
        <span className="hud-value">{formatBytes(bytes.value)}</span>
        <span className="hud-sub">devices: {formatBytes(totalRate.value)}/s</span>
      </div>
      <div className="hud-stat">
        <span className="hud-label">Dwarves</span>
        <span className="hud-value">{dwarves.value.length}</span>
      </div>
    </header>
  );
}
