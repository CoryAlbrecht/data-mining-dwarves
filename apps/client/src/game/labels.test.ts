import { describe, expect, it } from 'vitest';
import { NEW_PORT, type PortState } from '@dmd/shared';
import { bigLabel, deviceLabels, portLabels, smallLabel } from './labels.ts';

const port = (p: Partial<PortState> = {}): PortState => ({ ...NEW_PORT, ...p });

describe('deviceLabels', () => {
  it('puts the kind first, then one model word per cell', () => {
    expect(deviceLabels('storage:8-80-kb-floppy', 4)).toEqual(['DISK', '8″', '80kB', 'FD']);
  });

  it('joins the leftover words in the last cell with spaces, so the cell can wrap them', () => {
    expect(deviceLabels('storage:8-80-kb-floppy', 2)).toEqual(['DISK', '8″ 80kB FD']);
  });
});

describe('portLabels', () => {
  it('stacks in use/Port capacity over max Level in the second cell of a 2-wide port', () => {
    expect(portLabels(port(), 2)).toEqual([smallLabel('RS-232'), bigLabel('0/1', '≤L4')]);
  });

  it('gives Port capacity and max Level a big cell each on a 3-wide port', () => {
    expect(portLabels(port(), 3)).toEqual([smallLabel('RS-232'), bigLabel('0/1'), bigLabel('≤L4')]);
  });

  it('adds the speed, drawn small, on a 4-wide port', () => {
    expect(portLabels(port({ tech: 'net:gigabit', level: 3, passed: 2 }), 4)).toEqual([
      smallLabel('GbE'),
      smallLabel('1 Gbps'),
      bigLabel('2/2'),
      bigLabel('≤L9'),
    ]);
  });

  it('keeps Port capacity first on top when the count runs to two digits', () => {
    expect(portLabels(port({ level: 18, passed: 10 }), 2)[1]).toEqual(bigLabel('10/10', '≤L4'));
  });
});
