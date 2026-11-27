# Data Mining Dwarves: Formulas

Every formula and tunable number in the game, as the code has it today. Terms are defined in
[`GLOSSARY.md`](../GLOSSARY.md), and the rules they serve are in [`DESIGN.md`](DESIGN.md).

- **The code wins.** If this page and the code disagree, the code is right and this page is
  stale. Fix it in the same change.
- **One home for numbers.** `DESIGN.md` describes the rules in words. The equations and constants
  live here.
- **Every table is generated.** Each table under a `<!-- id -->` marker comes from
  [`scripts/formulas.ts`](../scripts/formulas.ts), which runs the real game code, and `npm test`
  fails if any of them drifts. After retuning, run `npm run formulas` and paste the changed tables
  over the old ones. Every table on this page must be generated: to add one, add it to the script.
  Anything hand-written goes in prose or a code block.

- **Measure generated Mines** with `npm run mine-stats -- [from] [to]` (default depths 1–12): per
  depth and on average, the Rock curve median, rocks, holes, Monsters, encrypted bit-rocks,
  producing Devices, chips per producing Device and byte-loot share. Use it before and after any
  generation change, and for every number a ticket promises.

Notation: `^` is a power, `·` is multiplication, `U(a–b)` is a uniform random draw between a and b,
and `ceil`, `floor`, `round` round as usual. "Depth" is a Mine's global number, counted from 1. "C1"
is the first Computer.

---

## Overriding a tunable

Every table below shows the code's defaults, which tests, `npm run formulas` and production play.
To try other numbers without editing code, set an env override and restart `npm run dev`
(decision: [ADR 0002](adr/0002-tunables-from-env-overrides.md)).

- **Name**: `DMD_<OBJECT>__<KEY>`, the exported constant's name and then its key in
  SCREAMING_SNAKE_CASE, with `__` before each nested key: `DMD_DIG_CURVE__ROCK_GROWTH=2.4`,
  `DMD_LOOT__BYTES__BASE=10`, `DMD_PART_PACE__DRAM__PER_LEVEL=2`, `DMD_MONSTERS__KERNEL_PANIC__HP=60`.
  Only numbers can be overridden, and arrays of numbers as JSON (`DMD_LAYOUT__ENTRY_COLUMNS=[3,4]`).
  The tunable objects are `CLOCK`, `DIG_CURVE`, `ECONOMY`, `LAYOUT`, `LOOT`, `MONSTER_SPAWN`,
  `MONSTERS`, `PART_PACE` and `ROCK_CURVE`. A new one is declared with `tunable()` from
  [`tunables.ts`](../packages/shared/src/tunables.ts), and then answers to the same rule.
- **Where**: `npm run dev` and `npm run mine-stats` load `config/.env.development`, then
  `config/.env`; the first file to set a name wins, and a variable already in the shell beats both.
  The production runs (`npm run build`, `npm start -w @dmd/server`) load only `config/.env`: keep
  it empty so production plays the defaults. Presets go in `config/presets/`, and
  personal files in `config/<name>.local.env` (git-ignored); put one in front with
  `npx dotenvx run -f config/presets/quick-dig.env -- npm run dev`.
- **Checks**: a value that is not a number, or a `DMD_*` name that names no tunable, stops startup
  with an error naming it. `npm test` ignores every override.
- **Saves**: an override reaches the server, the client and Mine generation alike. The Mine cache
  name carries a hash of the overrides, so new values get freshly generated Mines; saves are not
  converted, so use `?reset` after switching presets.

---

## 1. Digging

Source: `DIG_CURVE` in [`digging.ts`](../packages/shared/src/digging.ts).

<!-- dig-curve -->
| Constant | Value | Meaning |
| --- | --- | --- |
| `baseRockSize` | 120 B | Size of a Level 1 bit-rock |
| `baseSeconds` | 20 s | Time for an L1 dwarf to dig a Level 1 rock alone |
| `rockGrowth` | 2.4 | Size multiplier per rock Level |
| `rockBend` | 1.045 | Extra size multiplier per rock Level, compounding (1 = plain exponential) |
| `dwarfGrowth` | 2.1 | Strike multiplier per dwarf Level |
| `strikeSeconds` | 1 s | Time between Strikes |

