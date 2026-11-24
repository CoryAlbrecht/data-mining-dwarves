# Data Mining Dwarves

An idle mining game where dwarves dig through data for bytes and chips, upgrading old computer
hardware as they work their way through a series of computers.

## World

**Computer**:
A run of Mines sharing one CPU and one look. The game is a series of Computers.
_Avoid_: World, stage

**Mine**:
One screen of the game: a grid of cells that dwarves dig through. A Computer's Mines link up into the Chain.
_Avoid_: Level (that word means a rank), screen, floor

**Chain**:
The current Computer's Mines, linked by their Network ports. The player can scroll back through them.

**Depth**:
A Mine's position in the game, counted from 1 and continuing across Computers.

**Theme**:
A skin for a Computer's Mines: how cells, dwarves and Devices are drawn, such as the all-green CRT. A Theme never changes the rules.
_Avoid_: Style, level type

## Things in a Mine

**Bit-rock**:
A cell of solid data that dwarves dig away. It has a Level and a size in bytes, and holds loot.
_Avoid_: Rock (fine in conversation), block, tile

**Rock curve**:
The spread of bit-rock Levels in a Mine: a bell curve around the Mine's median Level. The median climbs from one Mine to the next.
_Avoid_: Base Level (a Mine has no Level)

**Encrypted bit-rock**:
A bit-rock from the Mine's hardest Level that always holds a stack of chips. It's this game's treasure chest.
_Avoid_: Chest

**Wall**:
The frame around a Mine. Stretches of it are the Entry and the Network port or USB port.
_Avoid_: Border

**Hole**:
An empty cell. Some Mines start with holes, and digging out a bit-rock leaves one. Dwarves walk through holes.
_Avoid_: Gap, cave

**Item**:
Loot (bytes, or one or more of a chip) left lying in a cell after its bit-rock breaks, waiting for a dwarf to step on it.
_Avoid_: Drop, pickup

**Entry**:
A stretch of a Mine's bottom Wall. Dwarves arrive on the cell just inside it from the previous Mine, and with duplex they can leave back through it.

**Device**:
A fixed piece of hardware mounted against a Mine's side, 2×2 cells or larger: CPU, DRAM, storage, VRAM, or fork(). Most start buried and producing Devices make bytes; fork() starts uncovered.
_Avoid_: Peripheral, socket, slot

**fork()**:
The Device that spawns new dwarves for bytes.
_Avoid_: Forge

**Network port**:
A 2–4 cell stretch of a Mine's top Wall that dwarves dig through to reach the next Mine in the Chain. Its technology runs from a serial port up through Token Ring and Ethernet.
_Avoid_: Data port

**USB port**:
Takes the place of the Network port in the top Wall of a Computer's last Mine. It leads by Sneakernet to the next Computer.

**Monster**:
A hostile cell (Bug, Worm, Forum Troll…) that the player taps to fight.

## Progress

**Level**:
The rank of a dwarf, bit-rock, Device or Network port. Never used for a Mine.
_Avoid_: Tier (except for a Device model's place in its ladder)

**Dwarf**:
A digger that stands on one cell, mines the cells next to it, and moves only when the player moves it.

**Selected dwarf**:
The one dwarf that keyboard commands apply to. It blinks. The player chooses it by tapping, clicking or Tabbing to it, and it stays selected until another dwarf is chosen or the player presses Escape.
_Avoid_: Focused dwarf, active dwarf

**Merge**:
Moving a dwarf onto another dwarf of the same Level, which makes one dwarf a Level higher.

**Bytes**:
The in-game currency. There is never a real-money path.
_Avoid_: Bits, coins, gold

**Chip**:
A card-like collectible for one specific Device model, Network technology, or special use. Spending chips raises a Level.
_Avoid_: Card

**Cron job**:
A special chip that automates a Device so it collects its own bytes.

**Duplex chip**:
A special chip that lets dwarves travel back up through a Network port.

**Sneakernet**:
Carrying the data on a USB stick to the next Computer. The old Computer is left behind and the player starts over with one Level 1 dwarf.
