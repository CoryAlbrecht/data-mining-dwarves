import { Hono } from 'hono';
import { generateLevel } from '../data/levels.ts';

export const levels = new Hono().get('/:depth', (c) => {
  const depth = Number(c.req.param('depth'));
  if (!Number.isInteger(depth) || depth < 1 || depth > 10_000) {
    return c.json({ error: 'depth must be an integer from 1 to 10000' }, 400);
  }
  // Levels are deterministic per depth, so let browsers and the service worker cache hard.
  c.header('Cache-Control', 'public, max-age=86400, immutable');
  return c.json(generateLevel(depth));
});
