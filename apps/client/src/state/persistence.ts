import { batch, effect } from '@preact/signals-react';
import { ensureStartingDwarf, loadLevel, produceFor, say } from './actions.ts';
import {
  bytes,
  deviceLevels,
  dwarves,
  dwarvesBought,
  inventory,
  levels,
  lifetimeBytes,
  type Dwarf,
  type SavedLevel,
} from './world.ts';
import { formatBytes } from '../game/format.ts';

const KEY = 'dmd-save-v5'; // v5: walls, multi-cell Devices, holes
const MAX_OFFLINE_SECONDS = 8 * 60 * 60;

interface SaveFile {
  bytes: number;
  lifetimeBytes: number;
  dwarves: Dwarf[];
  dwarvesBought: number;
  inventory: Record<string, number>;
  deviceLevels: Record<string, number>;
  levels: SavedLevel[];
  savedAt: number;
}

function write() {
  const save: SaveFile = {
    bytes: bytes.peek(),
    lifetimeBytes: lifetimeBytes.peek(),
    dwarves: dwarves.peek(),
    dwarvesBought: dwarvesBought.peek(),
    inventory: inventory.peek(),
    deviceLevels: deviceLevels.peek(),
    levels: levels.peek().map((l) => ({
      depth: l.def.depth,
      blocks: l.blocks.peek(),
      devices: l.devices.peek(),
      exit: l.exit.peek(),
      buffers: l.buffers.peek(),
      automated: l.automated.peek(),
      port: l.port.peek(),
    })),
    savedAt: Date.now(),
  };
  try {
    localStorage.setItem(KEY, JSON.stringify(save));
  } catch {
    /* storage full or blocked: the game still runs, it just won't persist */
  }
}

/** Restore the save (rebuilding the level chain and crediting offline output), then keep it saved. */
export async function initPersistence(): Promise<void> {
  let save: SaveFile | null = null;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) save = JSON.parse(raw) as SaveFile;
  } catch {
    // Corrupt or unavailable storage: start fresh.
  }

  if (save) {
    batch(() => {
      bytes.value = save.bytes;
      lifetimeBytes.value = save.lifetimeBytes;
      dwarves.value = save.dwarves.map((d) => ({ ...d, target: null, path: [], goal: null }));
      dwarvesBought.value = save.dwarvesBought;
      inventory.value = save.inventory;
      deviceLevels.value = save.deviceLevels;
    });
    // Levels are deterministic and cached by the service worker, so refetch defs and lay saves on top.
    for (const saved of [...save.levels].sort((a, b) => a.depth - b.depth)) {
      if (!(await loadLevel(saved.depth, saved))) break;
    }
    const away = Math.min(MAX_OFFLINE_SECONDS, (Date.now() - save.savedAt) / 1000);
    const before = bytes.value;
    produceFor(away);
    const gained = bytes.value - before;
    if (away > 60) {
      say(
        gained > 0
          ? `While you were away, cron jobs collected ${formatBytes(gained)}. Your devices have bytes waiting.`
          : 'Welcome back! Your devices have bytes waiting to be collected.',
      );
    }
  }
  if (levels.value.length === 0) await loadLevel(1);
  ensureStartingDwarf();

  // Throttle: something changes every tick, so save at most once a second (a debounce would never fire).
  let pending: ReturnType<typeof setTimeout> | undefined;
  effect(() => {
    void [bytes.value, dwarves.value, inventory.value, deviceLevels.value, dwarvesBought.value];
    for (const l of levels.value) void [l.blocks.value, l.devices.value, l.exit.value, l.buffers.value, l.automated.value, l.port.value];
    pending ??= setTimeout(() => {
      pending = undefined;
      write();
    }, 1000);
  });
  addEventListener('pagehide', write);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') write();
  });
}
