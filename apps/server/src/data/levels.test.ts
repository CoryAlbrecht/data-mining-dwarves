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
};

describe('generateLevel', () => {
  it('is deterministic per depth', () => {
    expect(JSON.stringify(generateLevel(7))).toBe(JSON.stringify(generateLevel(7)));
  });

  it(`generates exactly what generator version ${GENERATOR_VERSION} generated`, () => {
    const hash = createHash('sha256');
    for (let depth = 1; depth <= 200; depth++) hash.update(JSON.stringify(generateLevel(depth)));
    expect(hash.digest('hex')).toBe(FINGERPRINTS[GENERATOR_VERSION]);
  });
});
