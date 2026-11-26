# Data Mining Dwarves: Device

## CPUs

Ten of the most notable and historically influential Instruction Set Architectures (ISAs) listed in the Wikipedia *Comparison of instruction set architectures* table with production implementations introduced in **1973 or later** are:

1. **8080 / Z80** (1974 / 1976)
2. **6502** (1975)
3. **VAX** (1977)
4. **x86** (1978)
5. **68000 (m68k)** (1979)
6. **ARM** (1985)
7. **MIPS** (1985)
8. **SPARC** (1987)
9. **POWER / PowerPC / Power ISA** (1990)
10. **DEC Alpha** (1992)

*(Note on MIPS figures: Classic CPUs are cited in VAX MIPS or Dhrystone MIPS [DMIPS], while modern multi-core processors are rough aggregate Dhrystone/instruction-throughput estimates at peak boost clocks.)*

---

### 1. 8080 / Z80 (1974 / 1976)

The Intel 8080 established the dominant 8-bit microcomputer baseline (running CP/M), while Zilog's binary-compatible Z80 expanded the register set and instruction set, dominating home computers, arcade machines, and embedded systems for decades.

| Year     | CPU                          | Cores | Threads/Core | Clock Speed              | Est. MIPS       |
|----------|------------------------------|-------|--------------|--------------------------|-----------------|
| **1974** | Intel 8008                   | 1     | 1            | 0.5Hz                    | ~0.06 MIPS      |
| **1974** | Intel 8080                   | 1     | 1            | 2 MHz                    | ~0.29 MIPS      |
| **1976** | Intel 8085                   | 1     | 1            | 3–6 MHz                  | ~0.37–0.75 MIPS |
| **1976** | Zilog Z80                    | 1     | 1            | 2.5–4 MHz                | ~0.36–0.58 MIPS |
| **1985** | Hitachi HD64180 / Zilog Z180 | 1     | 1            | 6–33 MHz                 | ~1–4 MIPS       |
| **1987** | Zilog Z280                   | 1     | 1            | 10–25 MHz                | ~2–5 MIPS       |
| **1989** | Sharp LR35902 (Game Boy)     | 1     | 1            | 4.19 MHz                 | ~0.5 MIPS       |
| **1991** | ASCII R800 (MSX turbo R)     | 1     | 1            | 7.16 MHz (14.3 MHz int.) | ~2.5 MIPS       |
| **1994** | Zilog Z380                   | 1     | 1            | 18–20 MHz                | ~5–10 MIPS      |
| **1999** | Rabbit 2000                  | 1     | 1            | 22–30 MHz                | ~10–15 MIPS     |
| **2001** | Zilog eZ80                   | 1     | 1            | 20–50 MHz                | ~15–40 MIPS     |

---

### 2. MOS 6502 (1975)

Designed as a low-cost, minimal-register 8-bit processor with heavy reliance on zero-page addressing, the 6502 powered the Apple II, Commodore 64, Atari 8-bit family, and Nintendo Entertainment System.

| Year     | CPU                                    | Cores | Threads/Core | Clock Speed | Est. MIPS       |
|----------|----------------------------------------|-------|--------------|-------------|-----------------|
| **1975** | MOS Technology 6502                    | 1     | 1            | 1–2 MHz     | ~0.43–0.85 MIPS |
| **1981** | WDC W65C02S (CMOS)                     | 1     | 1            | 2–14 MHz    | ~0.9–6 MIPS     |
| **1982** | MOS Technology 6510 (C64)              | 1     | 1            | 1.02 MHz    | ~0.43 MIPS      |
| **1983** | Ricoh 2A03 (NES)                       | 1     | 1            | 1.79 MHz    | ~0.75 MIPS      |
| **1983** | WDC W65C816S (16-bit)                  | 1     | 1            | 2.8–14 MHz  | ~1–6 MIPS       |
| **1985** | MOS Technology 8502 (C128)             | 1     | 1            | 2 MHz       | ~0.85 MIPS      |
| **1987** | Hudson Soft HuC6280 (PC Engine)        | 1     | 1            | 7.16 MHz    | ~3 MIPS         |
| **1988** | CSG 65CE02 (Amiga serial / C65)        | 1     | 1            | 3.54 MHz    | ~1.8 MIPS       |
| **1990** | Ricoh 5A22 (SNES, W65C816 core)        | 1     | 1            | 3.58 MHz    | ~1.5 MIPS       |
| **1990** | Mitsubishi M37700 (16-bit 6502 deriv.) | 1     | 1            | 16–25 MHz   | ~6–10 MIPS      |

---

### 3. DEC VAX (1977)

The 32-bit successor to the PDP-11, VAX ("Virtual Address eXtension") epitomized orthogonal CISC design with rich addressing modes and microcoded instructions, serving as the benchmark standard for "VAX MIPS."

| Year     | CPU / System                  | Cores | Threads/Core | Clock Speed   | Est. MIPS                |
|----------|-------------------------------|-------|--------------|---------------|--------------------------|
| **1977** | VAX-11/780 (discrete TTL)     | 1     | 1            | 5 MHz         | **1.0 MIPS** (Reference) |
| **1980** | VAX-11/750 (gate array)       | 1     | 1            | 3.125 MHz     | ~0.6 MIPS                |
| **1984** | VAX 8600 (ECL)                | 1     | 1            | 12.5 MHz      | ~4.2 MIPS                |
| **1985** | MicroVAX 78032 (MicroVAX II)  | 1     | 1            | 5 MHz         | ~0.9 MIPS                |
| **1986** | VAX 8800 (Nautilus, dual-CPU) | 2     | 1            | 22.2 MHz      | ~12 MIPS                 |
| **1987** | CVAX 78034                    | 1     | 1            | 12.5 MHz      | ~2.8 MIPS                |
| **1989** | Rigel                         | 1     | 1            | 35–40 MHz     | ~7–9 MIPS                |
| **1990** | VAX 9000 (Aquarius, ECL)      | 1–4   | 1            | 62.5 MHz      | ~30–120 MIPS             |
| **1991** | Mariah                        | 1     | 1            | 62.5–71 MHz   | ~15–18 MIPS              |
| **1991** | NVAX                          | 1     | 1            | 62.5–90.9 MHz | ~35–50 MIPS              |

---

### 4. x86 (1978)

Starting as a 16-bit extension of the 8080/8085 design, x86 evolved through 32-bit (IA-32) and 64-bit (AMD64 / Intel 64) extensions to dominate personal computers and servers.

| Year     | CPU                                  | Cores | Threads/Core | Clock Speed | Est. MIPS         |
|----------|--------------------------------------|-------|--------------|-------------|-------------------|
| **1978** | Intel 8086                           | 1     | 1            | 5–10 MHz    | ~0.33–0.75 MIPS   |
| **1982** | Intel 80286                          | 1     | 1            | 6–25 MHz    | ~0.9–4 MIPS       |
| **1985** | Intel 80386DX                        | 1     | 1            | 16–33 MHz   | ~5–11 MIPS        |
| **1989** | Intel 80486DX                        | 1     | 1            | 25–50 MHz   | ~20–41 MIPS       |
| **1993** | Intel Pentium (P5)                   | 1     | 1            | 60–66 MHz   | ~100–112 MIPS     |
| **1995** | Intel Pentium Pro (P6)               | 1     | 1            | 150–200 MHz | ~440–540 MIPS     |
| **1999** | AMD Athlon (K7)                      | 1     | 1            | 500–700 MHz | ~1,400–2,000 MIPS |
| **2003** | AMD Opteron / Athlon 64 (K8, x86-64) | 1     | 1            | 1.4–2.4 GHz | ~4,500–8,000 MIPS |
| **2011** | Intel Core i7-2600K (Sandy Bridge)   | 4     | 2            | 3.4–3.8 GHz | ~128,000 MIPS     |
| **2024** | AMD Ryzen 9 9950X (Zen 5)            | 16    | 2            | 4.3–5.7 GHz | ~900,000+ MIPS    |

---

### 5. Motorola 68000 / m68k (1979)

Featuring a clean, orthogonal 32-bit register file (8 data, 8 address registers) on a 16-bit external bus initially, the 68k powered early Apple Macintoshes, Commodore Amigas, Atari STs, Sun-1/2/3 workstations, and Sega Genesis consoles.

| Year     | CPU                              | Cores | Threads/Core | Clock Speed | Est. MIPS     |
|----------|----------------------------------|-------|--------------|-------------|---------------|
| **1979** | Motorola 68000                   | 1     | 1            | 8–16 MHz    | ~0.7–1.4 MIPS |
| **1982** | Motorola 68010                   | 1     | 1            | 8–16 MHz    | ~0.8–1.6 MIPS |
| **1984** | Motorola 68020 (full 32-bit)     | 1     | 1            | 12–33 MHz   | ~2.5–7 MIPS   |
| **1987** | Motorola 68030 (on-chip MMU)     | 1     | 1            | 16–50 MHz   | ~4–14 MIPS    |
| **1990** | Motorola 68040 (on-chip FPU)     | 1     | 1            | 25–40 MHz   | ~22–44 MIPS   |
| **1990** | Motorola 68332 (CPU32 embedded)  | 1     | 1            | 16–25 MHz   | ~3–5 MIPS     |
| **1994** | Motorola 68060 (superscalar)     | 1     | 1            | 50–75 MHz   | ~88–110 MIPS  |
| **1994** | Motorola ColdFire MCF5200        | 1     | 1            | 16–66 MHz   | ~15–60 MIPS   |
| **2000** | Motorola ColdFire MCF5407 (v4)   | 1     | 1            | 162–220 MHz | ~250–340 MIPS |
| **2004** | Freescale ColdFire MCF5485 (v4e) | 1     | 1            | 200 MHz     | ~308 MIPS     |

---

### 6. ARM (1985)

Originally created by Acorn Computers as a low-transistor, low-power RISC processor for the Acorn Archimedes, ARM evolved through Thumb, ARMv7, and 64-bit ARMv8/v9 (AArch64) to become the most widely manufactured ISA in history.

| Year     | CPU                                         | Cores     | Threads/Core | Clock Speed   | Est. MIPS         |
|----------|---------------------------------------------|-----------|--------------|---------------|-------------------|
| **1985** | Acorn ARM1                                  | 1         | 1            | 6 MHz         | ~3 MIPS           |
| **1986** | Acorn ARM2                                  | 1         | 1            | 8–12 MHz      | ~4–7 MIPS         |
| **1991** | ARM6 (ARM610 in Apple Newton)               | 1         | 1            | 20–33 MHz     | ~17–28 MIPS       |
| **1994** | ARM7TDMI (Game Boy Advance, phones)         | 1         | 1            | 16.8–60 MHz   | ~15–54 MIPS       |
| **1996** | DEC StrongARM SA-110                        | 1         | 1            | 100–233 MHz   | ~115–268 MIPS     |
| **2002** | ARM11 (ARM1176JZF-S, original iPhone/RPi 1) | 1         | 1            | 400–700 MHz   | ~500–875 MIPS     |
| **2007** | ARM Cortex-A8 (ARMv7-A)                     | 1         | 1            | 600 MHz–1 GHz | ~1,200–2,000 MIPS |
| **2013** | Apple A7 (Cyclone, first 64-bit ARMv8)      | 2         | 1            | 1.3–1.4 GHz   | ~8,000 MIPS       |
| **2020** | Apple M1 (Firestorm + Icestorm)             | 8 (4P+4E) | 1            | 3.2 GHz       | ~130,000+ MIPS    |
| **2024** | Qualcomm Snapdragon 8 Elite (Oryon)         | 8 (2P+6E) | 1            | 4.32 GHz      | ~220,000+ MIPS    |

---

### 7. MIPS (1985)

Born out of John Hennessy's Stanford research project, MIPS pioneered commercial load-store RISC pipelines, powering SGI workstations, Cisco routers, PlayStation 1/2/PSP, and Nintendo 64 consoles.