### Bit-rock size

```
rockSize(r) = round(120 · 2.4^(r−1) · 1.045^((r−1)²))        r = the bit-rock's Level
```

The `rockBend` term makes each Level a little steeper than the one before: from Level r to r+1 a
rock grows by 2.4 · 1.045^(2r−1), so ×2.5 from L1 to L2 and ×4.2 from L7 to L8. With
`rockBend = 1` the size is the plain exponential `round(120 · rockGrowth^(r−1))`.

<!-- rock-size -->
| r | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 12 | 15 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| bytes | 120 | 301 | 824 | 2,465 | 8,052 | 28,717 | 111,850 | 475,727 | 2,209,601 | 11,207,325 | 375,470,697 | 140,906,671,995 |

### Strike damage

```
strikeDamage(d) = (120 / 20) · 2.1^(d−1) = 6 · 2.1^(d−1) bytes per Strike     d = dwarf Level
```

<!-- strike -->
| d | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| B/Strike | 6 | 12.6 | 26.46 | 55.57 | 116.69 | 245.05 | 514.6 | 1,080.65 | 2,269.37 |

Damage can be fractional. The rock's remaining size is tracked exactly.

### Time to dig

```
secondsToDig(d, bytes) = max(1, ceil(bytes / strikeDamage(d))) · 1 s
digSeconds(d, r)       = secondsToDig(d, rockSize(r))
```

The first Strike lands after one full second on the target. Switching to a different target
resets that second.

**Several dwarves on one target:** everyone digging the same rock, Device or port adds their
Strikes together each tick. A bit-rock has 4 orthogonal sides, so at most 4 dwarves can dig it.
A Device or port can take as many dwarves as there are cells next to it. Nothing digs
diagonally. A rock keeps its remaining bytes if the dwarves leave.

```
time ≈ remaining bytes / Σ strikeDamage(dᵢ)       (in whole Strikes)
```

### Dig time grid (one dwarf, seconds)

<!-- dig-grid -->
| Dwarf \ Rock | L1 | L2 | L3 | L4 | L5 | L6 | L7 | L8 | L9 | L10 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **L1** | 20 | 51 | 138 | 411 | 1,342 | 4,787 | 18,642 | 79,288 | 368,267 | 1,867,888 |
| **L2** | 10 | 24 | 66 | 196 | 640 | 2,280 | 8,877 | 37,757 | 175,366 | 889,471 |
| **L3** | 5 | 12 | 32 | 94 | 305 | 1,086 | 4,228 | 17,980 | 83,508 | 423,558 |
| **L4** | 3 | 6 | 15 | 45 | 145 | 517 | 2,013 | 8,562 | 39,766 | 201,694 |
| **L5** | 2 | 3 | 8 | 22 | 70 | 247 | 959 | 4,077 | 18,936 | 96,045 |
| **L6** | 1 | 2 | 4 | 11 | 33 | 118 | 457 | 1,942 | 9,018 | 45,736 |
| **L7** | 1 | 1 | 2 | 5 | 16 | 56 | 218 | 925 | 4,294 | 21,779 |
| **L8** | 1 | 1 | 1 | 3 | 8 | 27 | 104 | 441 | 2,045 | 10,371 |

Down the diagonal (an equal matchup) the time grows by (2.4 / 2.1) · 1.045^(2d−1) from Level d to
d+1, so ×1.19 at first and faster after: 20, 24, 32, 45, 70, 118, 218, 441 s.

### Pacing targets

The dig curve was fitted to these target times for one dwarf (`PACING_TARGETS` in
[`digging.ts`](../packages/shared/src/digging.ts)), our own guess at how long an idle game should
make a rock feel. `digging.test.ts` holds `digSeconds` within −25%/+30% of every row.

