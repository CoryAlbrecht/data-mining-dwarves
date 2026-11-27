import { batch } from '@preact/signals-react';
import {
  bufferCap,
  chipName,
  chipsToUpgrade,
  CRON_CHIP,
  deviceRate,
  DUPLEX_CHIP,
  dwarfPrice,
  ECONOMY,
  FORGE_ID,
  getDeviceModel,
  MONSTERS,
  neighbor,
  nextPortTech,
  portCapacity,
  portTech,
  TAP_DAMAGE,
  type Block,
  type Direction,
  type Loot,
} from '@dmd/shared';
import { api } from '../api/client.ts';
import { formatBytes } from '../game/format.ts';
import {
  arrivalCell,
  bytes,
  deviceDef,
  deviceLevels,
  dwarfAt,
  dwarves,
  dwarvesBought,
  EXIT,
  inventory,
  isMinable,
  isWalkable,
  levelAt,
  levelOf,
  levels,
  lifetimeBytes,
  loading,
  makeLevelState,
  message,
  selectedDwarf,
  dialogSubject,
  underExit,
  type Dwarf,
  type LevelState,
  type SavedLevel,
} from './world.ts';

const DIRS: Direction[] = ['up', 'left', 'down', 'right'];

/** Make a dwarf the Selected dwarf (keyboard commands go to it), or clear the selection with null. */
export function selectDwarf(id: number | null) {
  selectedDwarf.value = id;
}

export function say(text: string) {
  message.value = text;
}

export function earn(amount: number) {
  batch(() => {
    bytes.value += amount;
    lifetimeBytes.value += amount;
  });
}

function addChips(chip: string, count: number) {
  inventory.value = { ...inventory.value, [chip]: (inventory.value[chip] ?? 0) + count };
}

function spendChips(chip: string, count: number): boolean {
  const have = inventory.value[chip] ?? 0;
  if (have < count) {
    say(`Need ${count} × ${chipName(chip)} (you have ${have}).`);
    return false;
  }
  inventory.value = { ...inventory.value, [chip]: have - count };
  return true;
}

export function setBlock(lvl: LevelState, i: number, b: Block) {
  const next = lvl.blocks.value.slice();
  next[i] = b;
  lvl.blocks.value = next;
}

export function updateDwarf(id: number, patch: Partial<Dwarf>) {
  dwarves.value = dwarves.value.map((d) => (d.id === id ? { ...d, ...patch } : d));
}

function getDwarf(id: number): Dwarf | undefined {
  return dwarves.value.find((d) => d.id === id);
}

/** Collect the Item lying in cell `i`, if there is one: credit its loot and clear the cell. */
function pickUpItem(lvl: LevelState, i: number) {
  const b = lvl.blocks.value[i];
  if (b?.kind !== 'item') return;
  batch(() => {
    grantLoot(b.loot);
    setBlock(lvl, i, { kind: 'empty' });
  });
}

function grantLoot(loot: Loot) {
  if (loot.kind === 'bytes') {
    earn(loot.amount);
    say(`Picked up ${formatBytes(loot.amount)}.`);
  } else {
    addChips(loot.chip, loot.count);
    say(`Picked up ${loot.count > 1 ? `${loot.count} × ` : ''}${chipName(loot.chip)}!`);
  }
}

/** Free walkable cell nearest `from` (by walking distance), or null. */
function nearestFree(lvl: LevelState, from: number): number | null {
  const { width, height, depth } = lvl.def;
  const seen = new Set([from]);
  const queue = [from];
  while (queue.length) {
    const c = queue.shift()!;
    if (isWalkable(lvl.blocks.value[c]) && !dwarfAt(depth, c)) return c;
    for (const dir of DIRS) {
      const n = neighbor(c, dir, width, height);
      if (n === null || seen.has(n) || !isWalkable(lvl.blocks.value[n])) continue;
      seen.add(n);
      queue.push(n);
    }
  }
  return null;
}

// ── Mines ─────────────────────────────────────────────────────────────────────
/** Fetch and append a Mine to the Chain (or restore one from a save). */
export async function loadLevel(depth: number, saved?: SavedLevel): Promise<boolean> {
  if (levelAt(depth)) return true;
  loading.value = true;
  try {
    const def = await api.level(depth);
    const last = levels.value.at(-1)?.def.depth;
    if (!levelAt(depth) && (last === undefined || last === depth - 1)) {
      levels.value = [...levels.value, makeLevelState(def, saved)];
    }
    return true;
  } catch {
    say('Connection lost. The mine shaft is buffering…');
    return false;
  } finally {
    loading.value = false;
  }
}