| Year     | CPU                                 | Cores      | Threads/Core | Clock Speed   | Est. MIPS       |
|----------|-------------------------------------|------------|--------------|---------------|-----------------|
| **1985** | MIPS R2000 (MIPS I)                 | 1          | 1            | 8–16.7 MHz    | ~5–12 MIPS      |
| **1988** | MIPS R3000 (PS1 at 33.9 MHz)        | 1          | 1            | 20–40 MHz     | ~16–32 MIPS     |
| **1991** | MIPS R4000 (first 64-bit MIPS III)  | 1          | 1            | 100 MHz       | ~70 MIPS        |
| **1994** | MIPS R4300i (Nintendo 64)           | 1          | 1            | 93.75 MHz     | ~125 MIPS       |
| **1996** | MIPS R10000 (out-of-order MIPS IV)  | 1          | 1            | 150–250 MHz   | ~300–500 MIPS   |
| **1999** | Sony/Toshiba Emotion Engine (PS2)   | 1 (+2 VUs) | 1            | 294.9 MHz     | ~450 MIPS (CPU) |
| **2004** | Broadcom BCM1250 (SiByte)           | 2          | 1            | 800 MHz–1 GHz | ~2,000 MIPS     |
| **2007** | Cavium Octeon CN5860 (networking)   | 16         | 1            | 600–800 MHz   | ~15,000 MIPS    |
| **2012** | Loongson 3B1500 (MIPS64-compatible) | 8          | 1            | 1.2–1.5 GHz   | ~25,000 MIPS    |
| **2016** | Cavium Octeon TX / MIPS I6500       | 6          | 4            | 2.0–2.5 GHz   | ~60,000 MIPS    |

---

### 8. SPARC (1987)

Developed by Sun Microsystems from the Berkeley RISC project, SPARC ("Scalable Processor Architecture") introduced rotating register windows and later pioneered high-thread-count throughput computing with Niagara.

| Year     | CPU                                      | Cores | Threads/Core | Clock Speed     | Est. MIPS         |
|----------|------------------------------------------|-------|--------------|-----------------|-------------------|
| **1987** | Fujitsu MB86900 (SPARC V7)               | 1     | 1            | 16.67 MHz       | ~10 MIPS          |
| **1992** | Sun/TI SuperSPARC (SPARC V8)             | 1     | 1            | 33–60 MHz       | ~50–100 MIPS      |
| **1995** | Sun UltraSPARC I (first 64-bit SPARC V9) | 1     | 1            | 143–200 MHz     | ~250–350 MIPS     |
| **1997** | Sun UltraSPARC II                        | 1     | 1            | 250–480 MHz     | ~500–950 MIPS     |
| **2001** | Sun UltraSPARC III                       | 1     | 1            | 750 MHz–1.2 GHz | ~1,500–2,400 MIPS |
| **2005** | Sun UltraSPARC T1 (Niagara)              | 8     | 4            | 1.0–1.4 GHz     | ~14,000 MIPS      |
| **2007** | Sun UltraSPARC T2 (Niagara 2)            | 8     | 8            | 1.2–1.6 GHz     | ~30,000 MIPS      |
| **2010** | Fujitsu SPARC64 VIIIfx (K computer)      | 8     | 1            | 2.0 GHz         | ~32,000 MIPS      |
| **2015** | Oracle SPARC M7                          | 32    | 8            | 4.13 GHz        | ~300,000+ MIPS    |
| **2017** | Oracle SPARC M8                          | 32    | 8            | 5.0 GHz         | ~400,000+ MIPS    |

---

### 9. POWER / PowerPC / Power ISA (1990)

Originating with IBM's RS/6000 workstations and expanded via the Apple–IBM–Motorola PowerPC alliance, this architecture powered Apple Macs (1994–2006), seventh-generation game consoles (Xbox 360, PS3, Wii), and high-end enterprise servers.

| Year     | CPU                                      | Cores     | Threads/Core | Clock Speed  | Est. MIPS            |
|----------|------------------------------------------|-----------|--------------|--------------|----------------------|
| **1990** | IBM POWER1 (multi-chip RIOS-1)           | 1         | 1            | 20–30 MHz    | ~25–40 MIPS          |
| **1993** | PowerPC 601 (first single-chip PowerPC)  | 1         | 1            | 50–80 MHz    | ~60–100 MIPS         |
| **1994** | PowerPC 604                              | 1         | 1            | 100–180 MHz  | ~160–300 MIPS        |
| **1997** | PowerPC 750 (G3, also Wii/GameCube)      | 1         | 1            | 233–366 MHz  | ~425–670 MIPS        |
| **1999** | Motorola PowerPC 7400 (G4, AltiVec)      | 1         | 1            | 350–500 MHz  | ~700–1,000 MIPS      |
| **2001** | IBM POWER4 (first dual-core server chip) | 2         | 1            | 1.1–1.9 GHz  | ~4,500–8,000 MIPS    |
| **2003** | IBM PowerPC 970 (G5)                     | 1         | 1            | 1.6–2.0 GHz  | ~4,000–5,000 MIPS    |
| **2005** | IBM Xenon (Xbox 360) / Cell PPE (PS3)    | 3 (Xenon) | 2            | 3.2 GHz      | ~19,000 MIPS (Xenon) |
| **2017** | IBM POWER9                               | 12–24     | 4–8          | 3.0–4.0 GHz  | ~250,000+ MIPS       |
| **2021** | IBM Power10                              | 15        | 8            | 3.5–4.0+ GHz | ~400,000+ MIPS       |

---

### 10. DEC Alpha (1992)

Designed from a clean sheet as a pure 64-bit RISC architecture without condition codes or branch delay slots, DEC Alpha held the single-threaded clock-speed and performance crown throughout the 1990s.

| Year     | CPU                                        | Cores | Threads/Core | Clock Speed  | Est. MIPS         |
|----------|--------------------------------------------|-------|--------------|--------------|-------------------|
| **1992** | Alpha 21064 (EV4)                          | 1     | 1            | 100–200 MHz  | ~150–300 MIPS     |
| **1993** | Alpha 21066 (LCA4, integrated PCI)         | 1     | 1            | 100–166 MHz  | ~130–220 MIPS     |
| **1994** | Alpha 21064A (EV45)                        | 1     | 1            | 200–300 MHz  | ~330–500 MIPS     |
| **1995** | Alpha 21164 (EV5, quad-issue)              | 1     | 1            | 250–333 MHz  | ~600–800 MIPS     |
| **1996** | Alpha 21164A (EV56)                        | 1     | 1            | 366–600 MHz  | ~900–1,500 MIPS   |
| **1997** | Alpha 21164PC (PCA56, MVI SIMD)            | 1     | 1            | 400–533 MHz  | ~950–1,300 MIPS   |
| **1998** | Alpha 21264 (EV6, out-of-order)            | 1     | 1            | 450–600 MHz  | ~1,600–2,200 MIPS |
| **1999** | Alpha 21264A (EV67)                        | 1     | 1            | 600–833 MHz  | ~2,200–3,100 MIPS |
| **2001** | Alpha 21264B / C (EV68CB)                  | 1     | 1            | 1.0–1.25 GHz | ~3,700–4,600 MIPS |
| **2003** | Alpha 21364 (EV7, integrated RDRAM/router) | 1     | 1            | 1.0–1.15 GHz | ~4,000–4,600 MIPS |

Here are the chronological evolution tables for those four architectures, formatted to match the Top 10 lists above. *(Note: As with the previous tables, MIPS values for multi-core and wide-issue VLIW/EPIC processors are rough aggregate Dhrystone/instruction-throughput estimates at peak clocks.)*

---

### 11. INMOS Transputer (1985)

Pioneered hardware-scheduled message-passing concurrency via built-in serial links and on-chip SRAM, eliminating traditional shared-bus bottlenecks in distributed and parallel computing.

| Year     | CPU                                    | Cores | Threads/Core     | Clock Speed | Est. MIPS     |
|----------|----------------------------------------|-------|------------------|-------------|---------------|
| **1985** | INMOS T414 (32-bit, 2 KB SRAM)         | 1     | 1 (HW-scheduled) | 15–20 MHz   | ~7.5–10 MIPS  |
| **1986** | INMOS T212 (16-bit, 2 KB SRAM)         | 1     | 1 (HW-scheduled) | 17.5–20 MHz | ~8.5–10 MIPS  |
| **1986** | INMOS M212 (16-bit + disk controller)  | 1     | 1 (HW-scheduled) | 17.5–20 MHz | ~8.5–10 MIPS  |
| **1987** | INMOS T800 (32-bit + 64-bit FPU)       | 1     | 1 (HW-scheduled) | 20–25 MHz   | ~10–12.5 MIPS |
| **1988** | INMOS T222 (16-bit, 4 KB SRAM)         | 1     | 1 (HW-scheduled) | 20 MHz      | ~10 MIPS      |
| **1988** | INMOS T425 (32-bit, 4 KB SRAM)         | 1     | 1 (HW-scheduled) | 20–30 MHz   | ~10–15 MIPS   |
| **1988** | INMOS T801 (separate addr/data buses)  | 1     | 1 (HW-scheduled) | 20–25 MHz   | ~12–15 MIPS   |
| **1989** | INMOS T225 (16-bit + debug extensions) | 1     | 1 (HW-scheduled) | 20 MHz      | ~10 MIPS      |
| **1989** | INMOS T400 (low-cost 2-link embedded)  | 1     | 1 (HW-scheduled) | 20 MHz      | ~10 MIPS      |
| **1990** | INMOS T805 (32-bit + FPU + debug ext.) | 1     | 1 (HW-scheduled) | 20–30 MHz   | ~10–15 MIPS   |

---

### 12. Intel / HP Itanium / IA-64 (2001)

Designed around **EPIC** (Explicitly Parallel Instruction Computing), bundling three 41-bit instructions into 128-bit VLIW-style packets with heavy compiler-driven predication and speculation rather than hardware out-of-order execution.

| Year     | CPU                                      | Cores | Threads/Core | Clock Speed     | Est. MIPS            |
|----------|------------------------------------------|-------|--------------|-----------------|----------------------|
| **2001** | Itanium (Merced)                         | 1     | 1            | 733–800 MHz     | ~1,500–1,800 MIPS    |
| **2002** | Itanium 2 (McKinley)                     | 1     | 1            | 900 MHz–1.0 GHz | ~3,500–4,000 MIPS    |
| **2003** | Itanium 2 (Madison / Deerfield LV)       | 1     | 1            | 1.0–1.6 GHz     | ~4,000–6,400 MIPS    |
| **2004** | HP mx2 (dual-Madison MCM)                | 2     | 1            | 1.1 GHz         | ~8,800 MIPS          |
| **2004** | Itanium 2 (Madison 9M / Fanwood)         | 1     | 1            | 1.5–1.67 GHz    | ~6,000–6,700 MIPS    |
| **2006** | Itanium 2 9000 (Montecito)               | 1–2   | 1–2          | 1.4–1.6 GHz     | ~12,000–15,000 MIPS  |
| **2007** | Itanium 9100 (Montvale)                  | 1–2   | 1–2          | 1.42–1.67 GHz   | ~13,000–16,000 MIPS  |
| **2010** | Itanium 9300 (Tukwila, QPI interconnect) | 2–4   | 2            | 1.33–1.73 GHz   | ~28,000–35,000 MIPS  |
| **2012** | Itanium 9500 (Poulson, 12-wide issue)    | 4–8   | 2            | 1.73–2.53 GHz   | ~80,000–115,000 MIPS |
| **2017** | Itanium 9700 (Kittson)                   | 4–8   | 2            | 1.73–2.66 GHz   | ~85,000–120,000 MIPS |

---

### 13. Sun / Oracle SPARC "Niagara" Throughput Lineage (2005)

While SPARC as an ISA dates to 1987, the **Niagara / T-Series** branch pivoted away from wide single-threaded cores toward high-density **Chip Multithreading (CMT)**—later blending high thread counts with out-of-order execution in the S3 core.

| Year     | CPU                                           | Cores | Threads/Core | Clock Speed  | Est. MIPS      |
|----------|-----------------------------------------------|-------|--------------|--------------|----------------|
| **2005** | Sun UltraSPARC T1 (Niagara)                   | 4–8   | 4            | 1.0–1.4 GHz  | ~14,000 MIPS   |
| **2007** | Sun UltraSPARC T2 (Niagara 2)                 | 4–8   | 8            | 1.2–1.6 GHz  | ~30,000 MIPS   |
| **2008** | Sun UltraSPARC T2 Plus (Victoria Falls, SMP)  | 4–8   | 8            | 1.2–1.6 GHz  | ~30,000 MIPS   |
| **2010** | Oracle SPARC T3 (Niagara 3 / Rainbow Falls)   | 8–16  | 8            | 1.65 GHz     | ~65,000 MIPS   |
| **2011** | Oracle SPARC T4 (Yosemite Falls, OoO S3 core) | 8     | 8            | 2.85–3.0 GHz | ~120,000 MIPS  |
| **2013** | Oracle SPARC T5 (S3 core)                     | 16    | 8            | 3.6 GHz      | ~280,000+ MIPS |
| **2013** | Oracle SPARC M5 (large-SMP S3 core)           | 6     | 8            | 3.6 GHz      | ~105,000 MIPS  |
| **2013** | Oracle SPARC M6 (large-SMP S3 core)           | 12    | 8            | 3.6 GHz      | ~210,000 MIPS  |

---

### 14. MCST Elbrus / E2K (2005)

