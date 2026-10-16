// Unpacks data/basemap.pmtiles into public/tiles/{z}/{x}/{y}.mvt. Runs before dev and build.
import { unpackTiles } from '../src/lib/unpack-tiles.ts';

const source = new URL('../data/basemap.pmtiles', import.meta.url).pathname;
const out = new URL('../public/tiles', import.meta.url).pathname;
console.log(`Unpacked ${await unpackTiles(source, out)} tiles to public/tiles`);
