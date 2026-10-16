// @ts-check
import { defineConfig } from 'astro/config';

import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  integrations: [mdx()],
  // Vite re-bundles MapLibre on every load in dev, which leaves the page with a stale copy and a blank map.
  vite: { optimizeDeps: { exclude: ['maplibre-gl'] } },
});