// ── Digging ───────────────────────────────────────────────────────────────────
/** Stop every dwarf in this Mine whose target matches. */
function freeDiggers(lvl: LevelState, matches: (target: number) => boolean) {
  const depth = lvl.def.depth;
  if (dwarves.value.some((d) => d.depth === depth && d.target !== null && matches(d.target))) {
    dwarves.value = dwarves.value.map((d) =>
      d.depth === depth && d.target !== null && matches(d.target) ? { ...d, target: null } : d,
    );
  }
}

/**
 * Remove `amount` bytes from what's being mined: a rock cell, a buried Device (via any of its
 * cells), or EXIT (the port). Breaking a rock leaves its loot as an item; a Device or port is
 * uncovered all at once.
 */
export function dig(lvl: LevelState, target: number, amount: number) {
  batch(() => {
    if (target === EXIT) {
      const exit = lvl.exit.value;
      if (!exit.buried) return;
      const remaining = exit.remaining - amount;
      if (remaining > 1e-9) {
        lvl.exit.value = { ...exit, remaining };
        return;
      }
      lvl.exit.value = { buried: false, remaining: 0 };
      freeDiggers(lvl, (t) => t === EXIT);
      if (lvl.def.exit.kind === 'port') {
        say('Broke through to the network port! Walk a dwarf up into it to reach the next Mine.');
        void loadLevel(lvl.def.depth + 1);
      } else {
        say('Broke through to a USB port! A dwarf standing under it can take the sneakernet to a new computer.');
      }
      return;
    }
    const b = lvl.blocks.value[target];
    if (b?.kind === 'rock') {
      const remaining = b.remaining - amount;
      if (remaining > 1e-9) {
        setBlock(lvl, target, { ...b, remaining });
      } else {
        setBlock(lvl, target, { kind: 'item', loot: b.loot });
        freeDiggers(lvl, (t) => t === target);
      }
      return;
    }
    if (b?.kind === 'device') {
      const id = b.device;
      const state = lvl.devices.value[id];
      if (!state?.buried) return;
      const next = lvl.devices.value.slice();
      const remaining = state.remaining - amount;
      next[id] = remaining > 1e-9 ? { buried: true, remaining } : { buried: false, remaining: 0 };
      lvl.devices.value = next;
      if (remaining <= 1e-9) {
        const blocks = lvl.blocks.value;
        freeDiggers(lvl, (t) => t !== EXIT && blocks[t]?.kind === 'device' && (blocks[t] as { device: number }).device === id);
        const model = deviceDef(lvl, id).model;
        if (!deviceLevels.value[model]) deviceLevels.value = { ...deviceLevels.value, [model]: 1 };
        const m = getDeviceModel(model);
        say(`Uncovered: ${m.name}! ${m.pun}`);
      }
    }
  });
}

// ── Moving dwarves ────────────────────────────────────────────────────────────
const STOP = { path: [], goal: null };

/**
 * Try to step dwarf `id` into adjacent cell `n`. A rock or buried Device in the way gets mined
 * instead; a same-level dwarf merges; an item is picked up. Returns true if the dwarf moved.
 */
function stepInto(id: number, n: number, fromPath: boolean): boolean {
  const d = getDwarf(id);
  const lvl = d && levelAt(d.depth);
  if (!d || !lvl) return false;
  const b = lvl.blocks.value[n];

  if (isMinable(lvl, n)) {
    updateDwarf(id, { ...STOP, target: n });
    return false;
  }
  if (b?.kind === 'monster') {
    updateDwarf(id, STOP);
    say(`A ${MONSTERS[b.monster].name} is in the way. Tap it to fight!`);
    return false;
  }
  if (b?.kind === 'device') {
    updateDwarf(id, STOP);
    return false; // uncovered Devices are solid
  }

  const other = dwarfAt(d.depth, n);
  if (other) {
    if (other.level !== d.level) {
      updateDwarf(id, STOP);
      say(`An L${other.level} dwarf is in the way. Only same-level dwarves merge.`);
      return false;
    }
    batch(() => {
      dwarves.value = dwarves.value
        .filter((x) => x.id !== id)
        .map((x) => (x.id === other.id ? { ...x, level: x.level + 1, target: null, ...STOP } : x));
      if (selectedDwarf.value === id) selectedDwarf.value = other.id;
    });
    say(`Merged into an L${d.level + 1} dwarf!`);
    return true;
  }
  if (!isWalkable(b)) return false;

  batch(() => {
    updateDwarf(id, { pos: n, target: null, ...(fromPath ? { path: d.path.slice(1) } : STOP) });
    pickUpItem(lvl, n);
  });
  return true;
}

