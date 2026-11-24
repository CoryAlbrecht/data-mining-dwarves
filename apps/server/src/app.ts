import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { leaderboard } from './routes/leaderboard.ts';
import { levels } from './routes/levels.ts';
import { store } from './routes/store.ts';

export const app = new Hono()
  .use(logger())
  .basePath('/api')
  .get('/health', (c) => c.json({ ok: true, status: 'All systems mining.' }))
  .route('/levels', levels)
  .route('/leaderboard', leaderboard)
  .route('/store', store);

export type AppType = typeof app;
