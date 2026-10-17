// @ts-check
import { defineConfig } from 'astro/config';

import mdx from '@astrojs/mdx';
import { serveDevTiles } from './src/lib/dev-tiles.ts';
import { SITE_URL } from './src/lib/site.ts';

// `astro dev` has no Worker or R2, so it serves the small test basemap (data/basemap.pmtiles) at the
// address that production serves from R2.
/** @type {import('astro').AstroIntegration} */
const devTiles = {
  name: 'dev-tiles',
  hooks: {
    'astro:server:setup': ({ server }) => {
      server.middlewares.use(serveDevTiles(new URL('./data/basemap.pmtiles', import.meta.url).pathname));
    },
  },
};

// https://astro.build/config
export default defineConfig({
  site: SITE_URL,
  integrations: [mdx(), devTiles],
  // Vite re-bundles MapLibre on every load in dev, which leaves the page with a stale copy and a blank map.
  vite: { optimizeDeps: { exclude: ['maplibre-gl'] } },
});