/** Up into the top Wall: mine the buried port, go through an open one, or stand by the USB port. */
function stepIntoExit(id: number): boolean {
  const d = getDwarf(id)!;
  const lvl = levelAt(d.depth)!;
  if (lvl.exit.value.buried) {
    updateDwarf(id, { ...STOP, target: EXIT });
    return false;
  }
  if (lvl.def.exit.kind === 'port') return travelDown(id);
  updateDwarf(id, STOP);
  dialogSubject.value = { kind: 'port', depth: d.depth };
  say('This dwarf is at the USB port. Ready to sneakernet to the next computer?');
  return false;
}

/** One keyboard step (WASD / arrows), including into the Walls. */
export function moveDwarf(id: number, dir: Direction) {
  const d = getDwarf(id);
  const lvl = d && levelAt(d.depth);
  if (!d || !lvl) return;
  const { def } = lvl;
  const n = neighbor(d.pos, dir, def.width, def.height);
  if (n !== null) {
    stepInto(id, n, false);
    return;
  }
  if (dir === 'up' && underExit(def, d.pos)) stepIntoExit(id);
  else if (dir === 'down' && d.pos === arrivalCell(def)) travelUp(id);
}

/** Path step used by the game loop. Returns true if the dwarf moved. */
export function walkStep(id: number): boolean {
  const d = getDwarf(id);
  if (!d || d.path.length === 0) return false;
  return stepInto(id, d.path[0]!, true);
}

/** After a walked path ends: start on the goal (a cell next to the dwarf, or the port above). */
export function reachGoal(id: number) {
  const d = getDwarf(id);
  const lvl = d && levelAt(d.depth);
  if (!d || !lvl || d.goal === null) return;
  if (d.goal === EXIT) {
    updateDwarf(id, { goal: null });
    if (underExit(lvl.def, d.pos)) stepIntoExit(id);
    return;
  }
  const adjacent = DIRS.some((dir) => neighbor(d.pos, dir, lvl.def.width, lvl.def.height) === d.goal);
  updateDwarf(id, adjacent && isMinable(lvl, d.goal) ? { target: d.goal, goal: null } : { goal: null });
}

/**
 * Drag-and-drop. Dropped on a hole: walk there. On a same-level dwarf: merge. On a rock or
 * buried Device: walk next to it and mine. On the port's stretch of Wall: walk under it and dig
 * (or go through).
 */
export function walkTo(id: number, depth: number, dest: number) {
  const d = getDwarf(id);
  const lvl = levelAt(depth);
  if (!d || !lvl) return;
  if (d.depth !== depth) {
    say('Dwarves can only walk around their own Mine. Use the network port to change Mines.');
    return;
  }
  const { width, height } = lvl.def;
  const bs = lvl.blocks.value;
  const destBlock = dest === EXIT ? undefined : bs[dest];

  // Which cells count as "arrived", and what to do there.
  let goal: number | null = null;
  let isDest: (c: number) => boolean;
  if (dest === EXIT) {
    goal = EXIT;
    isDest = (c) => underExit(lvl.def, c);
  } else if (isMinable(lvl, dest)) {
    goal = dest;
    // For a buried Device, standing next to any of its cells will do.
    const targets =
      destBlock?.kind === 'device'
        ? bs.flatMap((b, i) => (b.kind === 'device' && b.device === destBlock.device ? [i] : []))
        : [dest];
    const near = new Set(targets.flatMap((t) => DIRS.map((dir) => neighbor(t, dir, width, height))));
    isDest = (c) => near.has(c);
    // Aim the goal at the footprint cell actually next to where we end up (set below).
  } else if (destBlock?.kind === 'device') {
    say("Devices are solid. Dwarves can't stand on them.");
    return;
  } else {
    isDest = (c) => c === dest;
  }

  const finish = (at: number, path: number[]) => {
    let g = goal;
    if (g !== null && g !== EXIT && destBlock?.kind === 'device') {
      const adj = DIRS.map((dir) => neighbor(at, dir, width, height)).find(
        (n) => n !== null && bs[n]?.kind === 'device' && (bs[n] as { device: number }).device === destBlock.device,
      );
      g = adj ?? g;
    }
    updateDwarf(id, { path, goal: g, target: null });
    if (path.length === 0) reachGoal(id);
  };

  if (isDest(d.pos)) {
    finish(d.pos, []);
    return;
  }

  // BFS over walkable, unoccupied cells (a same-level dwarf is allowed as the final cell).
  const prev = new Map<number, number>([[d.pos, -1]]);
  const queue = [d.pos];
  let found: number | null = null;
  while (queue.length && found === null) {
    const c = queue.shift()!;
    for (const dir of DIRS) {
      const n = neighbor(c, dir, width, height);
      if (n === null || prev.has(n)) continue;
      const occupant = dwarfAt(depth, n);
      const mergeable = occupant?.level === d.level && goal === null && n === dest;
      if (!isWalkable(bs[n]) || (occupant && !mergeable)) continue;
      prev.set(n, c);
      if (isDest(n)) {
        found = n;
        break;
      }
      if (!occupant) queue.push(n);
    }
  }
  if (found === null) {
    say("Can't get there from here. Dig a way through first.");
    return;
  }
  const path: number[] = [];
  for (let c = found; c !== d.pos; c = prev.get(c)!) path.unshift(c);
  finish(found, path);
}

