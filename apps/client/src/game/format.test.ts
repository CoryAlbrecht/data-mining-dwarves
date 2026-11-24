import { describe, expect, it } from 'vitest';
import { formatBytes, formatDuration } from './format.ts';

describe('formatBytes', () => {
  it('uses 1024-based units', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(2.5)).toBe('2.5 B');
    expect(formatBytes(1023)).toBe('1023 B');
    expect(formatBytes(1536)).toBe('1.5 kB');
    expect(formatBytes(3 * 1024 * 1024)).toBe('3 MB');
  });
});

describe('formatDuration', () => {
  it('formats seconds, minutes, and hours', () => {
    expect(formatDuration(30)).toBe('30s');
    expect(formatDuration(60)).toBe('1m');
    expect(formatDuration(95)).toBe('1m 35s');
    expect(formatDuration(3960)).toBe('1h 6m');
  });
});
