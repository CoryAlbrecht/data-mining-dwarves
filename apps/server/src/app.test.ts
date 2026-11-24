import { describe, expect, it } from 'vitest';
import { CRON_CHIP, DUPLEX_CHIP, type LevelDef } from '@dmd/shared';
import { app } from './app.ts';

const mine = async (depth: number) => (await (await app.request(`/api/levels/${depth}`)).json()) as LevelDef;

describe('api', () => {
  it('serves deterministic levels', async () => {
    const a = (await (await app.request('/api/levels/3')).json()) as LevelDef;
    const b = (await (await app.request('/api/levels/3')).json()) as LevelDef;
    expect(a.blocks).toHaveLength(a.width * a.height);
    expect(a).toEqual(b);
  });

  it('rejects bad depths', async () => {
    expect((await app.request('/api/levels/0')).status).toBe(400);
    expect((await app.request('/api/levels/abc')).status).toBe(400);
  });

  it('records and ranks leaderboard entries', async () => {
    const post = (body: object) =>
      app.request('/api/leaderboard', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
    expect((await post({ playerName: 'Bytebeard', depth: 2, bytesMined: 10 })).status).toBe(201);
    expect((await post({ playerName: 'Bitburr', depth: 5, bytesMined: 3 })).status).toBe(201);
    expect((await post({ playerName: '', depth: 5, bytesMined: 3 })).status).toBe(400);
    const top = (await (await app.request('/api/leaderboard')).json()) as { playerName: string }[];
    expect(top[0]?.playerName).toBe('Bitburr');
  });
});

describe('mine layout', () => {

  it('keeps each port where it is when holes, rocks or loot are retuned, so saved Mines line up', async () => {
    // Recorded when the port got its own random stream (#6). Retuning must not move these.
    const before = [1,2,5,6,5,5,0,5,0,5,0,1,3,2,1,3,2,1,4,1,1,3,1,2,1,1,0,0,0,4,3,2,4,3,4,0,0,2,0,4];
    const now = await Promise.all(before.map(async (_, k) => (await mine(k + 1)).exit.x));
    expect(now).toEqual(before);
  });

  it('puts producing Devices on the sides, fork() uncovered in a bottom corner, and keeps rows clear', async () => {
    for (const depth of [1, 2, 4, 5, 13]) {
      const lvl = await mine(depth);
      const fork = lvl.devices.find((d) => d.model === 'fork')!;
      expect(fork).toMatchObject({ buried: false, w: 2, h: 2, y: lvl.height - 2 });
      expect(fork.x === 0 || fork.x === lvl.width - 2).toBe(true);
      for (const d of lvl.devices.filter((d) => d.model !== 'fork')) {
        expect(d.buried).toBe(true);
        expect(d.x === 0 || d.x + d.w === lvl.width).toBe(true); // flush to a side
        expect(d.y).toBeGreaterThanOrEqual(1); // top row clear
        expect(d.y + d.h).toBeLessThanOrEqual(lvl.height - 2); // bottom 2 rows clear
      }
      const kinds = lvl.devices.map((d) => d.model.split(':')[0]);
      expect(kinds).toEqual(expect.arrayContaining(['fork', 'cpu', 'dram', 'storage']));
    }
  });

  it('never overlaps Devices', async () => {
    for (const depth of [1, 3, 5, 13, 20]) {
      const lvl = await mine(depth);
      const owners = lvl.blocks.flatMap((b) => (b.kind === 'device' ? [b.device] : []));
      const cells = lvl.devices.reduce((a, d) => a + d.w * d.h, 0);
      expect(owners).toHaveLength(cells);
    }
  });

  it('empties the bottom row (apart from fork()) and has fewer holes near the top', async () => {
    let low = 0;
    let high = 0;
    for (let depth = 1; depth <= 12; depth++) {
      const lvl = await mine(depth);
      const row = (y: number) => lvl.blocks.slice(y * lvl.width, (y + 1) * lvl.width);
      expect(row(lvl.height - 1).every((b) => b.kind === 'empty' || b.kind === 'device')).toBe(true);
      low += row(lvl.height - 3).filter((b) => b.kind === 'empty').length;
      high += row(0).filter((b) => b.kind === 'empty').length;
    }
    expect(low).toBeGreaterThan(high);
  });

  it('puts easier rocks low and harder rocks high, and makes the port the hardest', async () => {
    const lvl = await mine(7);
    const rocks = lvl.blocks.flatMap((b, i) => (b.kind === 'rock' ? [{ level: b.level, y: Math.floor(i / lvl.width) }] : []));
    const avgY = (pred: (l: number) => boolean) => {
      const ys = rocks.filter((r) => pred(r.level)).map((r) => r.y);
      return ys.reduce((a, b) => a + b, 0) / ys.length;
    };
    const max = Math.max(...rocks.map((r) => r.level));
    const min = Math.min(...rocks.map((r) => r.level));
    expect(avgY((l) => l === max)).toBeLessThan(avgY((l) => l === min)); // smaller y = higher up
    expect(lvl.exit.level).toBe(max);
  });

  it('puts the Entry under no Device and sizes the port by computer', async () => {
    const one = await mine(1);
    const fork = one.devices.find((d) => d.model === 'fork')!;
    expect(one.entry < fork.x || one.entry >= fork.x + fork.w).toBe(true);
    expect(one.exit).toMatchObject({ kind: 'port', width: 2 });
    expect((await mine(4)).exit.kind).toBe('usb');
    expect((await mine(5)).exit.width).toBe(3);
  });
});

describe('bit-rock loot', () => {
  const chipLoot = (lvl: LevelDef) =>
    lvl.blocks.flatMap((b) => (b.kind === 'rock' && b.loot.kind === 'chip' ? [b.loot] : []));

  it('holds about 4 chips per producing Device in each Mine of the first two Computers', async () => {
    let chips = 0;
    let devices = 0;
    for (let depth = 1; depth <= 12; depth++) {
      const lvl = await mine(depth);
      const producing = new Set(lvl.devices.filter((d) => d.model !== 'fork').map((d) => d.model));
      chips += chipLoot(lvl).reduce((a, l) => a + (producing.has(l.chip) ? l.count : 0), 0);
      devices += producing.size;
    }
    expect(chips / devices).toBeGreaterThanOrEqual(3.5);
    expect(chips / devices).toBeLessThanOrEqual(4.5);
  });

  it('gives duplex and cron chips one at a time', async () => {
    const specials = [];
    for (let depth = 1; depth <= 30; depth++) {
      specials.push(...chipLoot(await mine(depth)).filter((l) => l.chip === DUPLEX_CHIP || l.chip === CRON_CHIP));
    }
    expect(specials.length).toBeGreaterThan(0);
    expect(specials.every((l) => l.count === 1)).toBe(true);
  });
});
