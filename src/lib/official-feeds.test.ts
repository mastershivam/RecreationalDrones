import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { OFFICIAL_FEEDS } from './official-feeds';
import { zoneCollectionSchema } from './zone-schema';

const root = join(import.meta.dirname, '../..');
const guides = readdirSync(join(root, 'src/content/countries')).map((f) => readFileSync(join(root, 'src/content/countries', f), 'utf8').match(/^iso3: (\w{3})$/m)![1]);

describe('official zone feeds', () => {
	it.each(OFFICIAL_FEEDS)('$iso3 is a guided country with its terms written down', (feed) => {
		expect(guides).toContain(feed.iso3);
		for (const url of [feed.dataUrl, feed.pageUrl, feed.termsUrl]) expect(url.startsWith('https://'), url).toBe(true);
		expect(feed.licence.length).toBeGreaterThan(10);
		expect(feed.attribution.length).toBeGreaterThan(10);
	});

	it.each(OFFICIAL_FEEDS)('$iso3 has its built file, carrying the terms and where the data came from', (feed) => {
		const file = join(root, `data/zones/${feed.iso3.toLowerCase()}-official.geojson`);
		const { meta, features } = zoneCollectionSchema.parse(JSON.parse(readFileSync(file, 'utf8')));
		expect(meta.dataUrl).toBe(feed.dataUrl);
		expect(meta.licence).toContain(feed.termsUrl);
		expect(meta.sourceHash).toBeDefined();
		expect(features.length).toBeGreaterThan(0);
		expect(features.every((f) => f.geometry.type !== 'Point')).toBe(true);
	});

	it('uses a country once', () => {
		expect(new Set(OFFICIAL_FEEDS.map((f) => f.iso3)).size).toBe(OFFICIAL_FEEDS.length);
	});
});