<!-- pacing -->
| Dwarf | Rock | Target | digSeconds | Off by |
| --- | --- | --- | --- | --- |
| L1 | L1 | 20 s | 20 s | 0% |
| L1 | L2 | 40 s | 51 s | +27% |
| L1 | L3 | 3 m | 2 m 18 s | −23% |
| L1 | L4 | 7 m | 6 m 51 s | −2% |
| L1 | L5 | 21 m | 22 m 22 s | +7% |
| L1 | L6 | 1 h 5 m | 1 h 19 m | +23% |
| L1 | L7 | 4 h 38 m | 5 h 10 m | +12% |
| L2 | L3 | 1 m | 1 m 6 s | +10% |
| L2 | L4 | 4 m | 3 m 16 s | −18% |
| L2 | L5 | 10 m | 10 m 40 s | +7% |
| L2 | L6 | 31 m | 38 m | +23% |
| L2 | L7 | 2 h 13 m | 2 h 27 m | +11% |
| L3 | L4 | 2 m | 1 m 34 s | −22% |
| L3 | L5 | 5 m | 5 m 5 s | +2% |
| L3 | L6 | 15 m | 18 m 6 s | +21% |
| L3 | L7 | 1 h 3 m | 1 h 10 m | +12% |
| L4 | L7 | 30 m | 33 m 33 s | +12% |
| L6 | L8 | 32 m | 32 m 22 s | +1% |

To compare the bent curve with a plain exponential one (`rockGrowth` 3, `rockBend` 1), put a
preset in front: `config/presets/dig-bent.env` (the defaults, spelled out) or
`config/presets/dig-plain.env`. The plain curve is slower up to rock Level 6 and quicker after.

---

## 2. Dwarves

### Walking

```
one cell every WALK_SECONDS = 0.333 s        (drags and held keys alike)
```

Source: `WALK_SECONDS` in [`digging.ts`](../packages/shared/src/digging.ts). Orthogonal steps
only.

### Auto-mining order

When a rock breaks, an idle dwarf starts on the first rock next to it, checking directions in
this order (`mineOrder`):

```
d odd  → up, left, down, right     (W, A, S, D)
d even → right, down, left, up     (D, S, A, W)
```

### Merge

```
L + L → L+1          (two dwarves of the same Level become one)
```

Dwarves of different Levels block each other.

### fork() price

Source: `ECONOMY.dwarfBase`, `ECONOMY.dwarfGrowth`, `dwarfPrice` in
[`devices.ts`](../packages/shared/src/devices.ts).

```
dwarfPrice(n) = round(50 · 1.25^n) bytes       n = dwarves already bought on this Computer
```

- `n` goes back to **0 on Sneakernet**. The starting dwarf and dwarves made by merging don't
  count.
- There is no limit per Mine. The rising price is the only brake.
- **A new dwarf's Level = fork()'s Level** (the fork() chip Level, which starts at 1). The price
  doesn't depend on that Level.
- The purchase is refused, before you pay, if no free cell is reachable near the Entry.

<!-- fork-price -->
| Dwarf # | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Price | 50 | 63 | 78 | 98 | 122 | 153 | 191 | 238 | 298 | 373 | 466 | 582 | 728 | 909 | 1,137 |
| Running total | 50 | 113 | 191 | 289 | 411 | 564 | 755 | 993 | 1,291 | 1,664 | 2,130 | 2,712 | 3,440 | 4,349 | 5,486 |

---

## 3. Computers and Depth

Source: [`computers.ts`](../packages/shared/src/computers.ts).

### Computer length

```
computerLength(c) = 2^(c+2) Mines        c = 0-based Computer number
```

This is a placeholder: the real rule is still to be decided, apart from always being a power of
two.

<!-- computer-length -->
| Computer | C1 | C2 | C3 | C4 | C5 |
| --- | --- | --- | --- | --- | --- |
| Mines | 4 | 8 | 16 | 32 | 64 |
| Depths | 1–4 | 5–12 | 13–28 | 29–60 | 61–124 |

```
firstDepth(c) = 1 + Σ_{k<c} computerLength(k)
index         = depth − firstDepth(c)              (0-based place in the Computer)
last          = index = computerLength(c) − 1      (the Mine with the USB port)
```