/** E key: collect from (or use) a Device next to the dwarf. */
export function useAdjacentDevice(id: number) {
  const d = getDwarf(id);
  const lvl = d && levelAt(d.depth);
  if (!d || !lvl) return;
  for (const dir of DIRS) {
    const n = neighbor(d.pos, dir, lvl.def.width, lvl.def.height);
    const b = n === null ? undefined : lvl.blocks.value[n];
    if (b?.kind === 'device' && !lvl.devices.value[b.device]?.buried) {
      useDevice(d.depth, b.device);
      return;
    }
  }
  say('Move next to a Device first.');
}

/** Through this Mine's open network port to just inside the next Mine's Entry. */
function travelDown(id: number): boolean {
  const d = getDwarf(id)!;
  const lvl = levelAt(d.depth)!;
  const port = lvl.port.value;
  const tech = portTech(port.tech);
  if (d.level > tech.maxDwarfLevel) {
    updateDwarf(id, STOP);
    say(`${tech.name} can't carry an L${d.level} dwarf (max L${tech.maxDwarfLevel}).`);
    return false;
  }
  if (port.passed >= portCapacity(port.level)) {
    updateDwarf(id, STOP);
    say(`The port is full (${port.passed}/${portCapacity(port.level)} dwarves through). Upgrade it for more.`);
    return false;
  }
  const next = levelAt(d.depth + 1);
  if (!next) {
    updateDwarf(id, STOP);
    say('Still connecting to the next Mine…');
    void loadLevel(d.depth + 1);
    return false;
  }
  const arrive = arrivalCell(next.def);
  if (dwarfAt(next.def.depth, arrive)) {
    updateDwarf(id, STOP);
    say(`The Entry of Mine ${next.def.depth} is blocked. Move that dwarf out of the way first.`);
    return false;
  }
  batch(() => {
    updateDwarf(id, { depth: next.def.depth, pos: arrive, target: null, ...STOP });
    lvl.port.value = { ...port, passed: port.passed + 1 };
  });
  say(`Connected to Mine ${next.def.depth}! (${port.passed + 1}/${portCapacity(port.level)} through)`);
  return true;
}

/** Down through the Entry, back up to the Mine before (needs a duplex chip in that Mine's port). */
function travelUp(id: number): boolean {
  const d = getDwarf(id)!;
  const above = levelAt(d.depth - 1);
  if (!above) return false;
  if (!above.port.value.duplex) {
    say(`The port in Mine ${above.def.depth} is half duplex. Install a Duplex chip to come back up.`);
    return false;
  }
  const { x, width } = above.def.exit;
  const spots = Array.from({ length: width }, (_, k) => x + k).filter(
    (c) => isWalkable(above.blocks.value[c]) && !dwarfAt(above.def.depth, c),
  );
  if (spots.length === 0) {
    say(`No room under the port in Mine ${above.def.depth}.`);
    return false;
  }
  batch(() => {
    updateDwarf(id, { depth: above.def.depth, pos: spots[0]!, target: null, ...STOP });
    above.port.value = { ...above.port.value, passed: Math.max(0, above.port.value.passed - 1) };
  });
  say(`Back up to Mine ${above.def.depth}.`);
  return true;
}