A wide **VLIW** (Very Long Instruction Word) architecture capable of issuing up to 23–25 operations per clock cycle per core, paired with hardware-assisted dynamic binary translation for x86/x86-64 compatibility.

| Year     | CPU                                          | Cores      | Threads/Core | Clock Speed | Est. MIPS      |
|----------|----------------------------------------------|------------|--------------|-------------|----------------|
| **2005** | MCST Elbrus 2000 (E2K v1, 130 nm)            | 1          | 1            | 300 MHz     | ~1,800 MIPS    |
| **2010** | MCST Elbrus-S (E2K v2, 90 nm)                | 1          | 1            | 500 MHz     | ~3,000 MIPS    |
| **2011** | MCST Elbrus-2S+ (E2K v2 + 4 Elbrus DSPs)     | 2 (+4 DSP) | 1            | 500 MHz     | ~6,000 MIPS    |
| **2014** | MCST Elbrus-2SM (E2K v2, 90 nm domestic fab) | 2          | 1            | 300 MHz     | ~3,600 MIPS    |
| **2014** | MCST Elbrus-4S (E2K v3, 65 nm)               | 4          | 1            | 800 MHz     | ~20,000 MIPS   |
| **2016** | MCST Elbrus-1S+ (E2K v4 + integrated GPU)    | 1          | 1            | 1.0 GHz     | ~6,500 MIPS    |
| **2016** | MCST Elbrus-8S (E2K v4, 28 nm)               | 8          | 1            | 1.3 GHz     | ~65,000 MIPS   |
| **2018** | MCST Elbrus-8SV (E2K v5, 28 nm)              | 8          | 1            | 1.5 GHz     | ~85,000 MIPS   |
| **2021** | MCST Elbrus-16S (E2K v6, 16 nm)              | 16         | 1            | 2.0 GHz     | ~220,000+ MIPS |

## Memory

Each row below isolates a single per-chip capacity and a single chip count per module or bank, split by the year that configuration entered commercial desktop use.

### 1973–1987: Bare DIP Chips & Early Modules

| Year | Technology / Standard                   | Form Factor | Per-Chip Capacity (Org.) | Chips / Module (or Bank) | Module / Bank Capacity | Transfer Rate                |
|------|-----------------------------------------|-------------|--------------------------|--------------------------|------------------------|------------------------------|
| 1973 | PMOS DRAM (Intel 1103)                  | 18-pin DIP  | 1 Kbit (1K × 1)          | 8 chips / bank           | 1 KB                   | ~2–3 MT/s (asynchronous)     |
| 1974 | NMOS DRAM (Mostek MK4096)               | 16-pin DIP  | 4 Kbit (4K × 1)          | 8 chips / bank           | 4 KB                   | ~2.8–3.3 MT/s (asynchronous) |
| 1976 | NMOS DRAM (Mostek MK4116)               | 16-pin DIP  | 16 Kbit (16K × 1)        | 8 chips / bank           | 16 KB                  | ~4–6.6 MT/s (asynchronous)   |
| 1981 | NMOS Page-Mode DRAM (4164)              | 16-pin DIP  | 64 Kbit (64K × 1)        | 8 chips / bank           | 64 KB                  | ~5–6.6 MT/s                  |
| 1981 | NMOS Page-Mode DRAM (4164 w/ parity)    | 16-pin DIP  | 64 Kbit (64K × 1)        | 9 chips / bank           | 64 KB (72 KB raw)      | ~5–6.6 MT/s                  |
| 1984 | NMOS / CMOS Page-Mode (41256)           | 16-pin DIP  | 256 Kbit (256K × 1)      | 8 chips / bank           | 256 KB                 | ~6.6–10 MT/s                 |
| 1984 | NMOS / CMOS Page-Mode (41256 w/ parity) | 16-pin DIP  | 256 Kbit (256K × 1)      | 9 chips / bank           | 256 KB (288 KB raw)    | ~6.6–10 MT/s                 |
| 1985 | Early 30-pin SIMM                       | 30-pin SIMM | 256 Kbit (256K × 1)      | 8 chips                  | 256 KB                 | ~6.6–8.3 MT/s                |
| 1986 | Fast Page Mode (FPM) DRAM               | 30-pin SIMM | 1 Mbit (256K × 4)        | 2 chips                  | 256 KB                 | ~16–25 MT/s burst            |
| 1986 | Fast Page Mode (FPM) DRAM               | 30-pin SIMM | 1 Mbit (1M × 1)          | 8 chips                  | 1 MB                   | ~16–25 MT/s burst            |
| 1986 | Fast Page Mode (FPM) DRAM (parity)      | 30-pin SIMM | 1 Mbit (1M × 1)          | 9 chips                  | 1 MB                   | ~16–25 MT/s burst            |
| 1987 | Fast Page Mode (FPM) DRAM               | 30-pin SIMM | 4 Mbit (1M × 4)          | 8 chips                  | 4 MB                   | ~25–33 MT/s burst            |
| 1987 | Fast Page Mode (FPM) DRAM (parity)      | 30-pin SIMM | 4 Mbit (1M × 4)          | 9 chips                  | 4 MB                   | ~25–33 MT/s burst            |

---

### 1990–1999: 72-Pin SIMMs, EDO, SDRAM & RDRAM

| Year | Technology / Standard          | Form Factor  | Per-Chip Capacity (Org.) | Chips / Module | Module Capacity | Transfer Rate |
|------|--------------------------------|--------------|--------------------------|----------------|-----------------|---------------|
| 1990 | FPM DRAM                       | 72-pin SIMM  | 4 Mbit (1M × 4)          | 8 chips        | 4 MB            | ~25–33 MT/s   |
| 1990 | FPM DRAM (parity)              | 72-pin SIMM  | 4 Mbit (1M × 4)          | 12 chips       | 4 MB            | ~25–33 MT/s   |
| 1992 | FPM DRAM                       | 72-pin SIMM  | 16 Mbit (4M × 4)         | 8 chips        | 16 MB           | ~33 MT/s      |
| 1992 | FPM DRAM (parity)              | 72-pin SIMM  | 16 Mbit (4M × 4)         | 12 chips       | 16 MB           | ~33 MT/s      |
| 1994 | FPM DRAM (double-sided)        | 72-pin SIMM  | 16 Mbit (4M × 4)         | 16 chips       | 32 MB           | ~33 MT/s      |
| 1994 | FPM DRAM (double-sided parity) | 72-pin SIMM  | 16 Mbit (4M × 4)         | 24 chips       | 32 MB           | ~33 MT/s      |
| 1995 | EDO DRAM                       | 72-pin SIMM  | 4 Mbit (1M × 4)          | 8 chips        | 4 MB            | ~40–50 MT/s   |
| 1995 | EDO DRAM (parity)              | 72-pin SIMM  | 4 Mbit (1M × 4)          | 12 chips       | 4 MB            | ~40–50 MT/s   |
| 1995 | EDO DRAM                       | 72-pin SIMM  | 16 Mbit (4M × 4)         | 8 chips        | 16 MB           | ~40–50 MT/s   |
| 1995 | EDO DRAM (double-sided)        | 72-pin SIMM  | 16 Mbit (4M × 4)         | 16 chips       | 32 MB           | ~40–50 MT/s   |
| 1996 | EDO DRAM                       | 168-pin DIMM | 16 Mbit (4M × 4)         | 16 chips       | 32 MB           | 50–66 MT/s    |
| 1996 | EDO DRAM (ECC)                 | 168-pin DIMM | 16 Mbit (4M × 4)         | 18 chips       | 32 MB           | 50–66 MT/s    |
| 1996 | PC66 SDRAM                     | 168-pin DIMM | 16 Mbit (2M × 8)         | 8 chips        | 16 MB           | 66 MT/s       |
| 1996 | PC66 SDRAM                     | 168-pin DIMM | 16 Mbit (2M × 8)         | 16 chips       | 32 MB           | 66 MT/s       |
| 1997 | PC66 SDRAM                     | 168-pin DIMM | 64 Mbit (8M × 8)         | 8 chips        | 64 MB           | 66 MT/s       |
| 1997 | PC66 SDRAM                     | 168-pin DIMM | 64 Mbit (8M × 8)         | 16 chips       | 128 MB          | 66 MT/s       |
| 1998 | PC100 SDRAM                    | 168-pin DIMM | 64 Mbit (8M × 8)         | 8 chips        | 64 MB           | 100 MT/s      |
| 1998 | PC100 SDRAM                    | 168-pin DIMM | 64 Mbit (8M × 8)         | 16 chips       | 128 MB          | 100 MT/s      |
| 1999 | PC100 SDRAM                    | 168-pin DIMM | 128 Mbit (16M × 8)       | 8 chips        | 128 MB          | 100 MT/s      |
| 1999 | PC100 SDRAM                    | 168-pin DIMM | 128 Mbit (16M × 8)       | 16 chips       | 256 MB          | 100 MT/s      |
| 1999 | PC133 SDRAM                    | 168-pin DIMM | 128 Mbit (16M × 8)       | 8 chips        | 128 MB          | 133 MT/s      |
| 1999 | PC133 SDRAM                    | 168-pin DIMM | 128 Mbit (16M × 8)       | 16 chips       | 256 MB          | 133 MT/s      |
| 1999 | PC600 / PC700 RDRAM            | 184-pin RIMM | 64 Mbit                  | 8 chips        | 64 MB           | 600–711 MT/s  |
| 1999 | PC600 / PC700 RDRAM            | 184-pin RIMM | 128 Mbit                 | 16 chips       | 256 MB          | 600–711 MT/s  |
| 1999 | PC800 RDRAM                    | 184-pin RIMM | 128 Mbit                 | 8 chips        | 128 MB          | 800 MT/s      |
| 1999 | PC800 RDRAM                    | 184-pin RIMM | 128 Mbit                 | 16 chips       | 256 MB          | 800 MT/s      |

---

### 2000–2006: DDR1 & DDR2 SDRAM

| Year | Technology / Standard      | Form Factor  | Per-Chip Capacity (Org.) | Chips / Module | Module Capacity | Transfer Rate |
|------|----------------------------|--------------|--------------------------|----------------|-----------------|---------------|
| 2000 | PC133 SDRAM (high-density) | 168-pin DIMM | 256 Mbit (32M × 8)       | 16 chips       | 512 MB          | 133 MT/s      |
| 2000 | DDR-200 (PC-1600)          | 184-pin DIMM | 128 Mbit (16M × 8)       | 8 chips        | 128 MB          | 200 MT/s      |
| 2000 | DDR-200 (PC-1600)          | 184-pin DIMM | 128 Mbit (16M × 8)       | 16 chips       | 256 MB          | 200 MT/s      |
| 2000 | DDR-266 (PC-2100)          | 184-pin DIMM | 128 Mbit (16M × 8)       | 8 chips        | 128 MB          | 266 MT/s      |
| 2000 | DDR-266 (PC-2100)          | 184-pin DIMM | 128 Mbit (16M × 8)       | 16 chips       | 256 MB          | 266 MT/s      |
| 2001 | DDR-266 (PC-2100)          | 184-pin DIMM | 256 Mbit (32M × 8)       | 8 chips        | 256 MB          | 266 MT/s      |
| 2001 | DDR-266 (PC-2100)          | 184-pin DIMM | 256 Mbit (32M × 8)       | 16 chips       | 512 MB          | 266 MT/s      |
| 2002 | PC1066 RDRAM               | 184-pin RIMM | 256 Mbit                 | 8 chips        | 256 MB          | 1066 MT/s     |
| 2002 | PC1066 RDRAM               | 184-pin RIMM | 256 Mbit                 | 16 chips       | 512 MB          | 1066 MT/s     |
| 2002 | DDR-333 (PC-2700)          | 184-pin DIMM | 256 Mbit (32M × 8)       | 8 chips        | 256 MB          | 333 MT/s      |
| 2002 | DDR-333 (PC-2700)          | 184-pin DIMM | 256 Mbit (32M × 8)       | 16 chips       | 512 MB          | 333 MT/s      |
| 2003 | DDR-400 (PC-3200)          | 184-pin DIMM | 256 Mbit (32M × 8)       | 8 chips        | 256 MB          | 400 MT/s      |
| 2003 | DDR-400 (PC-3200)          | 184-pin DIMM | 256 Mbit (32M × 8)       | 16 chips       | 512 MB          | 400 MT/s      |
| 2003 | DDR-400 (PC-3200)          | 184-pin DIMM | 512 Mbit (64M × 8)       | 8 chips        | 512 MB          | 400 MT/s      |
| 2003 | DDR-400 (PC-3200)          | 184-pin DIMM | 512 Mbit (64M × 8)       | 16 chips       | 1 GB            | 400 MT/s      |
| 2003 | DDR2-400 (PC2-3200)        | 240-pin DIMM | 256 Mbit (32M × 8)       | 8 chips        | 256 MB          | 400 MT/s      |
| 2003 | DDR2-400 (PC2-3200)        | 240-pin DIMM | 512 Mbit (64M × 8)       | 8 chips        | 512 MB          | 400 MT/s      |
| 2003 | DDR2-533 (PC2-4200)        | 240-pin DIMM | 256 Mbit (32M × 8)       | 8 chips        | 256 MB          | 533 MT/s      |
| 2003 | DDR2-533 (PC2-4200)        | 240-pin DIMM | 512 Mbit (64M × 8)       | 8 chips        | 512 MB          | 533 MT/s      |
| 2004 | DDR2-667 (PC2-5300)        | 240-pin DIMM | 512 Mbit (64M × 8)       | 8 chips        | 512 MB          | 667 MT/s      |
| 2004 | DDR2-667 (PC2-5300)        | 240-pin DIMM | 512 Mbit (64M × 8)       | 16 chips       | 1 GB            | 667 MT/s      |
| 2005 | DDR2-667 (PC2-5300)        | 240-pin DIMM | 1 Gbit (128M × 8)        | 8 chips        | 1 GB            | 667 MT/s      |
| 2005 | DDR2-667 (PC2-5300)        | 240-pin DIMM | 1 Gbit (128M × 8)        | 16 chips       | 2 GB            | 667 MT/s      |
| 2006 | DDR2-800 (PC2-6400)        | 240-pin DIMM | 512 Mbit (64M × 8)       | 8 chips        | 512 MB          | 800 MT/s      |
| 2006 | DDR2-800 (PC2-6400)        | 240-pin DIMM | 1 Gbit (128M × 8)        | 8 chips        | 1 GB            | 800 MT/s      |
| 2006 | DDR2-800 (PC2-6400)        | 240-pin DIMM | 1 Gbit (128M × 8)        | 16 chips       | 2 GB            | 800 MT/s      |

