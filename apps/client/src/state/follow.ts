/**
 * Keep the Selected dwarf on screen when it changes Mines (up through the port, or back down
 * through the Entry with a duplex chip). The page only scrolls if the dwarf would be hidden.
 */
import { effect } from '@preact/signals-react';
import { dwarves, selectedDwarf } from './world.ts';

/** Breathing room left between the dwarf and the edge it was scrolled to, in px. */
const MARGIN = 16;

interface Span {
  top: number;
  bottom: number;
}

/**
 * How far to scroll (px, negative = up) so `box` sits inside `view`, both in window coordinates.
 * `view.top` is the bottom of the sticky HUD. 0 when the box is already fully visible.
 */
export function scrollToReveal(box: Span, view: Span): number {
  if (box.top < view.top) return box.top - view.top - MARGIN;
  if (box.bottom > view.bottom) return box.bottom - view.bottom + MARGIN;
  return 0;
}

function reveal() {
  const el = document.querySelector('.dwarf-selected');
  if (!el) return;
  const hud = document.querySelector('.top')?.getBoundingClientRect().bottom ?? 0;
  const dy = scrollToReveal(el.getBoundingClientRect(), { top: hud, bottom: innerHeight });
  if (dy === 0) return;
  const smooth = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  scrollBy({ top: dy, behavior: smooth ? 'smooth' : 'auto' });
}

/** Watch the Selected dwarf and scroll when it lands in another Mine. Call once at startup. */
export function startFollowing() {
  let last: { id: number; depth: number } | null = null;
  effect(() => {
    const id = selectedDwarf.value;
    const d = id === null ? undefined : dwarves.value.find((x) => x.id === id);
    const changedMine = !!d && last?.id === d.id && last.depth !== d.depth;
    last = d ? { id: d.id, depth: d.depth } : null;
    // Wait for React to draw the dwarf in its new Mine before measuring.
    if (changedMine) requestAnimationFrame(() => requestAnimationFrame(reveal));
  });
}
