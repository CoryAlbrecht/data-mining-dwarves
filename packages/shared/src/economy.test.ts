import { describe, expect, it } from 'vitest';
import {
  chipsToUpgrade,
  DEVICE_MODELS,
  deviceRate,
  dwarfPrice,
  getDeviceModel,
} from './devices.ts';
import { chipName } from './chips.ts';
import { portCapacity } from './network.ts';

describe('economy', () => {
  it('needs more chips for each upgrade', () => {
    expect([1, 2, 3, 4, 5].map(chipsToUpgrade)).toEqual([2, 3, 5, 7, 11]);
  });

  it('makes higher device levels produce more', () => {
    const cpu = getDeviceModel('cpu:4004-cpu');
    expect(deviceRate(cpu, 2)).toBeGreaterThan(deviceRate(cpu, 1));
  });

  it('raises the price of each dwarf', () => {
    expect(dwarfPrice(1)).toBeGreaterThan(dwarfPrice(0));
  });

  it('lets floor(L/2)+1 dwarves through a port', () => {
    expect([1, 2, 3, 4].map(portCapacity)).toEqual([1, 2, 2, 3]);
  });

  it('has unique ids', () => {
    expect(new Set(DEVICE_MODELS.map((m) => m.id)).size).toBe(DEVICE_MODELS.length);
    expect(chipName('storage:8-80-kb-floppy')).toBe('8″ 80 kB Floppy chip');
  });
});