---

### 2007–2019: DDR3 & DDR4 SDRAM

| Year | Technology / Standard | Form Factor  | Per-Chip Capacity (Org.) | Chips / Module  | Module Capacity | Transfer Rate |
|------|-----------------------|--------------|--------------------------|-----------------|-----------------|---------------|
| 2007 | DDR2-1066 (PC2-8500)  | 240-pin DIMM | 1 Gbit (128M × 8)        | 8 chips         | 1 GB            | 1066 MT/s     |
| 2007 | DDR2-1066 (PC2-8500)  | 240-pin DIMM | 1 Gbit (128M × 8)        | 16 chips        | 2 GB            | 1066 MT/s     |
| 2007 | DDR3-800 (PC3-6400)   | 240-pin DIMM | 1 Gbit (128M × 8)        | 8 chips         | 1 GB            | 800 MT/s      |
| 2007 | DDR3-1066 (PC3-8500)  | 240-pin DIMM | 1 Gbit (128M × 8)        | 8 chips         | 1 GB            | 1066 MT/s     |
| 2007 | DDR3-1333 (PC3-10600) | 240-pin DIMM | 1 Gbit (128M × 8)        | 8 chips         | 1 GB            | 1333 MT/s     |
| 2007 | DDR3-1333 (PC3-10600) | 240-pin DIMM | 1 Gbit (128M × 8)        | 16 chips        | 2 GB            | 1333 MT/s     |
| 2008 | DDR3-1333 (PC3-10600) | 240-pin DIMM | 2 Gbit (256M × 8)        | 8 chips         | 2 GB            | 1333 MT/s     |
| 2008 | DDR3-1333 (PC3-10600) | 240-pin DIMM | 2 Gbit (256M × 8)        | 16 chips        | 4 GB            | 1333 MT/s     |
| 2008 | DDR3-1600 (PC3-12800) | 240-pin DIMM | 2 Gbit (256M × 8)        | 8 chips         | 2 GB            | 1600 MT/s     |
| 2008 | DDR3-1600 (PC3-12800) | 240-pin DIMM | 2 Gbit (256M × 8)        | 16 chips        | 4 GB            | 1600 MT/s     |
| 2010 | DDR3-1600 (PC3-12800) | 240-pin DIMM | 4 Gbit (512M × 8)        | 8 chips         | 4 GB            | 1600 MT/s     |
| 2010 | DDR3-1600 (PC3-12800) | 240-pin DIMM | 4 Gbit (512M × 8)        | 16 chips        | 8 GB            | 1600 MT/s     |
| 2011 | DDR3-1866 (PC3-14900) | 240-pin DIMM | 4 Gbit (512M × 8)        | 8 chips         | 4 GB            | 1866 MT/s     |
| 2011 | DDR3-1866 (PC3-14900) | 240-pin DIMM | 4 Gbit (512M × 8)        | 16 chips        | 8 GB            | 1866 MT/s     |
| 2012 | DDR3-2133 (PC3-17000) | 240-pin DIMM | 4 Gbit (512M × 8)        | 8 chips         | 4 GB            | 2133 MT/s     |
| 2012 | DDR3-2133 (PC3-17000) | 240-pin DIMM | 4 Gbit (512M × 8)        | 16 chips        | 8 GB            | 2133 MT/s     |
| 2014 | DDR4-1600 (PC4-12800) | 288-pin DIMM | 4 Gbit (512M × 8)        | 8 chips         | 4 GB            | 1600 MT/s     |
| 2014 | DDR4-1600 (PC4-12800) | 288-pin DIMM | 4 Gbit (512M × 8)        | 16 chips        | 8 GB            | 1600 MT/s     |
| 2014 | DDR4-2133 (PC4-17000) | 288-pin DIMM | 4 Gbit (512M × 8)        | 8 chips         | 4 GB            | 2133 MT/s     |
| 2014 | DDR4-2133 (PC4-17000) | 288-pin DIMM | 8 Gbit (1G × 8)          | 8 chips         | 8 GB            | 2133 MT/s     |
| 2014 | DDR4-2133 (PC4-17000) | 288-pin DIMM | 8 Gbit (1G × 8)          | 16 chips        | 16 GB           | 2133 MT/s     |
| 2015 | DDR4-2400 (PC4-19200) | 288-pin DIMM | 8 Gbit (1G × 8)          | 8 chips         | 8 GB            | 2400 MT/s     |
| 2015 | DDR4-2400 (PC4-19200) | 288-pin DIMM | 8 Gbit (1G × 8)          | 16 chips        | 16 GB           | 2400 MT/s     |
| 2016 | DDR4-2666 (PC4-21300) | 288-pin DIMM | 8 Gbit (1G × 8)          | 8 chips         | 8 GB            | 2666 MT/s     |
| 2016 | DDR4-2666 (PC4-21300) | 288-pin DIMM | 8 Gbit (1G × 8)          | 16 chips        | 16 GB           | 2666 MT/s     |
| 2018 | DDR4-2666 (PC4-21300) | 288-pin DIMM | 16 Gbit (2G × 8)         | 8 chips         | 16 GB           | 2666 MT/s     |
| 2018 | DDR4-2666 (PC4-21300) | 288-pin DIMM | 16 Gbit (2G × 8)         | 16 chips        | 32 GB           | 2666 MT/s     |
| 2018 | DDR4-2933 (PC4-23400) | 288-pin DIMM | 8 Gbit (1G × 8)          | 8 chips         | 8 GB            | 2933 MT/s     |
| 2018 | DDR4-2933 (PC4-23400) | 288-pin DIMM | 16 Gbit (2G × 8)         | 16 chips        | 32 GB           | 2933 MT/s     |
| 2019 | DDR4-3200 (PC4-25600) | 288-pin DIMM | 8 Gbit (1G × 8)          | 4 chips (1R×16) | 4 GB            | 3200 MT/s     |
| 2019 | DDR4-3200 (PC4-25600) | 288-pin DIMM | 8 Gbit (1G × 8)          | 8 chips (1R×8)  | 8 GB            | 3200 MT/s     |
| 2019 | DDR4-3200 (PC4-25600) | 288-pin DIMM | 8 Gbit (1G × 8)          | 16 chips (2R×8) | 16 GB           | 3200 MT/s     |
| 2019 | DDR4-3200 (PC4-25600) | 288-pin DIMM | 16 Gbit (2G × 8)         | 4 chips (1R×16) | 8 GB            | 3200 MT/s     |
| 2019 | DDR4-3200 (PC4-25600) | 288-pin DIMM | 16 Gbit (2G × 8)         | 8 chips (1R×8)  | 16 GB           | 3200 MT/s     |
| 2019 | DDR4-3200 (PC4-25600) | 288-pin DIMM | 16 Gbit (2G × 8)         | 16 chips (2R×8) | 32 GB           | 3200 MT/s     |

---

### 2020–2026: DDR5 UDIMM & CUDIMM

| Year | Technology / Standard | Form Factor    | Per-Chip Capacity (Org.) | Chips / Module   | Module Capacity | Transfer Rate |
|------|-----------------------|----------------|--------------------------|------------------|-----------------|---------------|
| 2020 | DDR5-4800 (PC5-38400) | 288-pin UDIMM  | 16 Gbit (2G × 8)         | 8 chips (1R×8)   | 16 GB           | 4800 MT/s     |
| 2020 | DDR5-4800 (PC5-38400) | 288-pin UDIMM  | 16 Gbit (2G × 8)         | 16 chips (2R×8)  | 32 GB           | 4800 MT/s     |
| 2021 | DDR5-4800 (PC5-38400) | 288-pin UDIMM  | 16 Gbit (1G × 16)        | 4 chips (1R×16)  | 8 GB            | 4800 MT/s     |
| 2022 | DDR5-5200 (PC5-41600) | 288-pin UDIMM  | 16 Gbit (2G × 8)         | 8 chips (1R×8)   | 16 GB           | 5200 MT/s     |
| 2022 | DDR5-5200 (PC5-41600) | 288-pin UDIMM  | 16 Gbit (2G × 8)         | 16 chips (2R×8)  | 32 GB           | 5200 MT/s     |
| 2022 | DDR5-5600 (PC5-44800) | 288-pin UDIMM  | 16 Gbit (2G × 8)         | 8 chips (1R×8)   | 16 GB           | 5600 MT/s     |
| 2022 | DDR5-5600 (PC5-44800) | 288-pin UDIMM  | 16 Gbit (2G × 8)         | 16 chips (2R×8)  | 32 GB           | 5600 MT/s     |
| 2023 | DDR5-5600 (PC5-44800) | 288-pin UDIMM  | 24 Gbit (3G × 8)         | 8 chips (1R×8)   | 24 GB           | 5600 MT/s     |
| 2023 | DDR5-5600 (PC5-44800) | 288-pin UDIMM  | 24 Gbit (3G × 8)         | 16 chips (2R×8)  | 48 GB           | 5600 MT/s     |
| 2023 | DDR5-6000             | 288-pin UDIMM  | 16 Gbit (2G × 8)         | 8 chips (1R×8)   | 16 GB           | 6000 MT/s     |
| 2023 | DDR5-6000             | 288-pin UDIMM  | 16 Gbit (2G × 8)         | 16 chips (2R×8)  | 32 GB           | 6000 MT/s     |
| 2023 | DDR5-6000             | 288-pin UDIMM  | 24 Gbit (3G × 8)         | 8 chips (1R×8)   | 24 GB           | 6000 MT/s     |
| 2023 | DDR5-6000             | 288-pin UDIMM  | 24 Gbit (3G × 8)         | 16 chips (2R×8)  | 48 GB           | 6000 MT/s     |
| 2024 | DDR5-6400 (PC5-51200) | 288-pin UDIMM  | 16 Gbit (2G × 8)         | 8 chips (1R×8)   | 16 GB           | 6400 MT/s     |
| 2024 | DDR5-6400 (PC5-51200) | 288-pin UDIMM  | 16 Gbit (2G × 8)         | 16 chips (2R×8)  | 32 GB           | 6400 MT/s     |
| 2024 | DDR5-6400 (PC5-51200) | 288-pin UDIMM  | 24 Gbit (3G × 8)         | 8 chips (1R×8)   | 24 GB           | 6400 MT/s     |
| 2024 | DDR5-6400 (PC5-51200) | 288-pin UDIMM  | 24 Gbit (3G × 8)         | 16 chips (2R×8)  | 48 GB           | 6400 MT/s     |
| 2024 | DDR5-6400 (PC5-51200) | 288-pin UDIMM  | 32 Gbit (4G × 8)         | 16 chips (2R×8)  | 64 GB           | 6400 MT/s     |
| 2024 | DDR5-6400 CUDIMM      | 288-pin CUDIMM | 16 Gbit (2G × 8)         | 8 chips + 1 CKD  | 16 GB           | 6400 MT/s     |
| 2024 | DDR5-6400 CUDIMM      | 288-pin CUDIMM | 24 Gbit (3G × 8)         | 8 chips + 1 CKD  | 24 GB           | 6400 MT/s     |
| 2024 | DDR5-6400 CUDIMM      | 288-pin CUDIMM | 32 Gbit (4G × 8)         | 16 chips + 1 CKD | 64 GB           | 6400 MT/s     |
| 2024 | DDR5-7200 CUDIMM      | 288-pin CUDIMM | 16 Gbit (2G × 8)         | 8 chips + 1 CKD  | 16 GB           | 7200 MT/s     |
| 2024 | DDR5-7200 CUDIMM      | 288-pin CUDIMM | 24 Gbit (3G × 8)         | 8 chips + 1 CKD  | 24 GB           | 7200 MT/s     |
| 2024 | DDR5-8000 CUDIMM      | 288-pin CUDIMM | 24 Gbit (3G × 8)         | 8 chips + 1 CKD  | 24 GB           | 8000 MT/s     |
| 2024 | DDR5-8200 CUDIMM      | 288-pin CUDIMM | 24 Gbit (3G × 8)         | 8 chips + 1 CKD  | 24 GB           | 8200 MT/s     |
| 2024 | DDR5-8400 CUDIMM      | 288-pin CUDIMM | 24 Gbit (3G × 8)         | 8 chips + 1 CKD  | 24 GB           | 8400 MT/s     |
| 2024 | DDR5-8800 CUDIMM      | 288-pin CUDIMM | 24 Gbit (3G × 8)         | 8 chips + 1 CKD  | 24 GB           | 8800 MT/s     |
| 2025 | DDR5-9200 CUDIMM (OC) | 288-pin CUDIMM | 24 Gbit (3G × 8)         | 8 chips + 1 CKD  | 24 GB           | 9200 MT/s     |
| 2026 | DDR5-7200 CUDIMM      | 288-pin CUDIMM | 24 Gbit (3G × 8)         | 16 chips + 1 CKD | 48 GB           | 7200 MT/s     |
| 2026 | DDR5-8000 CUDIMM      | 288-pin CUDIMM | 32 Gbit (4G × 8)         | 16 chips + 1 CKD | 64 GB           | 8000 MT/s     |

