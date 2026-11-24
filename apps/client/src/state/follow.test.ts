import { describe, expect, it } from 'vitest';
import { scrollToReveal } from './follow.ts';

// The visible part of the page: below the sticky HUD (bottom at 200 px), above the window bottom (900 px).
const view = { top: 200, bottom: 900 };

describe('scrolling to keep the Selected dwarf in view', () => {
  it("doesn't move the page when the dwarf is already visible", () => {
    expect(scrollToReveal({ top: 400, bottom: 440 }, view)).toBe(0);
  });

  it('scrolls up when the dwarf went up into a Mine hidden above (or under the HUD)', () => {
    expect(scrollToReveal({ top: -300, bottom: -260 }, view)).toBe(-300 - 200 - 16);
    expect(scrollToReveal({ top: 180, bottom: 220 }, view)).toBe(180 - 200 - 16);
  });

  it('scrolls down when the dwarf went down into a Mine below the window', () => {
    expect(scrollToReveal({ top: 1200, bottom: 1240 }, view)).toBe(1240 - 900 + 16);
  });
});
