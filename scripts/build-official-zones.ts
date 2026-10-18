// Builds data/zones/<iso3>-official.geojson from each authority's own UAS geographical zones file (ED-269 JSON).
// The feeds and the terms they are published under are in src/lib/official-feeds.ts.
// Run with: npm run build:official
// A zone that has left the source is kept and marked `removed`, so the change shows up in the pull request.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { mergeZones } from '../src/lib/airport-zones.ts';
import { ed269Zones, shareCommonNote, type Ed269Zone } from '../src/lib/ed269.ts';
import { OFFICIAL_FEEDS } from '../src/lib/official-feeds.ts';
import { zoneFileText } from '../src/lib/zone-file.ts';
import { zoneCollectionSchema } from '../src/lib/zone-schema.ts';

for (const feed of OFFICIAL_FEEDS) {
	const response = await fetch(feed.dataUrl);
	if (!response.ok) throw new Error(`Failed to fetch ${feed.dataUrl}: ${response.status}`);
	const text = await response.text();
	// Some feeds start with a byte order mark, which JSON.parse refuses.
	const source = JSON.parse(text.replace(/^﻿/, '')) as { features: Ed269Zone[] };
	const file = new URL(`../data/zones/${feed.iso3.toLowerCase()}-official.geojson`, import.meta.url);
	const previous = existsSync(file) ? zoneCollectionSchema.parse(JSON.parse(readFileSync(file, 'utf8'))).features : [];
	const { zones, note } = shareCommonNote(ed269Zones(source.features, { iso3: feed.iso3 }));
	const collection = {
		type: 'FeatureCollection' as const,
		meta: {
			iso3: feed.iso3,
			sourceUrl: feed.pageUrl,
			dataUrl: feed.dataUrl,
			fetchedAt: new Date().toISOString().slice(0, 10),
			sourceHash: createHash('sha256').update(text).digest('hex'),
			licence: `${feed.licence} Terms: ${feed.termsUrl}`,
			attribution: feed.attribution,
			note: `${note ?? ''} Outlines are simplified to about 20 m; the ${feed.authority} file is the reference.`.trim(),
		},
		features: mergeZones(previous, zones),
	};
	// Validate, but write what we built rather than the parsed copy, which turns dates into full timestamps.
	zoneCollectionSchema.parse(collection);
	writeFileSync(file, zoneFileText(collection));
	console.log(`${feed.iso3}: ${collection.features.length} zones, ${(zoneFileText(collection).length / 1024).toFixed(0)} KB`);
}