## Floppy Disk Drives

| Order | Disk format | Density / type                      | Introduction | Maximum capacity |
|-------|-------------|-------------------------------------|--------------|------------------|
| 1     | 8-inch      | Single-sided, single-density (SSSD) | 1973         | 250 KB           |
| 2     | 8-inch      | Double-sided, single-density (DSSD) | 1976         | 500 KB           |
| 3     | 5¼-inch     | Single-sided, single-density        | 1976         | 110 KB           |
| 4     | 8-inch      | Double-sided, double-density (DSDD) | 1977         | 1.2 MB           |
| 5     | 5¼-inch     | Double-sided, double-density (DSDD) | 1978         | 360 KB           |
| 6     | 5¼-inch     | Quad-density (QD)                   | 1980–84      | 720 KB           |
| 7     | 5¼-inch     | High-density (HD)                   | 1982–84      | 1.2 MB           |
| 8     | 3½-inch     | Single-sided, double-density        | 1982–83      | 360 KB           |
| 9     | 3½-inch     | Double-sided, double-density (DD)   | 1983–84      | 720 KB           |
| 10    | 3½-inch     | High-density (HD)                   | 1987         | 1.44 MB          |
| 11    | 3½-inch     | Extra-high-density (ED)             | 1987–91      | 2.88 MB          |

## Hard Drisk Drives

Here is the table broken down by individual **interface/encoding/speed tier**, **platter size**, **specific platter count**, and **notable capacity milestones** over time, ordered chronologically by commercial availability.

| Interface / Encoding Tier                            | Year First Commercially Available | Platter Size | Platter Count | Capacity Milestone |
|------------------------------------------------------|-----------------------------------|--------------|---------------|--------------------|
| **ST-506 / ST-412 — MFM** *(5.0 Mbps)*               | **1980**                          | 5.25 in      | 2             | 5 MB               |
| **ST-506 / ST-412 — MFM** *(5.0 Mbps)*               | **1981**                          | 5.25 in      | 4             | 10 MB              |
| **ST-506 / ST-412 — MFM** *(5.0 Mbps)*               | **1983**                          | 5.25 in      | 4             | 20 MB              |
| **SCSI-1 (Narrow / Single-Ended)** *(5 MB/s)*        | **1983**                          | 5.25 in      | 4             | 40 MB              |
| **ESDI — 10 MHz (10 Mbps)**                          | **1983**                          | 5.25 in      | 8             | 140 MB             |
| **ST-506 / ST-412 — MFM** *(5.0 Mbps)*               | **1985**                          | 3.5 in       | 2             | 20 MB              |
| **ST-506 / ST-412 — RLL (2,7)** *(7.5 Mbps)*         | **1985**                          | 5.25 in      | 2             | 30 MB              |
| **ST-506 / ST-412 — MFM** *(5.0 Mbps)*               | **1986**                          | 5.25 in      | 5             | 40 MB              |
| **SCSI-1 (Narrow / Single-Ended)** *(5 MB/s)*        | **1986**                          | 5.25 in      | 5             | 80 MB              |
| **ST-506 / ST-412 — RLL (2,7)** *(7.5 Mbps)*         | **1986**                          | 3.5 in       | 2             | 30 MB              |
| **IDE / PATA — ATA-1** *(up to 16.7 MB/s)*           | **1986**                          | 3.5 in       | 2             | 40 MB              |
| **ST-506 / ST-412 — RLL (2,7)** *(7.5 Mbps)*         | **1987**                          | 5.25 in      | 4             | 65 MB              |
| **ESDI — 15 MHz (15 Mbps)**                          | **1987**                          | 5.25 in      | 8             | 380 MB             |
| **ESDI — 10 MHz (10 Mbps)**                          | **1987**                          | 3.5 in       | 4             | 160 MB             |
| **IDE / PATA — ATA-1** *(up to 16.7 MB/s)*           | **1989**                          | 3.5 in       | 3             | 120 MB             |
| **Fast SCSI-2 (8-bit)** *(10 MB/s)*                  | **1990**                          | 3.5 in       | 4             | 425 MB             |
| **Fast SCSI-2 (8-bit)** *(10 MB/s)*                  | **1990**                          | 5.25 in      | 8             | 1.2 GB             |
| **ESDI — 20–24 MHz (20–24 Mbps)**                    | **1990**                          | 5.25 in      | 8             | 760 MB             |
| **ESDI — 20–24 MHz (20–24 Mbps)**                    | **1990**                          | 5.25 in      | 11            | 1.2 GB             |
| **Fast Wide SCSI-2 (16-bit)** *(20 MB/s)*            | **1992**                          | 3.5 in       | 6             | 2.1 GB             |
| **Fast Wide SCSI-2 (16-bit)** *(20 MB/s)*            | **1993**                          | 5.25 in      | 11            | 9.1 GB             |
| **IDE / PATA — ATA-1 / EIDE** *(up to 16.7 MB/s)*    | **1993**                          | 3.5 in       | 3             | 540 MB             |
| **IDE / PATA — EIDE** *(up to 16.7 MB/s)*            | **1995**                          | 3.5 in       | 3             | 1.6 GB             |
| **Ultra SCSI / Ultra Wide SCSI** *(20–40 MB/s)*      | **1995**                          | 3.5 in       | 4             | 4.5 GB             |
| **Ultra SCSI / Ultra Wide SCSI** *(20–40 MB/s)*      | **1996**                          | 3.5 in       | 8             | 9.1 GB             |
| **IDE / PATA — Ultra ATA/33 (UDMA-2)** *(33.3 MB/s)* | **1997**                          | 3.5 in       | 3             | 6.4 GB             |
| **IDE / PATA — Ultra ATA/33 (UDMA-2)** *(33.3 MB/s)* | **1998**                          | 3.5 in       | 4             | 13.6 GB            |
| **Ultra2 SCSI / Wide Ultra2 SCSI** *(40–80 MB/s)*    | **1998**                          | 3.5 in       | 6             | 18.2 GB            |
| **Ultra2 SCSI / Wide Ultra2 SCSI** *(40–80 MB/s)*    | **1999**                          | 3.5 in       | 10            | 36.4 GB            |
| **IDE / PATA — Ultra ATA/66 (UDMA-4)** *(66.7 MB/s)* | **1999**                          | 3.5 in       | 3             | 30 GB              |
| **Ultra-160 SCSI (Ultra3)** *(160 MB/s)*             | **2000**                          | 3.5 in       | 4             | 36.7 GB            |
| **IDE / PATA — Ultra ATA/100 (UDMA-5)** *(100 MB/s)* | **2000**                          | 3.5 in       | 5             | 75 GB              |
| **IDE / PATA — Ultra ATA/100 (UDMA-5)** *(100 MB/s)* | **2001**                          | 3.5 in       | 3             | 120 GB             |
| **IDE / PATA — Ultra ATA/133 (UDMA-6)** *(133 MB/s)* | **2001**                          | 3.5 in       | 3             | 160 GB             |
| **Ultra-320 SCSI** *(320 MB/s)*                      | **2002**                          | 3.5 in       | 4             | 73.4 GB            |
| **SATA 1.5 Gb/s (SATA I)** *(150 MB/s burst)*        | **2002**                          | 3.5 in       | 2             | 120 GB             |
| **SATA 1.5 Gb/s (SATA I)** *(150 MB/s burst)*        | **2004**                          | 3.5 in       | 4             | 400 GB             |
| **SAS 3 Gb/s (SAS-1)** *(300 MB/s)*                  | **2004**                          | 3.5 in       | 4             | 146 GB             |
| **SAS 3 Gb/s (SAS-1)** *(300 MB/s)*                  | **2005**                          | 2.5 in       | 2             | 73 GB              |
| **SATA 3.0 Gb/s (SATA II)** *(300 MB/s burst)*       | **2005**                          | 3.5 in       | 4             | 500 GB             |
| **SATA 3.0 Gb/s (SATA II)** *(300 MB/s burst)*       | **2007**                          | 3.5 in       | 5             | 1 TB               |
| **SATA 3.0 Gb/s (SATA II)** *(300 MB/s burst)*       | **2009**                          | 3.5 in       | 4             | 2 TB               |
| **SAS 6 Gb/s (SAS-2)** *(600 MB/s)*                  | **2009**                          | 2.5 in       | 3             | 600 GB             |
| **SAS 6 Gb/s (SAS-2)** *(600 MB/s)*                  | **2010**                          | 3.5 in       | 5             | 3 TB               |
| **SATA 6.0 Gb/s (SATA III)** *(600 MB/s burst)*      | **2011**                          | 3.5 in       | 4             | 4 TB               |
| **SATA 6.0 Gb/s (SATA III)** *(600 MB/s burst)*      | **2013**                          | 3.5 in       | 7             | 6 TB               |
| **SAS 12 Gb/s (SAS-3)** *(1,200 MB/s)*               | **2013**                          | 2.5 in       | 3             | 1.2 TB             |
| **SATA 6.0 Gb/s (SATA III)** *(600 MB/s burst)*      | **2014**                          | 3.5 in       | 7             | 10 TB              |
| **SATA 6.0 Gb/s (SATA III)** *(600 MB/s burst)*      | **2018**                          | 3.5 in       | 8             | 14 TB              |
| **SAS 12 Gb/s (SAS-3)** *(1,200 MB/s)*               | **2019**                          | 3.5 in       | 9             | 16 TB              |
| **SATA 6.0 Gb/s (SATA III)** *(600 MB/s burst)*      | **2021**                          | 3.5 in       | 10            | 20 TB              |
| **SATA 6.0 Gb/s (SATA III)** *(600 MB/s burst)*      | **2023**                          | 3.5 in       | 10            | 24 TB              |
| **SAS 22.5 Gb/s / 24G (SAS-4)** *(2,400 MB/s)*       | **2023**                          | 3.5 in       | 10            | 24 TB              |
| **SATA 6.0 Gb/s (SATA III)** *(600 MB/s burst)*      | **2024–2025**                     | 3.5 in       | 10            | 30 TB – 36 TB      |
| **PCIe / NVMe** *(Native NVMe over PCIe)*            | **2023–2024**                     | 3.5 in       | 10            | 24 TB – 32 TB      |

### Key Patterns Visible When Split by Platter Count

