import { Hono } from 'hono';
import type { LeaderboardEntry, LeaderboardSubmission } from '@dmd/shared';

// In-memory until we pick a database. Restarting the server wipes it.
const entries: LeaderboardEntry[] = [];

function isSubmission(x: unknown): x is LeaderboardSubmission {
  if (typeof x !== 'object' || x === null) return false;
  const s = x as Record<string, unknown>;
  return (
    typeof s.playerName === 'string' &&
    s.playerName.trim().length > 0 &&
    s.playerName.length <= 24 &&
    Number.isInteger(s.depth) &&
    (s.depth as number) >= 1 &&
    typeof s.bytesMined === 'number' &&
    Number.isFinite(s.bytesMined) &&
    s.bytesMined >= 0
  );
}

export const leaderboard = new Hono()
  .get('/', (c) => {
    const limit = Math.min(100, Math.max(1, Number(c.req.query('limit') ?? 20) || 20));
    const top = [...entries].sort((a, b) => b.depth - a.depth || b.bytesMined - a.bytesMined).slice(0, limit);
    return c.json(top);
  })
  .post('/', async (c) => {
    const body: unknown = await c.req.json().catch(() => null);
    if (!isSubmission(body)) return c.json({ error: 'invalid submission' }, 400);
    // TODO(anti-cheat): scores are client-reported. Validate against server-issued run tokens.
    const entry: LeaderboardEntry = {
      playerName: body.playerName.trim(),
      depth: body.depth,
      bytesMined: Math.floor(body.bytesMined),
      submittedAt: new Date().toISOString(),
    };
    entries.push(entry);
    return c.json(entry, 201);
  });
