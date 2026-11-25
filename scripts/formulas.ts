/**
 * Builds every computed table in docs/FORMULAS.md from the real game code.
 *
 *   npm run formulas          print all tables as Markdown, each under its id
 *
 * scripts/formulas.test.ts fails when a table here doesn't appear verbatim in FORMULAS.md, so after
 * retuning, run this and paste the changed tables into the doc.
 */
import { pathToFileURL } from 'node:url';
import {
  bufferCap,
  chipCount,
  chipsToUpgrade,
  CLOCK,
  computerLength,
  deviceRate,
  DIG_CURVE,
  digSeconds,
  dwarfPrice,
  ECONOMY,
  encryptedChipCount,
  firstDepthOf,
  hardwareFor,
  holeChance,
  ladder,
  LOOT,
  MINE_HEIGHT,
  MONSTER_BY_DEPTH,
  MONSTER_SPAWN,
  monsterFor,
  MONSTERS,
  NETWORK_TECHS,
  PART_PACE,
  placeOf,
  portCapacity,
  ROCK_CURVE,
  rockLevelCounts,
  rockMedian,
  rockSize,
  strikeDamage,
  byteLoot,
  type MonsterId,
  type ProducingKind,
} from '../packages/shared/src/index.ts';

export interface Table {
  id: string;
  markdown: string;
}

const fmt = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 2 });
const fmt3 = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 3 });
const pct = (x: number) => `${fmt(Math.round(x * 1000) / 10)}%`;
const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

function table(header: (string | number)[], rows: (string | number)[][]): string {
  const line = (cells: (string | number)[]) => `| ${cells.join(' | ')} |`;
  return [line(header), line(header.map(() => '---')), ...rows.map(line)].join('\n');
}

/** A table with one header row and one or more labelled value rows, columns along `xs`. */
function wide<T>(label: string, xs: T[], head: (x: T) => string | number, rows: [string, (x: T) => string | number][]) {
  return table([label, ...xs.map(head)], rows.map(([name, f]) => [name, ...xs.map(f)]));
}

const KINDS: ProducingKind[] = ['cpu', 'dram', 'storage', 'vram'];
const KIND_NAME: Record<ProducingKind, string> = { cpu: 'CPU', dram: 'DRAM', storage: 'Storage', vram: 'VRAM' };