// ── Tapping ───────────────────────────────────────────────────────────────────
/** Tap a cell: pick up an Item, fight a monster, or use a Device spot (collect / upgrade / details). */
export function tapCell(depth: number, i: number) {
  const lvl = levelAt(depth);
  const b = lvl?.blocks.value[i];
  if (!lvl || !b) return;
  if (b.kind === 'monster') {
    if (!lvl.exposed.value.has(i)) return;
    if (b.hp > TAP_DAMAGE) setBlock(lvl, i, { ...b, hp: b.hp - TAP_DAMAGE });
    else {
      const m = MONSTERS[b.monster];
      earn(m.bounty);
      say(`Squashed a ${m.name}! +${formatBytes(m.bounty)}`);
      setBlock(lvl, i, { kind: 'empty' });
    }
    return;
  }
  if (b.kind === 'device') {
    if (lvl.devices.value[b.device]?.buried) {
      say('Buried hardware. Move a dwarf next to it to dig it out.');
      return;
    }
    if (b.role === 'collect') useDevice(depth, b.device);
    else if (b.role === 'upgrade') upgradeDevice(deviceDef(lvl, b.device).model);
    else dialogSubject.value = { kind: 'device', depth, device: b.device };
    return;
  }
  if (b.kind === 'item') pickUpItem(lvl, i);
  if (b.kind === 'rock') say('Move a dwarf next to it (or drag one onto it) to mine it.');
}

/** Tap the Network or USB port's stretch of Wall: open its dialog. */
export function tapExit(depth: number) {
  dialogSubject.value = { kind: 'port', depth };
}

/** Close the Device or port dialog, if one is open. */
export function closeDialog() {
  dialogSubject.value = null;
}

/** A Device's Collect button: collect its bytes, or for fork(), buy a dwarf. */
export function useDevice(depth: number, id: number) {
  const lvl = levelAt(depth);
  if (!lvl) return;
  if (deviceDef(lvl, id).model === FORGE_ID) buyDwarf(depth);
  else collect(depth, id);
}

// ── Devices ───────────────────────────────────────────────────────────────────
export function collect(depth: number, id: number) {
  const lvl = levelAt(depth);
  const amount = lvl?.buffers.value[id] ?? 0;
  if (!lvl || amount < ECONOMY.minCollect) return;
  batch(() => {
    earn(amount);
    const next = lvl.buffers.value.slice();
    next[id] = 0;
    lvl.buffers.value = next;
  });
  say(`Collected ${formatBytes(amount)}.`);
}

/** Spend chips to raise a Device model's Level (affects every Device of that model). */
export function upgradeDevice(model: string) {
  const level = levelOf(model);
  if (!spendChips(model, chipsToUpgrade(level))) return;
  deviceLevels.value = { ...deviceLevels.value, [model]: level + 1 };
  say(`${getDeviceModel(model).name} is now Level ${level + 1}.`);
}

/** Use a cron job chip: the Device collects its own bytes from now on. */
export function automate(depth: number, id: number) {
  const lvl = levelAt(depth);
  if (!lvl || lvl.automated.value.includes(id)) return;
  if (!spendChips(CRON_CHIP, 1)) return;
  batch(() => {
    lvl.automated.value = [...lvl.automated.value, id];
    collect(depth, id);
  });
  say('Scheduled a cron job. This Device collects its own bytes now.');
}

/** fork(): buy a dwarf at fork()'s Level. It appears on the free cell nearest the Entry. */
export function buyDwarf(depth: number) {
  const lvl = levelAt(depth);
  if (!lvl) return;
  const price = dwarfPrice(dwarvesBought.value);
  if (bytes.value < price) {
    say(`A new dwarf costs ${formatBytes(price)}. Keep digging!`);
    return;
  }
  const spot = nearestFree(lvl, arrivalCell(lvl.def));
  if (spot === null) {
    say('No room near the Entry for a new dwarf. Move someone out of the way.');
    return;
  }
  const level = levelOf(FORGE_ID);
  const id = Math.max(0, ...dwarves.value.map((d) => d.id)) + 1;
  batch(() => {
    bytes.value -= price;
    dwarvesBought.value += 1;
    dwarves.value = [...dwarves.value, { id, level, depth, pos: spot, target: null, ...STOP }];
    selectedDwarf.value = id;
  });
  say(`fork() spawned an L${level} dwarf.`);
}