### Per-Computer layout values

Source: [`layout.ts`](../packages/shared/src/layout.ts).

```
portWidth(c)       = min(4, 2 + c) cells
startTech(c)       = technology # min(5, c)        (the Port technology table, §8)
deviceFootprint(c) = 2×2 (C1), 2×3 (C2), 3×3 (C3 on)     w × h
fork() footprint   = 2×2 always
Mine size          = 8 wide × 12 tall
```

---

## 4. The Rock curve

Source: `ROCK_CURVE` and `rockMedian` in [`computers.ts`](../packages/shared/src/computers.ts),
and `rockLevelCounts` in [`layout.ts`](../packages/shared/src/layout.ts).

### Median Level per Mine

<!-- rock-curve -->
| Constant | Value | Meaning |
| --- | --- | --- |
| `firstMedian` | 3 | Median of the very first Mine |
| `perMine` | 0.25 | Rise per Mine within a Computer |
| `handover` | 0.25 | A new Computer starts this far up the last one's first-to-last rise |

```
start(0)    = 3
start(c+1)  = start(c) + (computerLength(c) − 1) · 0.25 · 0.25
rockMedian  = start(c) + index · 0.25
```

The handover adds up: each Computer's start = the previous start + a quarter of the previous
Computer's rise.

<!-- medians -->
| Computer | First Mine median | Last Mine median |
| --- | --- | --- |
| C1 (depths 1–4) | 3 | 3.75 |
| C2 (depths 5–12) | 3.188 | 4.938 |
| C3 (depths 13–28) | 3.625 | 7.375 |
| C4 (depths 29–60) | 4.563 | 12.313 |

### Level spread

Rock Levels follow a binomial bell curve (σ ≈ 1.22) over median−3 … median+3:

```
BELL = [1, 6, 15, 20, 15, 6, 1] / 64        for Levels m−3 … m+3
```

A fractional median blends two bells:

```
low   = floor(median),  share = median − low
w(L)  = (1 − share) · BELL centred on low  +  share · BELL centred on low+1
```

- Levels below 1 fold into Level 1. At the first median (3) the bell reaches down to Level 0,
  so Level 1 gets 7 of every 64 rocks.
- For `n` rocks, each Level gets `floor(w(L) · n)` rocks, and the leftover rocks go to the
  Levels with the largest remainders, so the counts add up to exactly `n`.
- The curve shares Levels among whatever cells are still rocks after holes, Devices and
  Monsters have been placed.

Example spreads for a Mine of 60 rocks (Level: count):

<!-- spreads -->
| Median | Spread |
| --- | --- |
| 3 (C1 first) | 1: 6, 2: 14, 3: 19, 4: 14, 5: 6, 6: 1 |
| 3.25 (C1 second) | 1: 5, 2: 12, 3: 18, 4: 15, 5: 8, 6: 2 |
| 3.75 (C1 last) | 1: 2, 2: 8, 3: 15, 4: 18, 5: 12, 6: 4, 7: 1 |
| 4.938 (C2 last) | 2: 1, 3: 6, 4: 14, 5: 19, 6: 14, 7: 5, 8: 1 |
| 7.375 (C3 last) | 5: 4, 6: 11, 7: 17, 8: 16, 9: 9, 10: 3 |

### Placement

1. Rock cells are listed bottom row first, and each row is shuffled.
2. The sorted Levels are handed out easiest first, so easy rocks end up low and hard rocks high.
3. **Jitter:** each rock has a `jitterChance = 0.5` chance to swap Levels with a random rock up
   to `jitterRows = 1` row away, in any column.

### Hardness of Devices and ports

```
hardest = the highest Level on the curve,  second = the next one down (or hardest if only one)

buried Device:  Level = second,   size = buriedDeviceSize = rockSize(second) · ceil(w·h / 2)
port / USB:     Level = hardest,  size = portSize        = rockSize(hardest) · portWidth(c)
```

Source: `buriedDeviceSize`, `portSize` and `LAYOUT.deviceCellsPerRock` in
[`layout.ts`](../packages/shared/src/layout.ts).

