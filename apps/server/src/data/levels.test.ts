import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { GENERATOR_VERSION } from '@dmd/shared';
import { generateLevel } from './levels.ts';

/**
 * Players cache Mines forever under a name that includes GENERATOR_VERSION. This fingerprint of
 * depths 1–200 catches any change to what a depth generates. If it fails on purpose: bump
 * GENERATOR_VERSION in packages/shared/src/layout.ts and record the new hash for the new version.
 */
const FINGERPRINTS: Record<number, string> = {
  4: '9fb6852c371acb59bb4aacd57b845d78444c8c84d4ddacfb66037239e0441c04',
  5: 'fa3209a10a0ec30a2df2a5b543e066575d1a6b05e8728d3238bac88e44e4f154',
  6: 'b52f3005970cf7d3604631338310369bcdeb4b260273482a7cd09591a829e0e1',
  7: '392b868bf3a54ef80ebb6625d73b1569be06111a306461e9396c22262537b45b',
};

describe('generateLevel', () => {
  it('is deterministic per depth', () => {
    expect(JSON.stringify(generateLevel(7))).toBe(JSON.stringify(generateLevel(7)));
  });

  it('spreads depth 1 over rock Levels 1–6, with the port and buried Devices at the top', () => {
    const mine = generateLevel(1);
    const counts = new Map<number, number>();
    for (const b of mine.blocks) if (b.kind === 'rock') counts.set(b.level, (counts.get(b.level) ?? 0) + 1);
    expect(Object.fromEntries([...counts].sort(([a], [b]) => a - b))).toEqual({ 1: 5, 2: 11, 3: 15, 4: 11, 5: 4, 6: 1 });
    expect(mine.exit.level).toBe(6);
    const buried = mine.devices.filter((d) => d.buried);
    expect(buried.length).toBeGreaterThan(0);
    for (const d of buried) expect(d.level).toBe(5);
  });

  it(`generates exactly what generator version ${GENERATOR_VERSION} generated`, () => {
    const hash = createHash('sha256');
    for (let depth = 1; depth <= 200; depth++) hash.update(JSON.stringify(generateLevel(depth)));
    expect(hash.digest('hex')).toBe(FINGERPRINTS[GENERATOR_VERSION]);
  });
});