// ── Network port upgrades ─────────────────────────────────────────────────────
export function upgradePort(depth: number) {
  const lvl = levelAt(depth);
  if (!lvl) return;
  const port = lvl.port.value;
  const tech = portTech(port.tech);
  if (!spendChips(tech.id, chipsToUpgrade(port.level))) return;
  lvl.port.value = { ...port, level: port.level + 1 };
  say(`${tech.name} upgraded to Level ${port.level + 1}.`);
}

/** Switch to the next Port technology. Carries bigger dwarves, but drops back to Level 1. */
export function upgradePortTech(depth: number) {
  const lvl = levelAt(depth);
  if (!lvl) return;
  const port = lvl.port.value;
  const next = nextPortTech(port.tech);
  if (!next) return;
  if (!spendChips(next.id, chipsToUpgrade(1))) return;
  lvl.port.value = { ...port, tech: next.id, level: 1 };
  say(`Rewired for ${next.name}! It carries up to L${next.maxDwarfLevel} dwarves, but it's back to Level 1.`);
}

export function installDuplex(depth: number) {
  const lvl = levelAt(depth);
  if (!lvl || lvl.port.value.duplex) return;
  if (!spendChips(DUPLEX_CHIP, 1)) return;
  lvl.port.value = { ...lvl.port.value, duplex: true };
  say(`Full duplex! Dwarves in Mine ${depth + 1} can walk down through its Entry to come back up.`);
}

/**
 * Fill Device buffers as if `seconds` passed (also used for offline time).
 * A cron job empties an automated Device's Buffer into your bytes each time it fills.
 */
export function produceFor(seconds: number) {
  batch(() => {
    for (const lvl of levels.value) {
      const buf = lvl.buffers.value.slice();
      let changed = false;
      lvl.def.devices.forEach((d, id) => {
        if (lvl.devices.value[id]?.buried) return;
        const model = getDeviceModel(d.model);
        if (model.baseRate === 0) return;
        const level = levelOf(d.model);
        const cap = bufferCap(model, level);
        let v = (buf[id] ?? 0) + deviceRate(model, level) * seconds;
        if (lvl.automated.value.includes(id)) {
          // A cron job empties every full Buffer; output past the cap carries over.
          const full = Math.floor(v / cap);
          if (full > 0) {
            earn(full * cap);
            v -= full * cap;
          }
        } else {
          v = Math.min(cap, v);
        }
        if (v !== buf[id]) {
          buf[id] = v;
          changed = true;
        }
      });
      if (changed) lvl.buffers.value = buf;
    }
  });
}

/** A fresh start: one L1 dwarf just inside the first Mine's Entry. */
export function ensureStartingDwarf() {
  const first = levels.value[0];
  if (first && dwarves.value.length === 0) {
    dwarves.value = [{ id: 1, level: 1, depth: first.def.depth, pos: arrivalCell(first.def), target: null, ...STOP }];
    selectedDwarf.value = 1;
  }
}

/**
 * Sneakernet: a dwarf standing under the open USB port carries the data to the next Computer.
 * The old Computer is gone for good. You keep bytes, chips and Device Levels, and start over with
 * a single L1 dwarf.
 */
export async function sneakernet(depth: number) {
  const lvl = levelAt(depth);
  if (!lvl || lvl.def.exit.kind !== 'usb' || lvl.exit.value.buried) return;
  const carrier = dwarves.value.some((d) => d.depth === depth && underExit(lvl.def, d.pos));
  if (!carrier) {
    say('Walk a dwarf under the USB port first. Someone has to carry the stick.');
    return;
  }
  loading.value = true;
  try {
    const def = await api.level(depth + 1);
    batch(() => {
      levels.value = [makeLevelState(def)];
      dwarves.value = [{ id: 1, level: 1, depth: def.depth, pos: arrivalCell(def), target: null, ...STOP }];
      dwarvesBought.value = 0;
      selectedDwarf.value = 1;
      dialogSubject.value = null;
    });
    say(`Sneakernet complete! Welcome to computer ${def.computer + 1}: ${def.theme.name}.`);
  } catch {
    say('The USB stick is corrupted. (Network error. Try again.)');
  } finally {
    loading.value = false;
  }
}
