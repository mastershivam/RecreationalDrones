// Builds data/zones/<iso3>-airports.geojson: a buffer around every airport, with the radius from the country's
// official rule (src/lib/airport-rules.ts). Airport positions are from OurAirports (public domain).
// Run with: npm run build:zones
// A zone that has left the source is kept and marked `removed`, so the change shows up in the pull request.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { AIRPORT_RULES } from '../src/lib/airport-rules.ts';
import { airportZones, mergeZones } from '../src/lib/airport-zones.ts';
import { parseCsv } from '../src/lib/csv.ts';
import { zoneFileText } from '../src/lib/zone-file.ts';
import { zoneCollectionSchema } from '../src/lib/zone-schema.ts';

const SOURCE = 'https://davidmegginson.github.io/ourairports-data/airports.csv';

const response = await fetch(SOURCE);
if (!response.ok) throw new Error(`Failed to fetch ${SOURCE}: ${response.status}`);
const csv = await response.text();
const rows = parseCsv(csv);
const sourceHash = createHash('sha256').update(csv).digest('hex');

for (const [iso3, rules] of Object.entries(AIRPORT_RULES)) {
	if ('none' in rules) continue;
	const file = new URL(`../data/zones/${iso3.toLowerCase()}-airports.geojson`, import.meta.url);
	const previous = existsSync(file) ? zoneCollectionSchema.parse(JSON.parse(readFileSync(file, 'utf8'))).features : [];
	const collection = {
		type: 'FeatureCollection' as const,
		meta: {
			iso3,
			sourceUrl: SOURCE,
			fetchedAt: new Date().toISOString().slice(0, 10),
			sourceHash,
			licence: 'Public domain (Unlicense, per the ourairports-data repository)',
			attribution: `Airport positions: OurAirports (community-maintained, may be incomplete). Radius: ${rules.authority}.`,
			note: rules.note,
		},
		features: mergeZones(previous, airportZones(rows, rules)),
	};
	// Validate, but write what we built rather than the parsed copy, which turns dates into full timestamps.
	zoneCollectionSchema.parse(collection);
	writeFileSync(file, zoneFileText(collection));
	console.log(`${iso3}: ${collection.features.length} zones (${collection.features.filter((f) => f.properties.status === 'removed').length} removed)`);
}