1. **Areal density jumps stand out clearly:** Notice how **4 platters** on a 3.5-inch drive held **425 MB** in 1990 (Fast SCSI-2), **36.7 GB** in 2000 (Ultra-160), **400 GB** in 2004 (SATA I), **2 TB** in 2009 (SATA II), and **4 TB** in 2011 (SATA III)—a ~10,000× capacity gain on the exact same platter count and diameter before helium sealing pushed platter counts up to 7–10.
2. **Air vs. Helium ceiling:** From 1986 through 2012, standard 3.5-inch consumer/desktop HDDs maxed out at **5 platters** due to air turbulence and chassis height limits. Switching from air to **helium** in 2013–2014 allowed manufacturers to squeeze **7, 8, 9, and eventually 10 thinner platters** into the same 1-inch-high (26.1 mm) 3.5-inch enclosure.

## CPU x Memrory Matrices

Here are all 14 matrices split so that each memory column corresponds directly to a single row in the **Memory** tables of `DEVICES.md` (identified by `[Year] Technology / Standard — Form Factor / Org. / Capacity`). Only memory rows paired with at least one CPU in that group in commercially available systems are included in each matrix (`✓` = paired, `—` = not).

---

### 1. 8080 / Z80 (1974 / 1976)

| CPU | [1973] PMOS DRAM (Intel 1103) — 18-pin DIP, 1 Kbit (1K×1), 8 chips, 1 KB | [1974] NMOS DRAM (Mostek MK4096) — 16-pin DIP, 4 Kbit (4K×1), 8 chips, 4 KB | [1976] NMOS DRAM (Mostek MK4116) — 16-pin DIP, 16 Kbit (16K×1), 8 chips, 16 KB | [1981] NMOS Page-Mode DRAM (4164) — 16-pin DIP, 64 Kbit (64K×1), 8 chips, 64 KB | [1984] NMOS/CMOS Page-Mode (41256) — 16-pin DIP, 256 Kbit (256K×1), 8 chips, 256 KB | [1985] Early 30-pin SIMM — 256 Kbit (256K×1), 8 chips, 256 KB | [1986] FPM DRAM — 30-pin SIMM, 1 Mbit (1M×1), 8 chips, 1 MB | [1990] FPM DRAM — 72-pin SIMM, 4 Mbit (1M×4), 8 chips, 4 MB |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Intel 8080** | ✓ | ✓ | ✓ | — | — | — | — | — |
| **Intel 8085** | — | ✓ | ✓ | ✓ | — | — | — | — |
| **Zilog Z80** | — | ✓ | ✓ | ✓ | ✓ | — | — | — |
| **Hitachi HD64180 / Zilog Z180** | — | — | — | ✓ | ✓ | ✓ | ✓ | — |
| **Zilog Z280** | — | — | — | — | ✓ | ✓ | ✓ | ✓ |
| **Sharp LR35902 (Game Boy)** | — | — | — | — | — | — | — | — |
| **ASCII R800 (MSX turbo R)** | — | — | — | — | ✓ | ✓ | ✓ | ✓ |
| **Zilog Z380** | — | — | — | — | — | ✓ | ✓ | ✓ |
| **Rabbit 2000** | — | — | — | — | — | — | — | — |
| **Zilog eZ80** | — | — | — | — | — | — | — | — |

---

### 2. MOS 6502 (1975)

| CPU | [1974] NMOS DRAM (Mostek MK4096) — 16-pin DIP, 4 Kbit (4K×1), 8 chips, 4 KB | [1976] NMOS DRAM (Mostek MK4116) — 16-pin DIP, 16 Kbit (16K×1), 8 chips, 16 KB | [1981] NMOS Page-Mode DRAM (4164) — 16-pin DIP, 64 Kbit (64K×1), 8 chips, 64 KB | [1984] NMOS/CMOS Page-Mode (41256) — 16-pin DIP, 256 Kbit (256K×1), 8 chips, 256 KB | [1986] FPM DRAM — 30-pin SIMM, 1 Mbit (1M×1), 8 chips, 1 MB |
| --- | --- | --- | --- | --- | --- |
| **MOS Technology 6502** | ✓ | ✓ | ✓ | — | — |
| **WDC W65C02S (CMOS)** | — | — | ✓ | ✓ | ✓ |
| **MOS Technology 6510 (C64)** | — | — | ✓ | — | — |
| **Ricoh 2A03 (NES)** | — | — | — | — | — |
| **WDC W65C816S (16-bit)** | — | — | ✓ | ✓ | ✓ |
| **MOS Technology 8502 (C128)** | — | — | ✓ | — | — |
| **Hudson Soft HuC6280 (PC Engine)** | — | — | — | — | — |
| **CSG 65CE02 (Amiga serial / C65)** | — | — | — | ✓ | ✓ |
| **Ricoh 5A22 (SNES, W65C816 core)** | — | — | — | — | — |
| **Mitsubishi M37700 (16-bit 6502 deriv.)** | — | — | — | — | — |

---

### 3. DEC VAX (1977)

| CPU / System | [1974] NMOS DRAM (Mostek MK4096) — 16-pin DIP, 4 Kbit (4K×1), 8 chips, 4 KB | [1976] NMOS DRAM (Mostek MK4116) — 16-pin DIP, 16 Kbit (16K×1), 8 chips, 16 KB | [1981] NMOS Page-Mode DRAM (4164 w/ parity) — 16-pin DIP, 64 Kbit (64K×1), 9 chips, 64 KB (72 KB raw) | [1984] NMOS/CMOS Page-Mode (41256 w/ parity) — 16-pin DIP, 256 Kbit (256K×1), 9 chips, 256 KB (288 KB raw) | [1986] FPM DRAM (parity) — 30-pin SIMM, 1 Mbit (1M×1), 9 chips, 1 MB | [1990] FPM DRAM (parity) — 72-pin SIMM, 4 Mbit (1M×4), 12 chips, 4 MB | [1992] FPM DRAM (parity) — 72-pin SIMM, 16 Mbit (4M×4), 12 chips, 16 MB |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **VAX-11/780 (discrete TTL)** | ✓ | ✓ | — | — | — | — | — |
| **VAX-11/750 (gate array)** | — | ✓ | ✓ | — | — | — | — |
| **VAX 8600 (ECL)** | — | — | ✓ | ✓ | — | — | — |
| **MicroVAX 78032 (MicroVAX II)** | — | — | ✓ | ✓ | — | — | — |
| **VAX 8800 (Nautilus, dual-CPU)** | — | — | — | ✓ | ✓ | — | — |
| **CVAX 78034** | — | — | — | ✓ | ✓ | — | — |
| **Rigel** | — | — | — | — | ✓ | ✓ | — |
| **VAX 9000 (Aquarius, ECL)** | — | — | — | ✓ | ✓ | ✓ | — |
| **Mariah** | — | — | — | — | ✓ | ✓ | ✓ |
| **NVAX** | — | — | — | — | ✓ | ✓ | ✓ |

---

### 4. x86 (1978)

| CPU | [1976] NMOS DRAM (MK4116) — 16-pin DIP, 16 Kbit (16K×1), 8 chips, 16 KB | [1981] NMOS Page-Mode (4164 w/ parity) — 16-pin DIP, 64 Kbit, 9 chips, 64 KB (72 KB raw) | [1984] NMOS/CMOS Page-Mode (41256 w/ parity) — 16-pin DIP, 256 Kbit, 9 chips, 256 KB (288 KB raw) | [1985] Early 30-pin SIMM — 256 Kbit (256K×1), 8 chips, 256 KB | [1986] FPM DRAM (parity) — 30-pin SIMM, 1 Mbit (1M×1), 9 chips, 1 MB | [1987] FPM DRAM (parity) — 30-pin SIMM, 4 Mbit (1M×4), 9 chips, 4 MB | [1995] EDO DRAM (parity) — 72-pin SIMM, 4 Mbit (1M×4), 12 chips, 4 MB | [1996] EDO DRAM (ECC) — 168-pin DIMM, 16 Mbit (4M×4), 18 chips, 32 MB | [1996] PC66 SDRAM — 168-pin DIMM, 16 Mbit (2M×8), 8/16 chips, 16/32 MB | [1997] PC66 SDRAM — 168-pin DIMM, 64 Mbit (8M×8), 8/16 chips, 64/128 MB | [1998] PC100 SDRAM — 168-pin DIMM, 64 Mbit (8M×8), 8/16 chips, 64/128 MB | [1999] PC100 SDRAM — 168-pin DIMM, 128 Mbit (16M×8), 8/16 chips, 128/256 MB | [1999] PC133 SDRAM — 168-pin DIMM, 128 Mbit (16M×8), 8/16 chips, 128/256 MB | [2000] PC133 SDRAM (high-density) — 168-pin DIMM, 256 Mbit (32M×8), 16 chips, 512 MB | [2000] DDR-200 (PC-1600) — 184-pin DIMM, 128 Mbit, 8/16 chips, 128/256 MB | [2000] DDR-266 (PC-2100) — 184-pin DIMM, 128 Mbit, 8/16 chips, 128/256 MB | [2002] DDR-333 (PC-2700) — 184-pin DIMM, 256 Mbit, 8/16 chips, 256/512 MB | [2003] DDR-400 (PC-3200) — 184-pin DIMM, 256/512 Mbit, 8/16 chips, 256 MB–1 GB | [2003] DDR2-400 (PC2-3200) — 240-pin DIMM, 256/512 Mbit, 8 chips, 256/512 MB | [2003] DDR2-533 (PC2-4200) — 240-pin DIMM, 256/512 Mbit, 8 chips, 256/512 MB | [2004] DDR2-667 (PC2-5300) — 240-pin DIMM, 512 Mbit, 8/16 chips, 512 MB/1 GB | [2006] DDR2-800 (PC2-6400) — 240-pin DIMM, 512 Mbit/1 Gbit, 8/16 chips, 512 MB–2 GB | [2007] DDR2-1066 (PC2-8500) — 240-pin DIMM, 1 Gbit, 8/16 chips, 1/2 GB | [2007] DDR3-800 (PC3-6400) — 240-pin DIMM, 1 Gbit, 8 chips, 1 GB | [2007] DDR3-1066 (PC3-8500) — 240-pin DIMM, 1 Gbit, 8 chips, 1 GB | [2007] DDR3-1333 (PC3-10600) — 240-pin DIMM, 1 Gbit, 8/16 chips, 1/2 GB | [2008] DDR3-1600 (PC3-12800) — 240-pin DIMM, 2 Gbit, 8/16 chips, 2/4 GB | [2011] DDR3-1866 (PC3-14900) — 240-pin DIMM, 4 Gbit, 8/16 chips, 4/8 GB | [2012] DDR3-2133 (PC3-17000) — 240-pin DIMM, 4 Gbit, 8/16 chips, 4/8 GB | [2014] DDR4-1600 (PC4-12800) — 288-pin DIMM, 4 Gbit, 8/16 chips, 4/8 GB | [2014] DDR4-2133 (PC4-17000) — 288-pin DIMM, 4/8 Gbit, 8/16 chips, 4–16 GB | [2015] DDR4-2400 (PC4-19200) — 288-pin DIMM, 8 Gbit, 8/16 chips, 8/16 GB | [2016] DDR4-2666 (PC4-21300) — 288-pin DIMM, 8 Gbit, 8/16 chips, 8/16 GB | [2018] DDR4-2933 (PC4-23400) — 288-pin DIMM, 8/16 Gbit, 8/16 chips, 8/32 GB | [2019] DDR4-3200 (PC4-25600) — 288-pin DIMM, 8/16 Gbit, 4/8/16 chips, 4–32 GB | [2020] DDR5-4800 (PC5-38400) — 288-pin UDIMM, 16 Gbit, 4/8/16 chips, 8–32 GB | [2022] DDR5-5200 (PC5-41600) — 288-pin UDIMM, 16 Gbit, 8/16 chips, 16/32 GB | [2022] DDR5-5600 (PC5-44800) — 288-pin UDIMM, 16 Gbit, 8/16 chips, 16/32 GB | [2023] DDR5-6000 — 288-pin UDIMM, 16/24 Gbit, 8/16 chips, 16–48 GB | [2024] DDR5-6400 (PC5-51200) — 288-pin UDIMM, 16/24/32 Gbit, 8/16 chips, 16–64 GB | [2024] DDR5-6400 CUDIMM — 288-pin CUDIMM, 16/24/32 Gbit, +1 CKD, 16–64 GB | [2024] DDR5-7200 CUDIMM — 288-pin CUDIMM, 16/24 Gbit, 8 chips + 1 CKD, 16/24 GB | [2024] DDR5-8000 CUDIMM — 288-pin CUDIMM, 24 Gbit, 8 chips + 1 CKD, 24 GB | [2024] DDR5-8200 CUDIMM — 288-pin CUDIMM, 24 Gbit, 8 chips + 1 CKD, 24 GB | [2024] DDR5-8400 CUDIMM — 288-pin CUDIMM, 24 Gbit, 8 chips + 1 CKD, 24 GB | [2024] DDR5-8800 CUDIMM — 288-pin CUDIMM, 24 Gbit, 8 chips + 1 CKD, 24 GB | [2025] DDR5-9200 CUDIMM (OC) — 288-pin CUDIMM, 24 Gbit, 8 chips + 1 CKD, 24 GB | [2026] DDR5-7200 CUDIMM — 288-pin CUDIMM, 24 Gbit, 16 chips + 1 CKD, 48 GB | [2026] DDR5-8000 CUDIMM — 288-pin CUDIMM, 32 Gbit, 16 chips + 1 CKD, 64 GB |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Intel 8086** | ✓ | ✓ | ✓ | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| **Intel 80286** | — | ✓ | ✓ | ✓ | ✓ | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| **Intel 80386DX** | — | — | ✓ | ✓ | ✓ | ✓ | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| **Intel 80486DX** | — | — | — | ✓ | ✓ | ✓ | ✓ | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| **Intel Pentium (P5)** | — | — | — | — | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| **Intel Pentium Pro (P6)** | — | — | — | — | — | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| **AMD Athlon (K7)** | — | — | — | — | — | — | — | — | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| **AMD Opteron / Athlon 64 (K8, x86-64)** | — | — | — | — | — | — | — | — | — | — | — | — | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| **Intel Core i7-2600K (Sandy Bridge)** | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| **AMD Ryzen 9 9950X (Zen 5)** | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

