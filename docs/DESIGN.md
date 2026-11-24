# Data Mining Dwarves: Game Design

This is the working design. Anything marked **(assumption)** fills a gap in the spec and should be
confirmed or corrected. Every tunable number lives in `packages/shared`, so balancing changes data,
not code.

## Core loop

1. **Dwarves dig bit-rocks.** Dig time is an equation of dwarf level vs. rock level (below).
2. **Bit-rocks drop loot:** usually **bytes** (the currency), sometimes **chips**. A chip belongs to
   a specific device model, such as a "4004 CPU chip" or an "8 kB DRAM chip". Chips can be for
   devices that aren't on the current level, like an 80286 chip on an early level.
3. **Devices are buried in each level:** a CPU socket, a DRAM slot, a storage drive, VRAM, the
   network port (or a USB port on a computer's last level), and peripherals. You have to dig them
   out first.
4. **Uncovered devices produce bytes** into a buffer. The player has to **tap to collect** them,
   and the buffer has a cap **(assumption)**, so ignoring a device wastes output.
5. **Chips work like cards.** Spending N chips of a model raises that device's **level**. It's
   still a 4004, but it produces more bytes.
6. **Automation** comes from a special drop: a **cron job** chip. Applying one to a device makes it
   collect its own output.

## Mine layout

Terms are defined in `GLOSSARY.md`. The layout is built for portrait phones and thumbs.

- A **Mine** is a fixed **8 × 12** grid. Cells sit flush against each other, like a text-mode
  screen.
- The frame around the grid is the **Wall**.
  - The **Entry** is a 1-cell stretch of the **bottom Wall** in one of the middle columns. Dwarves
    arrive on the cell just inside it.
  - The **Network port** (or the **USB port** on a Computer's last Mine) is a stretch of the
    **top Wall**, 2 cells wide on computer 1, 3 on computer 2 and 4 after that. It's visible
    from the start.
  - Dwarves in the top row dig into the port as one mass. Once it's open, they walk up into it to
    go through. With duplex installed, a dwarf walks down into the Entry to go back up the Chain.
- The **Chain grows upward**: the newest Mine is at the top of the page, and you scroll down to
  older Mines.
- **Holes:** the bottom row and the cells around fork() start empty. From row 2 up, 60% of cells
  start as holes, falling steadily to 12% in the top row. Holes are just empty cells.
- **Bit-rock Levels** follow the **Rock curve**: a bell curve (binomial, about ±1 Level) around
  the Mine's median Level. Holes are carved first, and the curve shares Levels out among the rocks
  that remain.
- **The median climbs half a Level every Mine**, smoothly: a half-Level median blends the curves
  either side, so each Mine is a little harder than the last. After Sneakernet the next Computer
  starts **a quarter of the way up** the previous Computer's first-to-last range, since the player
  is rebuilding from one dwarf. With 4, 8, 16… Mines per Computer the medians run 1 → 2.5, then
  1.4 → 4.9, then 2.3 → 9.8.
- **Generator version:** Mines are cached forever on the player's device, under a name that
  includes the generator's version. Any change to what a depth generates bumps the version. The
  port's position has its own random stream, so retuning never moves it under a saved Mine.
- **Placement:** rocks are sorted easiest at the bottom to hardest at the top, then each one has a
  50% chance to swap with a rock up to 2 rows away, so the layers aren't perfectly stratified.
- **Loot odds** for ordinary bit-rocks: 55% bytes, 24% chips for this Mine's producing Devices,
  3% fork(), 6% this Mine's Network chips, 9% chips for models elsewhere, 1.5% duplex, 1.5% cron.
- **Chip stacks:** a model chip comes as a stack of **ceil(rock Level / 3)**, with a 20% chance of
  one extra. Duplex and cron chips always come one at a time. Over the first two Computers that
  works out to about 4 chips per producing Device per Mine.
- **Encrypted bit-rocks** (the treasure chests) come only from the hardest Level and always hold a
  stack of **3 × ceil(Level / 3)** chips, usually for this Mine's Devices.
- **Rocks show only a tiny Level number**, and what's inside is a surprise. The glyph wears down
  (▓ → ▒ → ░) as it's dug.
- **Hardness:** the port has the hardest Level on the curve, and buried Devices have the
  second-hardest.
- **Monsters** are scattered at random, never in the bottom 2 rows.

## Devices in the Mine

- Devices are mounted **flush against the left and right sides**, alternating, and stay out of the
  top row and the bottom 2 rows.
- **Footprint** grows by Computer: 2×2, then 2×3, then 3×3.
- **fork()** is a 2×2 in a bottom corner. It's **uncovered and usable from the start**. New dwarves
  appear on the free cell nearest the Entry; if there's none, the purchase is refused before you
  pay.
- A buried Device is one mass. Any dwarf next to any of its cells digs it, and it's uncovered all
  at once. Uncovered Devices are **solid**: dwarves walk around them.
- **Cells:**
  - The **collect** spot (`⇩`; `+` on fork() for "buy a dwarf") and the **upgrade** spot (`⇧`,
    with the Level as a tiny number) are on the side facing the middle of the Mine, collect lowest.
  - Tapping upgrade spends chips right away, or flashes how many are still needed.
  - The **label** cells show the kind and model, and tapping one opens the details panel.
  - Keyboard: **E** collects from a Device next to the selected dwarf.
- A Device with no cron job slowly cycles its collect glyph when it's **completely full**.

## Look

- **Themes are skins only** and never change the rules.
- On the green CRT, **everything inside the Mine is phosphor green**, with only brightness varying.
- **No emoji** for now; any other character in the Basic Multilingual Plane is fine.
- Dwarves **dance** through the Theme's glyph frames while mining. The **selected dwarf blinks**
  like a cursor.

## Rocks and digging

Bit-rocks have a **size in bytes**. Each strike of a dwarf's pick (one per second) removes a fixed
amount that depends on the dwarf's level:

```
rockSize(r)     = 120 B · 1.6^(r−1)       (r = rock tier from depth: 120 B, 192 B, 307 B, …)
strikeDamage(d) = 4 B · 1.5^(d−1)         (d = dwarf level: 4, 6, 9, … B per strike)
```

| Dwarf vs. rock | Time |
|---|---|
| L1 vs. 120 B | 30 s |
| L2 vs. 120 B | 20 s (faster, but not twice as fast) |
| L2 vs. 192 B | 32 s (equal matchups slowly get longer) |

**Up to 4 dwarves can work the same rock at once**, one on each side. Their strikes add up. A
rock keeps its remaining size if the dwarves leave. The constants are in `DIG_CURVE`
(`packages/shared/src/digging.ts`).

## Moving dwarves

- Each dwarf **stands on a cell**, one dwarf per cell, and **only moves when the player moves it**.
- **Desktop:** WASD or the arrow keys move the **selected dwarf** a cell, wherever keyboard focus
  is (except in a text field). E collects from a Device next to it. A mouse drag walks the dwarf to
  where you drop it.
  - Tapping, clicking or Tabbing to a dwarf selects it. Tab keeps normal browser order, so it also
    reaches panel buttons.
  - The selection stays through clicks elsewhere. Escape clears it.
  - After a merge, the merged dwarf is selected.
  - A selected dwarf that changes Mines stays selected, and the page scrolls to keep it in view.
  - Holding a key walks at the normal pace, then mines the first rock it bumps into.
- **Walking pace:** one cell every **333 ms**, for drags and held keys alike.
- **Tablet and phone:** tap and drag a dwarf to walk it there.
- **Orthogonal only. Nothing moves or mines diagonally.**
- Moving **into a rock** (key or drag) forces the dwarf to mine that rock. Dropping a dragged dwarf
  on a rock walks it next to the rock and starts mining.
- When a rock breaks, the dwarf **starts on the next adjacent rock by itself**. Odd-level dwarves
  check **W, A, S, D** (up, left, down, right) and even-level dwarves check **D, S, A, W**.
- A broken rock **leaves its loot (bytes or a stack of chips) on the floor**. Dwarves never pick things up on
  their own; the player has to move a dwarf onto the item.
- Moving a dwarf **onto a same-level dwarf merges them** into one dwarf of the next level. A
  different-level dwarf blocks the way.
- Monsters block cells. The player taps them to fight; dwarves don't fight.

## Devices and hardware progression

Each kind of device has a ladder of models, oldest first: 4004 → 8008 → 8080 → Z80 → … for CPUs,
8″ 80 kB floppies before hard drives, kilobytes of DRAM before megabytes. **Parts advance at
different rates**, the way real hardware did (`packages/shared/src/computers.ts`):

- **CPU:** fixed for a whole computer. Each new computer jumps it 2 or 3 models, so computer 2 has
  an 8080 or a Z80.
- **DRAM:** one model bigger every level.
- **Storage:** a bit slower, about 3 models every 4 levels.
- **VRAM:** first appears on the 3rd level, then grows at half a model per level.
- **On a new computer,** DRAM, storage and VRAM restart lower than where the last computer ended,
  but not back at the very start. Each part keeps a share of its progress (`PART_PACE`).

Each model keeps its **level across the whole game**, so chips for a 4004 found anywhere upgrade
every 4004 **(assumption: levels are per model, like cards)**.

| Kind | Role |
|---|---|
| CPU, DRAM, storage, VRAM | Produce bytes. Upgrade with that model's chips. |
| `fork()` (the dwarf forge) | Sells a new dwarf for bytes. Each one costs a bit more than the last. Its level (from `fork()` chips) sets the level of the dwarves it makes. |
| Network port | Sends dwarves to the next level (below). |

Upgrading a device from level L to L+1 costs `ceil(2 · 1.5^(L−1))` chips: 2, 3, 5, 7, 11, …

## Dwarves

- You start with **one L1 dwarf** just inside the first Mine's Entry.
- Buy more from `fork()` (one per Mine). Each one costs a bit more than the last, and it appears
  on the free cell nearest the Entry.
- Merge by moving one dwarf onto another of the same Level (see Moving dwarves).

## Network port and the Chain

- Each level's network port connects it to the next level. You dig it out, then upgrade it with
  chips. Levels form a **chain** you can scroll back through.
- **Capacity:** a port at level L lets `floor(L/2) + 1` dwarves through in total **(assumption:
  a lifetime total per port, not per trip; bringing a dwarf back frees its slot)**.
- **Port technology** limits which dwarf levels can pass. Upgrading the technology resets the port
  to level 1, which lowers its capacity again:

  | Technology | Port levels | Highest dwarf it passes |
  |---|---|---|
  | Serial | 300 → 115,200 baud | L4 |
  | 1 Mb Ethernet | L1+ | L5 |
  | 2 Mb Token Ring | L1+ | L6 |
  | … | | |

  **(assumption: these cutoffs. The notes mixed "L4" and "L5" for Ethernet.)**
- The player **walks dwarves through** by moving them up into the open port from the top row.
  They arrive just inside the next Mine's Entry, and that cell has to be free.
- A new Computer's ports **start one technology further along** (computer 2 starts at 1 Mb
  Ethernet, and so on).
- **Duplex chips** let dwarves come back up. With duplex installed, moving a dwarf onto the entry
  cell takes it back up, and it arrives in the top row under the port above. This recovers a low-level dwarf
  sent by mistake, or brings abandoned dwarves along later.
- Devices on earlier levels keep producing. You scroll back up to collect from them, or automate
  them.

## Computers and sneakernet

- The game is a series of **computers**, each a run of levels. Depth numbers keep counting across
  computers.
- **Computer length is variable but always a power of two. The exact rule is still to be decided.**
  The placeholder in `computerLength()` is 4, 8, 16, 32… levels.
- The **last level of each computer has a USB port** instead of a network port. Once it's dug out
  and a dwarf is standing on it, the player confirms the **sneakernet**:
  - **The old computer is gone for good:** its levels, devices and dwarves.
  - **You start over with a single L1 dwarf**, and the fork() price resets
    **(assumption: it resets because the dwarves it counted are gone)**.
  - **You keep** bytes, chips and device levels.
  - The new computer has **bigger bit-rocks**: rock tiers start 2 higher on each computer. Its
    hardware follows the progression rules above.
- **Looks, per computer:**
  1. Green-phosphor CRT with ASCII/Unicode glyphs (built).
  2. CGA 8-color text mode. Foreground and background colors make bit-rocks harder or easier to
     mine, or hint at what's inside. **Not built yet:** computer 2 uses the plain tile look for now.
  3. … more themes.
- **Known tuning issue:** on long computers (16+ levels) DRAM and storage reach the end of their
  12-model ladders. The ladders need more models, or the pacing needs to slow down.

## Currency

**Bytes**, in-game only. They're displayed with B / kB / MB / GB / … units. There are no
real-money purchases.
