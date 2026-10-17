// Builds data/zones/<iso3>-model-fields.geojson: every model aircraft field mapped in OpenStreetMap, from a
// Geofabrik extract (the public Overpass servers are not for automated use). The extracts are big, so they are
// kept in data/osm/, which git ignores. Run with: npm run build:fields   (needs uv; add --refresh to download again)
// A field that has left the source is kept and marked `removed`, so the change shows up in the pull request.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createReadStream, createWriteStream, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { mergeZones } from '../src/lib/airport-zones.ts';
import { modelFieldZones, type FieldRow } from '../src/lib/model-fields.ts';
import { zoneFileText } from '../src/lib/zone-file.ts';
import { zoneCollectionSchema } from '../src/lib/zone-schema.ts';

const EXTRACTS: Record<string, string> = {
	GBR: 'https://download.geofabrik.de/europe/united-kingdom-latest.osm.pbf',
	NPL: 'https://download.geofabrik.de/asia/nepal-latest.osm.pbf',
	THA: 'https://download.geofabrik.de/asia/thailand-latest.osm.pbf',
};
const refresh = process.argv.includes('--refresh');
const dir = new URL('../data/osm/', import.meta.url);
mkdirSync(dir, { recursive: true });

for (const [iso3, url] of Object.entries(EXTRACTS)) {
	const pbf = new URL(`${iso3.toLowerCase()}.osm.pbf`, dir);
	if (refresh || !existsSync(pbf)) {
		const response = await fetch(url);
		if (!response.ok || !response.body) throw new Error(`Failed to fetch ${url}: ${response.status}`);
		await pipeline(Readable.fromWeb(response.body as never), createWriteStream(`${pbf.pathname}.part`));
		renameSync(`${pbf.pathname}.part`, pbf.pathname);
	}
	const sourceHash = createHash('sha256');
	await pipeline(createReadStream(pbf), sourceHash);

	const json = execFileSync('uvx', ['--from', 'osmium', 'python', 'scripts/osm-model-fields.py', pbf.pathname], {
		maxBuffer: 1 << 28,
		cwd: new URL('..', import.meta.url).pathname,
	});
	const file = new URL(`../data/zones/${iso3.toLowerCase()}-model-fields.geojson`, import.meta.url);
	const previous = existsSync(file) ? zoneCollectionSchema.parse(JSON.parse(readFileSync(file, 'utf8'))).features : [];
	const collection = {
		type: 'FeatureCollection' as const,
		meta: {
			iso3,
			sourceUrl: url,
			fetchedAt: new Date().toISOString().slice(0, 10),
			sourceHash: sourceHash.digest('hex'),
			licence: 'ODbL 1.0 (OpenStreetMap). Anything derived from this file must be shared under the same licence, with credit.',
			attribution: '© OpenStreetMap contributors (ODbL), via Geofabrik. Mapped by volunteers, so it may be incomplete or out of date.',
		},
		features: mergeZones(previous, modelFieldZones(JSON.parse(json.toString()) as FieldRow[])),
	};
	// Validate, but write what we built rather than the parsed copy, which turns dates into full timestamps.
	zoneCollectionSchema.parse(collection);
	writeFileSync(file, zoneFileText(collection));
	console.log(`${iso3}: ${collection.features.length} fields (${collection.features.filter((f) => f.properties.status === 'removed').length} removed)`);
}