---

### 5. Motorola 68000 / m68k (1979)

| CPU | [1981] NMOS Page-Mode DRAM (4164) — 16-pin DIP, 64 Kbit (64K×1), 8 chips, 64 KB | [1984] NMOS/CMOS Page-Mode (41256) — 16-pin DIP, 256 Kbit (256K×1), 8 chips, 256 KB | [1985] Early 30-pin SIMM — 256 Kbit (256K×1), 8 chips, 256 KB | [1986] FPM DRAM — 30-pin SIMM, 1 Mbit (1M×1), 8 chips, 1 MB | [1990] FPM DRAM — 72-pin SIMM, 4 Mbit (1M×4), 8 chips, 4 MB | [1995] EDO DRAM — 72-pin SIMM, 4 Mbit (1M×4), 8 chips, 4 MB | [1996] PC66 SDRAM — 168-pin DIMM, 16 Mbit (2M×8), 8 chips, 16 MB |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **Motorola 68000** | ✓ | ✓ | ✓ | ✓ | — | — | — |
| **Motorola 68010** | ✓ | ✓ | ✓ | ✓ | — | — | — |
| **Motorola 68020 (full 32-bit)** | — | ✓ | ✓ | ✓ | ✓ | — | — |
| **Motorola 68030 (on-chip MMU)** | — | — | ✓ | ✓ | ✓ | — | — |
| **Motorola 68040 (on-chip FPU)** | — | — | — | ✓ | ✓ | ✓ | — |
| **Motorola 68332 (CPU32 embedded)** | — | ✓ | — | ✓ | — | — | — |
| **Motorola 68060 (superscalar)** | — | — | — | ✓ | ✓ | ✓ | — |
| **Motorola ColdFire MCF5200** | — | — | — | ✓ | ✓ | ✓ | ✓ |
| **Motorola ColdFire MCF5407 (v4)** | — | — | — | — | — | — | ✓ |
| **Freescale ColdFire MCF5485 (v4e)** | — | — | — | — | — | — | ✓ |

---

### 6. ARM (1985)

| CPU | [1986] FPM DRAM — 30-pin SIMM, 1 Mbit (1M×1), 8 chips, 1 MB | [1990] FPM DRAM — 72-pin SIMM, 4 Mbit (1M×4), 8 chips, 4 MB | [1995] EDO DRAM — 72-pin SIMM, 4 Mbit (1M×4), 8 chips, 4 MB | [1996] PC66 SDRAM — 168-pin DIMM, 16 Mbit (2M×8), 8 chips, 16 MB | [1998] PC100 SDRAM — 168-pin DIMM, 64 Mbit (8M×8), 8 chips, 64 MB | [1999] PC133 SDRAM — 168-pin DIMM, 128 Mbit (16M×8), 8 chips, 128 MB | [2000] DDR-200 (PC-1600) — 184-pin DIMM, 128 Mbit (16M×8), 8 chips, 128 MB | [2003] DDR2-400 (PC2-3200) — 240-pin DIMM, 256 Mbit (32M×8), 8 chips, 256 MB | [2006] DDR2-800 (PC2-6400) — 240-pin DIMM, 512 Mbit (64M×8), 8 chips, 512 MB | [2007] DDR3-800 (PC3-6400) — 240-pin DIMM, 1 Gbit (128M×8), 8 chips, 1 GB | [2010] DDR3-1600 (PC3-12800) — 240-pin DIMM, 4 Gbit (512M×8), 8 chips, 4 GB | [2019] DDR4-3200 (PC4-25600) — 288-pin DIMM, 8 Gbit (1G×8), 8 chips, 8 GB | [2024] DDR5-6400 (PC5-51200) — 288-pin UDIMM, 16 Gbit (2G×8), 8 chips, 16 GB |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Acorn ARM1** | ✓ | — | — | — | — | — | — | — | — | — | — | — | — |
| **Acorn ARM2** | ✓ | ✓ | — | — | — | — | — | — | — | — | — | — | — |
| **ARM6 (ARM610 in Apple Newton)** | — | ✓ | ✓ | — | — | — | — | — | — | — | — | — | — |
| **ARM7TDMI (Game Boy Advance, phones)** | — | — | ✓ | ✓ | — | — | — | — | — | — | — | — | — |
| **DEC StrongARM SA-110** | — | — | ✓ | ✓ | ✓ | — | — | — | — | — | — | — | — |
| **ARM11 (ARM1176JZF-S, original iPhone/RPi 1)** | — | — | — | — | — | ✓ | ✓ | ✓ | — | — | — | — | — |
| **ARM Cortex-A8 (ARMv7-A)** | — | — | — | — | — | — | — | — | ✓ | ✓ | — | — | — |
| **Apple A7 (Cyclone, first 64-bit ARMv8)** | — | — | — | — | — | — | — | — | — | — | ✓ | — | — |
| **Apple M1 (Firestorm + Icestorm)** | — | — | — | — | — | — | — | — | — | — | — | ✓ | — |
| **Qualcomm Snapdragon 8 Elite (Oryon)** | — | — | — | — | — | — | — | — | — | — | — | — | ✓ |

---

### 7. MIPS (1985)

| CPU | [1986] FPM DRAM — 30-pin SIMM, 1 Mbit (1M×1), 8 chips, 1 MB | [1990] FPM DRAM — 72-pin SIMM, 4 Mbit (1M×4), 8 chips, 4 MB | [1995] EDO DRAM — 72-pin SIMM, 4 Mbit (1M×4), 8 chips, 4 MB | [1996] PC66 SDRAM — 168-pin DIMM, 16 Mbit (2M×8), 8 chips, 16 MB | [1998] PC100 SDRAM — 168-pin DIMM, 64 Mbit (8M×8), 8/16 chips, 64/128 MB | [1999] PC133 SDRAM — 168-pin DIMM, 128 Mbit (16M×8), 8/16 chips, 128/256 MB | [2004] DDR2-667 (PC2-5300) — 240-pin DIMM, 512 Mbit, 8/16 chips, 512 MB/1 GB | [2007] DDR2-1066 (PC2-8500) — 240-pin DIMM, 1 Gbit, 8/16 chips, 1/2 GB | [2012] DDR3-2133 (PC3-17000) — 240-pin DIMM, 4 Gbit, 8/16 chips, 4/8 GB | [2016] DDR4-2666 (PC4-21300) — 288-pin DIMM, 8 Gbit, 8/16 chips, 8/16 GB |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **MIPS R2000 (MIPS I)** | ✓ | ✓ | — | — | — | — | — | — | — | — |
| **MIPS R3000 (PS1 at 33.9 MHz)** | — | ✓ | ✓ | — | — | — | — | — | — | — |
| **MIPS R4000 (first 64-bit MIPS III)** | — | ✓ | ✓ | ✓ | — | — | — | — | — | — |
| **MIPS R4300i (Nintendo 64)** | — | — | — | — | — | — | — | — | — | — |
| **MIPS R10000 (out-of-order MIPS IV)** | — | — | ✓ | ✓ | ✓ | — | — | — | — | — |
| **Sony/Toshiba Emotion Engine (PS2)** | — | — | — | — | — | — | — | — | — | — |
| **Broadcom BCM1250 (SiByte)** | — | — | — | — | — | ✓ | ✓ | — | — | — |
| **Cavium Octeon CN5860 (networking)** | — | — | — | — | — | — | ✓ | ✓ | — | — |
| **Loongson 3B1500 (MIPS64-compatible)** | — | — | — | — | — | — | — | — | ✓ | — |
| **Cavium Octeon TX / MIPS I6500** | — | — | — | — | — | — | — | — | ✓ | ✓ |

---

### 8. SPARC (1987)

| CPU | [1987] FPM DRAM (parity) — 30-pin SIMM, 4 Mbit (1M×4), 9 chips, 4 MB | [1992] FPM DRAM (parity) — 72-pin SIMM, 16 Mbit (4M×4), 12 chips, 16 MB | [1995] EDO DRAM (parity) — 72-pin SIMM, 4 Mbit (1M×4), 12 chips, 4 MB | [1996] EDO DRAM (ECC) — 168-pin DIMM, 16 Mbit (4M×4), 18 chips, 32 MB | [1998] PC100 SDRAM — 168-pin DIMM, 64 Mbit (8M×8), 16 chips, 128 MB | [1999] PC133 SDRAM — 168-pin DIMM, 128 Mbit (16M×8), 16 chips, 256 MB | [2003] DDR-400 (PC-3200) — 184-pin DIMM, 512 Mbit (64M×8), 16 chips, 1 GB | [2005] DDR2-667 (PC2-5300) — 240-pin DIMM, 1 Gbit (128M×8), 16 chips, 2 GB | [2007] DDR2-1066 (PC2-8500) — 240-pin DIMM, 1 Gbit (128M×8), 16 chips, 2 GB | [2010] DDR3-1600 (PC3-12800) — 240-pin DIMM, 4 Gbit (512M×8), 16 chips, 8 GB | [2015] DDR4-2400 (PC4-19200) — 288-pin DIMM, 8 Gbit (1G×8), 16 chips, 16 GB | [2017] DDR4-2666 (PC4-21300) — 288-pin DIMM, 8 Gbit (1G×8), 16 chips, 16 GB |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Fujitsu MB86900 (SPARC V7)** | ✓ | — | — | — | — | — | — | — | — | — | — | — |
| **Sun/TI SuperSPARC (SPARC V8)** | ✓ | ✓ | ✓ | — | — | — | — | — | — | — | — | — |
| **Sun UltraSPARC I (first 64-bit SPARC V9)** | — | ✓ | ✓ | ✓ | — | — | — | — | — | — | — | — |
| **Sun UltraSPARC II** | — | — | — | ✓ | ✓ | ✓ | — | — | — | — | — | — |
| **Sun UltraSPARC III** | — | — | — | — | — | ✓ | ✓ | — | — | — | — | — |
| **Sun UltraSPARC T1 (Niagara)** | — | — | — | — | — | — | ✓ | ✓ | — | — | — | — |
| **Sun UltraSPARC T2 (Niagara 2)** | — | — | — | — | — | — | — | ✓ | ✓ | — | — | — |
| **Fujitsu SPARC64 VIIIfx (K computer)** | — | — | — | — | — | — | — | — | ✓ | ✓ | — | — |
| **Oracle SPARC M7** | — | — | — | — | — | — | — | — | — | ✓ | ✓ | — |
| **Oracle SPARC M8** | — | — | — | — | — | — | — | — | — | — | ✓ | ✓ |

---

### 9. POWER / PowerPC / Power ISA (1990)

