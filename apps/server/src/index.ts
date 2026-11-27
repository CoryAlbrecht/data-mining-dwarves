import { serve } from '@hono/node-server';
import { assertKnownOverrides } from '@dmd/shared';
import { app } from './app.ts';

// A DMD_* variable that names no tunable is a typo: stop rather than play the defaults silently.
assertKnownOverrides();

const port = Number(process.env.API_PORT ?? process.env.PORT ?? 8787);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`⛏  Data Mining Dwarves API listening on http://localhost:${info.port}/api`);
});