Bigger masses hold proportionally more bytes because more dwarves can dig them at once. For
example, a C1 Device (2×2) is 2 rocks' worth, a C3 Device (3×3) is 5, and a C3 port is 4.

---

## 5. Mine generation

Source: `LAYOUT` and `holeChance` in [`layout.ts`](../packages/shared/src/layout.ts), and
`generateLevel` in [`levels.ts`](../apps/server/src/data/levels.ts).

### Seeds and random streams

```
seed      = mineSeed(depth)  = (depth · 2654435761) mod 2^32
rand      = mulberry32(seed)                      (everything except the port's position)
portX     = floor(mulberry32(portSeed(seed))() · (8 − portWidth + 1))
portSeed  = seed XOR 0x9E3779B9
```

The port has its own stream, so retuning the generator never moves it. Any change to what a depth
generates must bump `GENERATOR_VERSION` (now 7), because the service worker caches Mines forever.
A fingerprint test (`apps/server/src/data/levels.test.ts`) over depths 1–200 fails until it does.

### fork(), Entry and Devices

- **fork()** goes in the bottom-left corner with `LAYOUT.forkLeftChance = 0.5`, otherwise the
  bottom-right.
- **Entry column** is picked evenly from `LAYOUT.entryColumns` = columns 2–5 (0-based), leaving
  out any under fork().
- **Producing Devices** alternate left and right walls (the first goes on the left with
  `LAYOUT.firstSideLeftChance = 0.5`). They are spread evenly through the rows between
  `LAYOUT.clearTop = 1` and `LAYOUT.clearBottom = 2`:

  ```
  span = 12 − 1 − 2 = 9 rows
  gap  = (span − k · h) / (k + 1)           k = Devices on that side, h = footprint height
  y_j  = 1 + round(gap · (j+1) + j · h)     j = 0, 1, …
  ```

### Holes

```
bottom row, and every cell touching fork() (diagonals too): always a hole

holeChance(r) = 0.60 + (0.12 − 0.60) · (r − 1) / 10      r = row from the bottom, 1…11
```

<!-- holes -->
| Row from bottom | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 (top) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Hole chance | 100% | 60% | 55.2% | 50.4% | 45.6% | 40.8% | 36% | 31.2% | 26.4% | 21.6% | 16.8% | 12% |

### Monsters

Each cell that isn't a Device or hole, outside the bottom `MONSTER_SPAWN.clearBottom = 2` rows, becomes a
Monster with this chance:

```
monsterChance(depth) = 0.03 + 0.003 · min(depth, 20)        (3.3% at depth 1 → 9% from depth 20)
monsterFor(depth)    = MONSTER_BY_DEPTH[min(4, floor(depth / 5))]
```

Every tap does `TAP_DAMAGE = 1`. The bounty is paid when HP reaches 0. Source: `MONSTER_SPAWN`,
`MONSTER_BY_DEPTH`, `TAP_DAMAGE` and `MONSTERS` in [`monsters.ts`](../packages/shared/src/monsters.ts).

<!-- monsters -->
| Depths | Monster | HP (taps) | Bounty |
| --- | --- | --- | --- |
| 1–4 | Bug | 6 | 25 B |
| 5–9 | Worm | 10 | 60 B |
| 10–14 | Forum Troll | 18 | 150 B |
| 15–19 | Phisher | 26 | 300 B |
| 20+ | Kernel Panic | 50 | 900 B |

---

## 6. Loot

Source: `LOOT` in [`loot.ts`](../packages/shared/src/loot.ts), and the loot picker in
[`levels.ts`](../apps/server/src/data/levels.ts).

### What an ordinary bit-rock holds

One uniform roll picks the kind:

<!-- loot-share -->
| Kind | Share | Then picks |
| --- | --- | --- |
| bytes | 55% | `byteLoot` below |
| device | 24% | One of this Mine's producing Devices, evenly |
| fork | 3% | fork() chips |
| portTech | 6% | This Mine's start technology or the next one (the next only from depth 2), evenly |
| other | 9% | A producing model not in this Mine, at most 4 tiers above this Mine's model of that kind (any tier if the Mine has none of that kind). Falls back to bytes if there are none. |
| duplex | 1.5% | 1 Duplex chip |
| cron | 1.5% | 1 cron job |

