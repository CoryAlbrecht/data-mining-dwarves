import { readdirSync, readFileSync } from 'node:fs';
import { parse } from '@dotenvx/dotenvx';
import { describe, expect, it } from 'vitest';
import { assertKnownOverrides, DIG_CURVE, type DigCurve, digSeconds, envKeyPart, withOverrides } from '../packages/shared/src/index.ts';

const dir = new URL('../config/presets/', import.meta.url);
const preset = (name: string) => parse(readFileSync(new URL(name, dir), 'utf8'));
const digTimes = (curve: DigCurve) => [1, 2, 3].flatMap((d) => [1, 3, 5, 7, 9].map((r) => digSeconds(d, r, curve)));

describe('config/presets', () => {
  it.each(readdirSync(dir).filter((f) => f.endsWith('.env')))('%s names only real tunables', (name) => {
    expect(() => assertKnownOverrides(preset(name))).not.toThrow();
  });

  // A curve some other file in front might have set, so each preset has something to change.
  const otherCurve = withOverrides('DIG_CURVE', DIG_CURVE, {
    DMD_DIG_CURVE__BASE_SECONDS: '30',
    DMD_DIG_CURVE__ROCK_GROWTH: '1.6',
    DMD_DIG_CURVE__ROCK_BEND: '1',
    DMD_DIG_CURVE__DWARF_GROWTH: '1.5',
  });
  const env = (curve: DigCurve) =>
    Object.fromEntries(Object.entries(curve).map(([k, v]) => [`DMD_DIG_CURVE__${envKeyPart(k)}`, String(v)]));
  const withPreset = (name: string) => withOverrides('DIG_CURVE', DIG_CURVE, { ...env(otherCurve), ...preset(name) });

  it('dig-bent.env changes the dig times to the bent default curve', () => {
    expect(digTimes(withPreset('dig-bent.env'))).not.toEqual(digTimes(otherCurve));
    expect(digTimes(withPreset('dig-bent.env'))).toEqual(digTimes(DIG_CURVE));
  });

  it('dig-plain.env changes the dig times to the plain curve, rock size ∝ 3^(r−1)', () => {
    const plain = withPreset('dig-plain.env');
    expect(digTimes(plain)).not.toEqual(digTimes(otherCurve));
    expect(digTimes(plain)).not.toEqual(digTimes(DIG_CURVE));
    expect(digSeconds(1, 3, plain)).toBe(Math.ceil((120 * 3 ** 2) / 6)); // 180 s
  });
});
