// Builds public/data/countries.geojson from Natural Earth (public domain).
// Run with: npm run build:countries
import { writeFileSync } from 'node:fs';
import { trimCountries } from '../src/lib/countries-geojson.ts';

const SOURCE =
	'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson';

const response = await fetch(SOURCE);
if (!response.ok) throw new Error(`Failed to fetch ${SOURCE}: ${response.status}`);

const trimmed = trimCountries(await response.json());
const out = new URL('../public/data/countries.geojson', import.meta.url);
writeFileSync(out, JSON.stringify(trimmed));
console.log(`Wrote ${trimmed.features.length} countries to ${out.pathname}`);