### Byte loot

```
byteLoot(depth) = round(8 · 1.5^(depth−1) · U(0.5–1.5))
```

<!-- byte-loot -->
| Depth | 1 | 2 | 3 | 4 | 5 | 8 | 12 | 16 | 20 | 28 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Middle value | 8 | 12 | 18 | 27 | 41 | 137 | 692 | 3,503 | 17,735 | 454,521 |

Byte loot depends on **depth**, not on the rock's Level.

### Chip stacks

```
chipCount(r)          = ceil(r / 4) + (1 with 20% chance)      model chips: Device, fork(), Port technology
encryptedChipCount(r) = 3 · ceil(r / 4)                        no bonus chip
Duplex and cron       = always 1
```

<!-- chip-stacks -->
| Rock Level | 1–4 | 5–8 | 9–12 | 13–16 | 17–20 |
| --- | --- | --- | --- | --- | --- |
| Ordinary stack | 1 (20%: 2) | 2 (20%: 3) | 3 (20%: 4) | 4 (20%: 5) | 5 (20%: 6) |
| Encrypted stack | 3 | 6 | 9 | 12 | 15 |

### Encrypted bit-rocks

```
each rock at the hardest Level has encryptedShare = 25% chance to be encrypted
(only if the Mine has more than one Level)
```

The chip is picked from `encryptedChipPool`: each producing Device's chip twice, fork() once, and
each Port technology chip once (`LOOT.encryptedWeights`). That makes a Device chip twice as likely
as any one other chip.

---

## 7. Devices

Source: `LADDERS`, `ECONOMY`, `deviceRate`, `bufferCap`, `chipsToUpgrade` in
[`devices.ts`](../packages/shared/src/devices.ts).

### Output

```
baseRate(model)       = round2(kindRate · 2^tier)              tier = the model's rung, 0 = oldest
deviceRate(model, L)  = baseRate · 1.5^(L−1) bytes per second  L = the model's Level
bufferCap(model, L)   = deviceRate(model, L) · 300 s
```