export function tables(): Table[] {
  const t: Table[] = [];
  const add = (id: string, markdown: string) => t.push({ id, markdown });

  // ── 1. Digging ──
  add(
    'dig-curve',
    table(
      ['Constant', 'Value', 'Meaning'],
      [
        ['`baseRockSize`', `${DIG_CURVE.baseRockSize} B`, 'Size of a Level 1 bit-rock'],
        ['`baseSeconds`', `${DIG_CURVE.baseSeconds} s`, 'Time for an L1 dwarf to dig a Level 1 rock alone'],
        ['`rockGrowth`', DIG_CURVE.rockGrowth, 'Size multiplier per rock Level'],
        ['`dwarfGrowth`', DIG_CURVE.dwarfGrowth, 'Strike multiplier per dwarf Level'],
        ['`strikeSeconds`', `${DIG_CURVE.strikeSeconds} s`, 'Time between Strikes'],
      ],
    ),
  );
  add('rock-size', wide('r', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15], String, [['bytes', (r) => fmt(rockSize(r))]]));
  add('strike', wide('d', range(1, 9), String, [['B/Strike', (d) => fmt(strikeDamage(d))]]));
  add(
    'dig-grid',
    table(
      ['Dwarf \\ Rock', ...range(1, 10).map((r) => `L${r}`)],
      range(1, 8).map((d) => [`**L${d}**`, ...range(1, 10).map((r) => fmt(digSeconds(d, r)))]),
    ),
  );

  // ── 2. Dwarves ──
  let total = 0;
  const prices = range(0, 14).map((n) => {
    total += dwarfPrice(n);
    return { price: dwarfPrice(n), total };
  });
  add(
    'fork-price',
    wide('Dwarf #', range(1, 15), String, [
      ['Price', (k) => fmt(prices[k - 1]!.price)],
      ['Running total', (k) => fmt(prices[k - 1]!.total)],
    ]),
  );

  // ── 3. Computers ──
  add(
    'computer-length',
    wide('Computer', range(0, 4), (c) => `C${c + 1}`, [
      ['Mines', (c) => computerLength(c)],
      ['Depths', (c) => `${firstDepthOf(c)}–${firstDepthOf(c) + computerLength(c) - 1}`],
    ]),
  );

  // ── 4. Rock curve ──
  add(
    'rock-curve',
    table(
      ['Constant', 'Value', 'Meaning'],
      [
        ['`firstMedian`', ROCK_CURVE.firstMedian, 'Median of the very first Mine'],
        ['`perMine`', ROCK_CURVE.perMine, 'Rise per Mine within a Computer'],
        ['`handover`', ROCK_CURVE.handover, "A new Computer starts this far up the last one's first-to-last rise"],
      ],
    ),
  );
  const lastDepth = (c: number) => firstDepthOf(c) + computerLength(c) - 1;
  add(
    'medians',
    table(
      ['Computer', 'First Mine median', 'Last Mine median'],
      range(0, 3).map((c) => [
        `C${c + 1} (depths ${firstDepthOf(c)}–${lastDepth(c)})`,
        fmt3(rockMedian(firstDepthOf(c))),
        fmt3(rockMedian(lastDepth(c))),
      ]),
    ),
  );
  const spreads: [string, number][] = [
    ['1', 1],
    ['1.5', 1.5],
    ['2', 2],
    ...range(0, 2).map((c): [string, number] => [`${fmt3(rockMedian(lastDepth(c)))} (C${c + 1} last)`, rockMedian(lastDepth(c))]),
  ];
  add(
    'spreads',
    table(
      ['Median', 'Spread'],
      spreads.map(([label, m]) => [label, rockLevelCounts(60, m).map(([l, n]) => `${l}: ${n}`).join(', ')]),
    ),
  );

  // ── 5. Generation ──
  add(
    'holes',
    wide(
      'Row from bottom',
      range(0, MINE_HEIGHT - 1),
      (r) => (r === MINE_HEIGHT - 1 ? `${r} (top)` : String(r)),
      [['Hole chance', (r) => pct(holeChance(r))]],
    ),
  );
  // Runs of depths with the same Monster, found by asking monsterFor itself. The last run is open-ended.
  const scanTo = MONSTER_BY_DEPTH.length * MONSTER_SPAWN.depthsPerKind * 4;
  const runs: { id: MonsterId; from: number; to: number }[] = [];
  for (let d = 1; d <= scanTo; d++) {
    const id = monsterFor(d);
    const last = runs.at(-1);
    if (last?.id === id) last.to = d;
    else runs.push({ id, from: d, to: d });
  }
  add(
    'monsters',
    table(
      ['Depths', 'Monster', 'HP (taps)', 'Bounty'],
      runs.map(({ id, from, to }, k) => [
        k === runs.length - 1 ? `${from}+` : from === to ? String(from) : `${from}–${to}`,
        MONSTERS[id].name,
        MONSTERS[id].hp,
        `${fmt(MONSTERS[id].bounty)} B`,
      ]),
    ),
  );

  // ── 6. Loot ──
  const s = LOOT.share;
  add(
    'loot-share',
    table(
      ['Kind', 'Share', 'Then picks'],
      [
        ['bytes', pct(s.bytes), '`byteLoot` below'],
        ['device', pct(s.device), "One of this Mine's producing Devices, evenly"],
        ['fork', pct(s.fork), 'fork() chips'],
        [
          'network',
          pct(s.network),
          `This Mine's start technology or the next one (the next only from depth ${LOOT.nextTechFromDepth}), evenly`,
        ],
        [
          'other',
          pct(s.other),
          `A producing model not in this Mine, at most ${LOOT.otherTierWindow} tiers above this Mine's model of that kind (any tier if the Mine has none of that kind). Falls back to bytes if there are none.`,
        ],
        ['duplex', pct(s.duplex), '1 Duplex chip'],
        ['cron', pct(s.cron), '1 cron job'],
      ],
    ),
  );
  add('byte-loot', wide('Depth', [1, 2, 3, 4, 5, 8, 12, 16, 20, 28], String, [['Middle value', (d) => fmt(byteLoot(d, 0.5))]]));
  const bands = range(0, 4).map((k) => [k * 3 + 1, k * 3 + 3] as const);
  add(
    'chip-stacks',
    wide('Rock Level', bands, ([a, b]) => `${a}–${b}`, [
      ['Ordinary stack', ([a]) => `${chipCount(a, 1)} (${pct(LOOT.bonusChance)}: ${chipCount(a, 0)})`],
      ['Encrypted stack', ([a]) => encryptedChipCount(a)],
    ]),
  );

  // ── 7. Devices ──
  add(
    'kind-rates',
    table(
      ['Kind', '`kindRate` (B/s at tier 0, L1)', 'Ladder length'],
      [...KINDS.map((k) => [KIND_NAME[k], fmt(ladder(k)[0]!.baseRate), ladder(k).length]), ['fork()', "0 (doesn't produce)", 'n/a']],
    ),
  );
  add(
    'device-output',
    table(
      ['Model', 'Tier', 'L1 B/s', 'L5 B/s', 'L10 B/s', 'Buffer at L1'],
      KINDS.flatMap((k) =>
        [0, 3, 6].map((tier) => {
          const m = ladder(k)[tier]!;
          return [m.name, tier, ...[1, 5, 10].map((l) => fmt(deviceRate(m, l))), `${fmt(bufferCap(m, 1))} B`];
        }),
      ),
    ),
  );
  let chips = 0;
  const steps = range(1, 12).map((l) => {
    chips += chipsToUpgrade(l);
    return { to: l + 1, need: chipsToUpgrade(l), total: chips };
  });
  add(
    'upgrade-cost',
    wide('To Level', steps, (x) => x.to, [
      ['Chips', (x) => fmt(x.need)],
      ['Running total from L1', (x) => fmt(x.total)],
    ]),
  );
  add(
    'part-pace',
    table(
      ['Part (`PART_PACE`)', '`perLevel`', '`keep`'],
      (['dram', 'storage', 'vram'] as const).map((k) => [KIND_NAME[k], PART_PACE[k].perLevel, PART_PACE[k].keep]),
    ),
  );
  add(
    'hardware',
    table(
      ['Depth', 'Place', ...KINDS.map((k) => KIND_NAME[k])],
      [1, 3, 4, 5, 12, 13, 17, 24, 28].map((depth) => {
        const p = placeOf(depth);
        const models = hardwareFor(depth);
        return [
          depth,
          `C${p.computer + 1} #${p.index + 1}`,
          ...KINDS.map((k) => {
            const m = models.find((x) => x.kind === k);
            if (!m) return 'n/a';
            return m.tier === ladder(k).length - 1 ? `${m.name} (ladder end)` : m.name;
          }),
        ];
      }),
    ),
  );

  // ── 8. Network ──
  add('port-capacity', wide('Port Level', [1, 2, 3, 4, 5, 6, 8, 10], String, [['Capacity', portCapacity]]));
  add(
    'network-techs',
    table(
      ['#', 'Technology', 'Highest dwarf it carries', 'Speed label'],
      NETWORK_TECHS.map((tech, i) => [
        i,
        tech.name,
        `L${tech.maxDwarfLevel}`,
        tech.speeds.length > 1
          ? `${tech.speeds[0]} → ${tech.speeds.at(-1)} across Levels 1–${tech.speeds.length}`
          : tech.speeds[0]!,
      ]),
    ),
  );

  // ── 10. Time ──
  add(
    'time',
    table(
      ['What', 'Value', 'Source'],
      [
        ['Game tick', `${CLOCK.tickMs} ms`, '`CLOCK.tickMs` in `packages/shared/src/clock.ts`'],
        [
          'Catch-up per tick after a backgrounded tab',
          `at most ${CLOCK.maxCatchUpSeconds} s`,
          '`CLOCK.maxCatchUpSeconds` in `packages/shared/src/clock.ts`',
        ],
        [
          'Offline production credited on load',
          `at most ${CLOCK.maxOfflineSeconds / 3600} h`,
          '`CLOCK.maxOfflineSeconds` in `packages/shared/src/clock.ts`',
        ],
        ['Collect minimum', `${ECONOMY.minCollect} B`, '`ECONOMY.minCollect` in `packages/shared/src/devices.ts`'],
        ['Dev fast-forward', '`?speed=N` multiplies every tick', '`SPEED` in `apps/client/src/state/loop.ts`'],
      ],
    ),
  );

  return t;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  for (const { id, markdown } of tables()) console.log(`<!-- ${id} -->\n${markdown}\n`);
}