| CPU | [1990] FPM DRAM — 72-pin SIMM, 4 Mbit (1M×4), 8 chips, 4 MB | [1992] FPM DRAM — 72-pin SIMM, 16 Mbit (4M×4), 8 chips, 16 MB | [1995] EDO DRAM — 72-pin SIMM, 16 Mbit (4M×4), 8 chips, 16 MB | [1996] PC66 SDRAM — 168-pin DIMM, 16 Mbit (2M×8), 8/16 chips, 16/32 MB | [1998] PC100 SDRAM — 168-pin DIMM, 64 Mbit (8M×8), 8/16 chips, 64/128 MB | [1999] PC133 SDRAM — 168-pin DIMM, 128 Mbit (16M×8), 8/16 chips, 128/256 MB | [2000] DDR-266 (PC-2100) — 184-pin DIMM, 128 Mbit (16M×8), 8/16 chips, 128/256 MB | [2003] DDR-400 (PC-3200) — 184-pin DIMM, 256/512 Mbit, 8/16 chips, 256 MB–1 GB | [2004] DDR2-667 (PC2-5300) — 240-pin DIMM, 512 Mbit, 8/16 chips, 512 MB/1 GB | [2006] DDR2-800 (PC2-6400) — 240-pin DIMM, 512 Mbit/1 Gbit, 8/16 chips, 512 MB–2 GB | [2018] DDR4-2666 (PC4-21300) — 288-pin DIMM, 16 Gbit (2G×8), 8/16 chips, 16/32 GB | [2019] DDR4-3200 (PC4-25600) — 288-pin DIMM, 16 Gbit (2G×8), 8/16 chips, 16/32 GB | [2020] DDR5-4800 (PC5-38400) — 288-pin UDIMM, 16 Gbit (2G×8), 8/16 chips, 16/32 GB |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **IBM POWER1 (multi-chip RIOS-1)** | ✓ | — | — | — | — | — | — | — | — | — | — | — | — |
| **PowerPC 601 (first single-chip PowerPC)** | ✓ | ✓ | ✓ | — | — | — | — | — | — | — | — | — | — |
| **PowerPC 604** | — | ✓ | ✓ | ✓ | — | — | — | — | — | — | — | — | — |
| **PowerPC 750 (G3, also Wii/GameCube)** | — | — | ✓ | ✓ | ✓ | ✓ | — | — | — | — | — | — | — |
| **Motorola PowerPC 7400 (G4, AltiVec)** | — | — | — | — | ✓ | ✓ | ✓ | — | — | — | — | — | — |
| **IBM POWER4 (first dual-core server chip)** | — | — | — | — | — | — | ✓ | ✓ | — | — | — | — | — |
| **IBM PowerPC 970 (G5)** | — | — | — | — | — | — | — | ✓ | ✓ | — | — | — | — |
| **IBM Xenon (Xbox 360) / Cell PPE (PS3)** | — | — | — | — | — | — | — | — | ✓ | ✓ | — | — | — |
| **IBM POWER9** | — | — | — | — | — | — | — | — | — | — | ✓ | ✓ | — |
| **IBM Power10** | — | — | — | — | — | — | — | — | — | — | — | ✓ | ✓ |

---

### 10. DEC Alpha (1992)

| CPU | [1992] FPM DRAM — 72-pin SIMM, 16 Mbit (4M×4), 8 chips, 16 MB | [1994] FPM DRAM (double-sided) — 72-pin SIMM, 16 Mbit (4M×4), 16 chips, 32 MB | [1995] EDO DRAM — 72-pin SIMM, 16 Mbit (4M×4), 8 chips, 16 MB | [1996] EDO DRAM — 168-pin DIMM, 16 Mbit (4M×4), 16 chips, 32 MB | [1998] PC100 SDRAM — 168-pin DIMM, 64 Mbit (8M×8), 8/16 chips, 64/128 MB | [1999] PC133 SDRAM — 168-pin DIMM, 128 Mbit (16M×8), 8/16 chips, 128/256 MB | [1999] PC800 RDRAM — 184-pin RIMM, 128 Mbit, 8/16 chips, 128/256 MB | [2000] DDR-266 (PC-2100) — 184-pin DIMM, 128 Mbit (16M×8), 8/16 chips, 128/256 MB | [2003] DDR-400 (PC-3200) — 184-pin DIMM, 256/512 Mbit, 8/16 chips, 256 MB–1 GB |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Alpha 21064 (EV4)** | ✓ | — | — | — | — | — | — | — | — |
| **Alpha 21066 (LCA4, integrated PCI)** | ✓ | ✓ | ✓ | — | — | — | — | — | — |
| **Alpha 21064A (EV45)** | ✓ | ✓ | ✓ | — | — | — | — | — | — |
| **Alpha 21164 (EV5, quad-issue)** | — | ✓ | ✓ | ✓ | ✓ | — | — | — | — |
| **Alpha 21164A (EV56)** | — | — | — | ✓ | ✓ | ✓ | — | — | — |
| **Alpha 21164PC (PCA56, MVI SIMD)** | — | — | — | ✓ | ✓ | ✓ | — | — | — |
| **Alpha 21264 (EV6, out-of-order)** | — | — | — | — | ✓ | ✓ | — | ✓ | — |
| **Alpha 21264A (EV67)** | — | — | — | — | — | ✓ | — | ✓ | — |
| **Alpha 21264B / C (EV68CB)** | — | — | — | — | — | ✓ | — | ✓ | ✓ |
| **Alpha 21364 (EV7, integrated RDRAM/router)** | — | — | — | — | — | — | ✓ | — | — |

---

### 11. INMOS Transputer (1985)

| CPU | [1981] NMOS Page-Mode DRAM (4164) — 16-pin DIP, 64 Kbit (64K×1), 8 chips, 64 KB | [1984] NMOS/CMOS Page-Mode (41256) — 16-pin DIP, 256 Kbit (256K×1), 8 chips, 256 KB | [1985] Early 30-pin SIMM — 256 Kbit (256K×1), 8 chips, 256 KB | [1986] FPM DRAM — 30-pin SIMM, 1 Mbit (256K×4), 2 chips, 256 KB | [1986] FPM DRAM — 30-pin SIMM, 1 Mbit (1M×1), 8 chips, 1 MB |
| --- | --- | --- | --- | --- | --- |
| **INMOS T414 (32-bit, 2 KB SRAM)** | ✓ | ✓ | ✓ | ✓ | ✓ |
| **INMOS T212 (16-bit, 2 KB SRAM)** | ✓ | ✓ | — | — | — |
| **INMOS M212 (16-bit + disk controller)** | ✓ | ✓ | — | — | — |
| **INMOS T800 (32-bit + 64-bit FPU)** | ✓ | ✓ | ✓ | ✓ | ✓ |
| **INMOS T222 (16-bit, 4 KB SRAM)** | — | ✓ | — | — | — |
| **INMOS T425 (32-bit, 4 KB SRAM)** | — | ✓ | ✓ | ✓ | ✓ |
| **INMOS T801 (separate addr/data buses)** | — | ✓ | ✓ | ✓ | ✓ |
| **INMOS T225 (16-bit + debug extensions)** | — | ✓ | — | — | — |
| **INMOS T400 (low-cost 2-link embedded)** | — | ✓ | ✓ | ✓ | ✓ |
| **INMOS T805 (32-bit + FPU + debug ext.)** | — | ✓ | ✓ | ✓ | ✓ |

---

### 12. Intel / HP Itanium / IA-64 (2001)

| CPU | [1999] PC133 SDRAM — 168-pin DIMM, 128 Mbit (16M×8), 16 chips, 256 MB | [2001] DDR-266 (PC-2100) — 184-pin DIMM, 256 Mbit (32M×8), 16 chips, 512 MB | [2003] DDR-400 (PC-3200) — 184-pin DIMM, 512 Mbit (64M×8), 16 chips, 1 GB | [2006] DDR2-800 (PC2-6400) — 240-pin DIMM, 1 Gbit (128M×8), 16 chips, 2 GB | [2007] DDR2-1066 (PC2-8500) — 240-pin DIMM, 1 Gbit (128M×8), 16 chips, 2 GB | [2010] DDR3-1600 (PC3-12800) — 240-pin DIMM, 4 Gbit (512M×8), 16 chips, 8 GB | [2012] DDR3-2133 (PC3-17000) — 240-pin DIMM, 4 Gbit (512M×8), 16 chips, 8 GB |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **Itanium (Merced)** | ✓ | — | — | — | — | — | — |
| **Itanium 2 (McKinley)** | — | ✓ | — | — | — | — | — |
| **Itanium 2 (Madison / Deerfield LV)** | — | ✓ | ✓ | — | — | — | — |
| **HP mx2 (dual-Madison MCM)** | — | — | ✓ | — | — | — | — |
| **Itanium 2 (Madison 9M / Fanwood)** | — | — | ✓ | — | — | — | — |
| **Itanium 2 9000 (Montecito)** | — | — | ✓ | ✓ | — | — | — |
| **Itanium 9100 (Montvale)** | — | — | — | ✓ | ✓ | — | — |
| **Itanium 9300 (Tukwila, QPI interconnect)** | — | — | — | — | — | ✓ | — |
| **Itanium 9500 (Poulson, 12-wide issue)** | — | — | — | — | — | ✓ | ✓ |
| **Itanium 9700 (Kittson)** | — | — | — | — | — | — | ✓ |

---

### 13. Sun / Oracle SPARC "Niagara" Throughput Lineage (2005)

| CPU | [2003] DDR-400 (PC-3200) — 184-pin DIMM, 512 Mbit (64M×8), 16 chips, 1 GB | [2005] DDR2-667 (PC2-5300) — 240-pin DIMM, 1 Gbit (128M×8), 16 chips, 2 GB | [2007] DDR2-1066 (PC2-8500) — 240-pin DIMM, 1 Gbit (128M×8), 16 chips, 2 GB | [2010] DDR3-1600 (PC3-12800) — 240-pin DIMM, 4 Gbit (512M×8), 16 chips, 8 GB | [2011] DDR3-1866 (PC3-14900) — 240-pin DIMM, 4 Gbit (512M×8), 16 chips, 8 GB | [2012] DDR3-2133 (PC3-17000) — 240-pin DIMM, 4 Gbit (512M×8), 16 chips, 8 GB |
| --- | --- | --- | --- | --- | --- | --- |
| **Sun UltraSPARC T1 (Niagara)** | ✓ | ✓ | — | — | — | — |
| **Sun UltraSPARC T2 (Niagara 2)** | — | ✓ | ✓ | — | — | — |
| **Sun UltraSPARC T2 Plus (Victoria Falls, SMP)** | — | ✓ | ✓ | — | — | — |
| **Oracle SPARC T3 (Niagara 3 / Rainbow Falls)** | — | — | — | ✓ | — | — |
| **Oracle SPARC T4 (Yosemite Falls, OoO S3 core)** | — | — | — | ✓ | ✓ | — |
| **Oracle SPARC T5 (S3 core)** | — | — | — | — | ✓ | ✓ |
| **Oracle SPARC M5 (large-SMP S3 core)** | — | — | — | — | ✓ | ✓ |
| **Oracle SPARC M6 (large-SMP S3 core)** | — | — | — | — | ✓ | ✓ |

---

### 14. MCST Elbrus / E2K (2005)

| CPU | [2005] DDR2-667 (PC2-5300) — 240-pin DIMM, 1 Gbit (128M×8), 8/16 chips, 1/2 GB | [2008] DDR3-1333 (PC3-10600) — 240-pin DIMM, 2 Gbit (256M×8), 8/16 chips, 2/4 GB | [2010] DDR3-1600 (PC3-12800) — 240-pin DIMM, 4 Gbit (512M×8), 8/16 chips, 4/8 GB | [2012] DDR3-2133 (PC3-17000) — 240-pin DIMM, 4 Gbit (512M×8), 8/16 chips, 4/8 GB | [2016] DDR4-2666 (PC4-21300) — 288-pin DIMM, 8 Gbit (1G×8), 8/16 chips, 8/16 GB | [2019] DDR4-3200 (PC4-25600) — 288-pin DIMM, 8/16 Gbit, 8/16 chips, 8–32 GB |
| --- | --- | --- | --- | --- | --- | --- |
| **MCST Elbrus 2000 (E2K v1, 130 nm)** | ✓ | — | — | — | — | — |
| **MCST Elbrus-S (E2K v2, 90 nm)** | — | ✓ | — | — | — | — |
| **MCST Elbrus-2S+ (E2K v2 + 4 Elbrus DSPs)** | — | ✓ | — | — | — | — |
| **MCST Elbrus-2SM (E2K v2, 90 nm domestic fab)** | — | ✓ | — | — | — | — |
| **MCST Elbrus-4S (E2K v3, 65 nm)** | — | — | ✓ | — | — | — |
| **MCST Elbrus-1S+ (E2K v4 + integrated GPU)** | — | — | ✓ | — | — | — |
| **MCST Elbrus-8S (E2K v4, 28 nm)** | — | — | — | ✓ | — | — |
| **MCST Elbrus-8SV (E2K v5, 28 nm)** | — | — | — | — | ✓ | — |
| **MCST Elbrus-16S (E2K v6, 16 nm)** | — | — | — | — | — | ✓ |
