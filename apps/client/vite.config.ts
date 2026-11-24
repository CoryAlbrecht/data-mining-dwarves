import babel from '@rolldown/plugin-babel';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { LEVELS_CACHE } from '@dmd/shared';

export default defineConfig({
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
    proxy: { '/api': 'http://localhost:8787' },
  },
});
