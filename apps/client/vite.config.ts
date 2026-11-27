import babel from '@rolldown/plugin-babel';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { assertKnownOverrides, LEVELS_CACHE, overridesIn } from '@dmd/shared';

// Ports and cache dir can be moved, e.g. to run a second copy beside a developer's own `npm run dev`:
// CLIENT_PORT (default 5173), API_PORT (where /api is proxied, default 8787), VITE_CACHE_DIR.
const env = process.env;

// Tunable overrides (DMD_*, from the env files `npm run dev` loads; see packages/shared/src/tunables.ts).
// Loading @dmd/shared already threw on a malformed value; an unknown name stops startup here.
assertKnownOverrides(env);

export default defineConfig({
  // The client reads its overrides from this copy, written in once at startup: change a value,
  // restart `npm run dev`.
  define: { __DMD_ENV__: JSON.stringify(Object.fromEntries(overridesIn(env))) },
  ...(env.VITE_CACHE_DIR ? { cacheDir: env.VITE_CACHE_DIR } : {}),
  // The signals Babel transform injects `@preact/signals-react/runtime` imports that the dep scanner
  // can't see. Pre-bundle them up front, or Vite re-optimizes mid-load and the page can end up with
  // two copies of signals-core (components then never re-render, e.g. stuck on "No signal.").
  optimizeDeps: {
    include: ['@preact/signals-react', '@preact/signals-react/runtime', '@preact/signals-core'],
  },
  plugins: [
    react(),
    // Auto-tracks `signal.value` reads inside components, so they re-render on change
    // without useSignals() boilerplate or useState/useEffect plumbing.
    babel({
      plugins: [['module:@preact/signals-react-transform']],
      // Only our own TSX/TS needs the transform.
      include: /\/src\/.*\.[jt]sx?$/,
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon.svg'],
      manifest: {
        name: 'Data Mining Dwarves',
        short_name: 'DataDwarves',
        description: 'Dig through the data mines. Unearth better chips. Squash bugs.',
        theme_color: '#1b1a24',
        background_color: '#1b1a24',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            // Mines are deterministic per depth and generator version: cache forever so play works
            // offline. The name changes with the version (old ones are dropped by levelCache.ts).
            urlPattern: ({ url }) => url.pathname.startsWith('/api/levels/'),
            handler: 'CacheFirst',
            options: { cacheName: LEVELS_CACHE, expiration: { maxEntries: 200 } },
          },
          {
            // Fonts (incl. the Unifont chunks) download on demand; keep whatever was used.
            urlPattern: ({ url }) => /\.woff2?$/.test(url.pathname),
            handler: 'CacheFirst',
            options: { cacheName: 'dmd-fonts', expiration: { maxEntries: 120 } },
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkFirst',
            options: { cacheName: 'dmd-api', networkTimeoutSeconds: 4 },
          },
        ],
      },
    }),
  ],
  server: {
    port: Number(env.CLIENT_PORT ?? 5173),
    strictPort: !!env.CLIENT_PORT, // a requested port that's taken is an error, not a silent move
    proxy: { '/api': `http://localhost:${env.API_PORT ?? 8787}` },
  },
});