<!-- kind-rates -->
| Kind | `kindRate` (B/s at tier 0, L1) | Ladder length |
| --- | --- | --- |
| CPU | 1 | 12 |
| DRAM | 0.6 | 12 |
| Storage | 0.4 | 12 |
| VRAM | 0.8 | 10 |
| fork() | 0 (doesn't produce) | n/a |

- A Device's Level belongs to the **model**, across the whole game.
- Output fills the Buffer up to its cap, then stops.
- A cron job (1 chip, per Device) empties the Buffer into your bytes each time it reaches its cap.
  Output past the cap carries over into the emptied Buffer, so nothing is lost. Scheduling the
  cron job also collects whatever the Buffer holds at that moment.
- Devices on every Mine in the Chain keep producing, buried ones excepted.
- Collecting needs at least `ECONOMY.minCollect = 0.5` B in the Buffer.

<!-- device-output -->
| Model | Tier | L1 B/s | L5 B/s | L10 B/s | Buffer at L1 |
| --- | --- | --- | --- | --- | --- |
| 4004 CPU | 0 | 1 | 5.06 | 38.44 | 300 B |
| Z80 CPU | 3 | 8 | 40.5 | 307.55 | 2,400 B |
| 80386 CPU | 6 | 64 | 324 | 2,460.38 | 19,200 B |
| 1 kB DRAM | 0 | 0.6 | 3.04 | 23.07 | 180 B |
| 16 kB DRAM | 3 | 4.8 | 24.3 | 184.53 | 1,440 B |
| 640 kB DRAM | 6 | 38.4 | 194.4 | 1,476.23 | 11,520 B |
| 8″ 80 kB Floppy | 0 | 0.4 | 2.03 | 15.38 | 120 B |
| 5¼″ 360 kB Floppy | 3 | 3.2 | 16.2 | 123.02 | 960 B |
| 10 MB Hard Drive | 6 | 25.6 | 129.6 | 984.15 | 7,680 B |
| 2 kB VRAM | 0 | 0.8 | 4.05 | 30.75 | 240 B |
| 64 kB VRAM | 3 | 6.4 | 32.4 | 246.04 | 1,920 B |
| 1 MB SVGA VRAM | 6 | 51.2 | 259.2 | 1,968.3 | 15,360 B |

### Upgrade cost

The same curve serves Device models, fork() and Network ports:

```
chipsToUpgrade(L) = ceil(2 · 1.5^(L−1))       chips to go from Level L to L+1
```

<!-- upgrade-cost -->
| To Level | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Chips | 2 | 3 | 5 | 7 | 11 | 16 | 23 | 35 | 52 | 77 | 116 | 173 |
| Running total from L1 | 2 | 5 | 10 | 17 | 28 | 44 | 67 | 102 | 154 | 231 | 347 | 520 |

### Which models a Mine has

```
CPU tier      = cpuTier(c) = Σ_{k=1..c} (2 or 3)     (50/50 per Computer, from mulberry32(k · 7919))
part tier     = start(kind, c) + floor(index · perLevel)
start(kind,c) = Σ_{k<c} floor((computerLength(k) − 1) · perLevel · keep)
VRAM          = only from C1's 3rd Mine on; on C1 its tier is 1 lower than the formula gives
tier is clamped to the ladder's last model
```

<!-- part-pace -->
| Part (`PART_PACE`) | `perLevel` | `keep` |
| --- | --- | --- |
| DRAM | 1 | 0.75 |
| Storage | 0.75 | 0.5 |
| VRAM | 0.5 | 0.5 |

The CPU rolls so far give the 4004 on C1, the Z80 on C2, the 80386 on C3 and the Pentium Pro on C4.

<!-- hardware -->
| Depth | Place | CPU | DRAM | Storage | VRAM |
| --- | --- | --- | --- | --- | --- |
| 1 | C1 #1 | 4004 CPU | 1 kB DRAM | 8″ 80 kB Floppy | n/a |
| 3 | C1 #3 | 4004 CPU | 8 kB DRAM | 8″ 250 kB Floppy | 2 kB VRAM |
| 4 | C1 #4 | 4004 CPU | 16 kB DRAM | 5¼″ 160 kB Floppy | 2 kB VRAM |
| 5 | C2 #1 | Z80 CPU | 8 kB DRAM | 8″ 250 kB Floppy | 2 kB VRAM |
| 12 | C2 #8 | Z80 CPU | 16 MB DRAM | 10 MB Hard Drive | 64 kB VRAM |
| 13 | C3 #1 | 80386 CPU | 1 MB DRAM | 5¼″ 360 kB Floppy | 4 kB MDA VRAM |
| 17 | C3 #5 | 80386 CPU | 256 MB DRAM (ladder end) | 10 MB Hard Drive | 64 kB VRAM |
| 24 | C3 #12 | 80386 CPU | 256 MB DRAM (ladder end) | 1 GB Hard Drive (ladder end) | 1 MB SVGA VRAM |
| 28 | C3 #16 | 80386 CPU | 256 MB DRAM (ladder end) | 1 GB Hard Drive (ladder end) | 4 MB VRAM |

---

## 8. Network ports

Source: [`network.ts`](../packages/shared/src/network.ts).

### Port capacity

```
portCapacity(L) = floor(L / 2) + 1        dwarves through the port at the same time
```

A dwarf that comes back up through the Entry (with duplex) frees its place.

<!-- port-capacity -->
| Port Level | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Port capacity | 1 | 2 | 2 | 3 | 3 | 4 | 5 | 6 |

### Technology

<!-- port-techs -->
| # | Technology | Highest dwarf it carries | Speed label |
| --- | --- | --- | --- |
| 0 | Serial Port | L4 | 300 baud → 115.2 kbps across Levels 1–8 |
| 1 | 1 Mb Ethernet | L5 | 1 Mbps |
| 2 | 2 Mb Token Ring | L6 | 2 Mbps |
| 3 | 10BASE-T Ethernet | L7 | 10 Mbps |
| 4 | Fast Ethernet | L8 | 100 Mbps |
| 5 | Gigabit Ethernet | L9 | 1 Gbps |

```
new port         = technology startTech(c), Level 1, no duplex
upgrade          = chipsToUpgrade(L) chips of the current technology
rewire           = chipsToUpgrade(1) = 2 chips of the next technology; the port drops to Level 1
duplex           = 1 Duplex chip, once per port
```

The speed label is cosmetic.

---

## 9. Sneakernet

```
kept:  bytes, chips, every model's Level (Devices, fork(), Port technologies)
reset: dwarves → one L1 dwarf;  fork() purchase count n → 0;  the old Computer's Mines are gone
```

The next Computer's Rock curve starts at the handover median (§4), and its hardware follows §7.

---

## 10. Time

<!-- time -->
| What | Value | Source |
| --- | --- | --- |
| Game tick | 100 ms | `CLOCK.tickMs` in `packages/shared/src/clock.ts` |
| Catch-up per tick after a backgrounded tab | at most 5 s | `CLOCK.maxCatchUpSeconds` in `packages/shared/src/clock.ts` |
| Offline production credited on load | at most 8 h | `CLOCK.maxOfflineSeconds` in `packages/shared/src/clock.ts` |
| Collect minimum | 0.5 B | `ECONOMY.minCollect` in `packages/shared/src/devices.ts` |
| Dev fast-forward | `?speed=N` multiplies every tick, except held-key walking (real time) | `SPEED` in `apps/client/src/state/loop.ts` |

Offline time credits only Device output (Buffers up to their caps; a cron job earns every full
Buffer and leaves the remainder in the Buffer). Dwarves don't dig while the game is closed.

Bytes are displayed with 1024-based units (`1536 → "1.5 kB"`), in
`apps/client/src/game/format.ts`.

---

## 11. Balance notes

These are things the formulas show when you lay them side by side. They're observations, not
decisions. Change the tuning in `packages/shared`, then update this page.

1. **Byte loot outgrows digging effort, slowly.** Byte loot grows ×1.5 per Mine. The median
   climbs a quarter Level per Mine, so rock size at the median grows about ×1.33 per Mine early
   on (median 3–4) and ×1.43 by median 7, catching up as the bend steepens. Byte loot also
   follows global depth, but the Rock curve drops back at each Sneakernet. So C2's first Mine
   (median 3.1875) pays about 41 B a rock, against 8 B on depth 1 (median 3), for rocks of
   much the same size.
2. **Early byte loot is small next to Devices.** On depth 1 a bytes rock pays about 8 B for under a
   minute to 7 minutes of digging (an L2 to L4 rock for one L1 dwarf). The 4004 makes 1 B/s on its own, and the first extra dwarf costs 50 B. Early
   income is mostly Devices.
3. **Merging gains a little digging power.** Two L1 dwarves strike 12 B/s together, while the L2
   they merge into strikes 12.6 B/s (×1.05 per merge). Merging is never a loss, and it also pays
   through per-rock speed, fewer bodies to pass through low-capacity ports, and getting under the
   technology cap. Raising fork()'s Level adds to that, because a fork() dwarf costs the same at
   any Level.
4. **Upgrades return the same on every Level.** Each Device Level costs ×1.5 more chips and gives
   ×1.5 more output. A newer model doubles base output for every tier it climbs. DRAM climbs a
   tier every Mine, so new models soon matter more than Levels.
5. **DRAM and storage reach the end of their ladders on long Computers.** DRAM hits 256 MB at
   depth 17 (C3 #5), and storage hits 1 GB at depth 24 (C3 #12). The ladders need more models,
   or the pace needs to slow down.
6. **Monster bounties don't scale.** A Kernel Panic pays 900 B for 50 taps from depth 20 on, when a
   bytes rock at depth 20 pays about 17,700 B.
7. **Serial carries only up to L4.** C1 starts on Serial, so an L5 dwarf can't leave a C1 Mine
   until that port is rewired to Ethernet.
