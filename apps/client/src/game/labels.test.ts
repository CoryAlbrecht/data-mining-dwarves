import { describe, expect, it } from 'vitest';
import { NEW_PORT, type PortState } from '@dmd/shared';
import { labelCell, portLabels } from './labels.ts';

const port = (p: Partial<PortState> = {}): PortState => ({ ...NEW_PORT, ...p });

describe('portLabels', () => {
  it('stacks in use/Capacity over max Level in the second cell of a 2-wide port', () => {
    expect(portLabels(port(), 2)).toEqual([labelCell(false, 'RS-232'), labelCell(true, '0/1', '≤L4')]);
  });

  it('gives Capacity and max Level a big cell each on a 3-wide port', () => {
    expect(portLabels(port(), 3)).toEqual([labelCell(false, 'RS-232'), labelCell(true, '0/1'), labelCell(true, '≤L4')]);
  });

  it('adds the speed, drawn small, on a 4-wide port', () => {
    expect(portLabels(port({ tech: 'net:gigabit', level: 3, passed: 2 }), 4)).toEqual([
      labelCell(false, 'GbE'),
      labelCell(false, '1 Gbps'),
      labelCell(true, '2/2'),
      labelCell(true, '≤L9'),
    ]);
  });

  it('keeps Capacity first on top when the count runs to two digits', () => {
    expect(portLabels(port({ level: 18, passed: 10 }), 2)[1]).toEqual(labelCell(true, '10/10', '≤L4'));
  });
});
