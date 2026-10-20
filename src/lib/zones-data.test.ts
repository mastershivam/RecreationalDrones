import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { AIRPORT_RULES, type AirportRule } from './airport-rules';
import { positions, zoneCollectionSchema } from './zone-schema';

const root = join(import.meta.dirname, '../..');
const dir = join(root, 'data/zones');
const files = readdirSync(dir)
	.filter((f) => f.endsWith('.geojson'))
	.map((file) => ({ file, raw: JSON.parse(readFileSync(join(dir, file), 'utf8')) }));
// A file that fails the schema is skipped here, so its own "is valid" test reports it, not a crash of this whole file.
const parsed = files.flatMap(({ file, raw }) => {
	const result = zoneCollectionSchema.safeParse(raw);
	return result.success ? [{ file, data: result.data }] : [];
});
const guide = (slug: string) => readFileSync(join(root, `src/content/countries/${slug}.mdx`), 'utf8');

// Rough boxes around each country, to catch a wrong country filter or swapped coordinates.
const BOX: Record<string, { lon: [number, number]; lat: [number, number] }> = {
	NPL: { lon: [79.9, 88.3], lat: [26.3, 30.5] },
	THA: { lon: [97.3, 105.7], lat: [5.5, 20.5] },
	// Mainland, Svalbard (to 79 N) and Jan Mayen (to 8.7 W), which OurAirports counts as Norway.
	NOR: { lon: [-9, 32], lat: [57.5, 81] },
	GBR: { lon: [-8.7, 1.8], lat: [49.8, 60.9] },
	CAN: { lon: [-141.1, -52.5], lat: [41.6, 83.2] },
	AUS: { lon: [96.5, 168], lat: [-54.9, -9.0] },
	// New Zealand crosses the 180th meridian (the Chatham Islands are at about 176 W), so this box is far wider than the country.
	NZL: { lon: [-178, 179], lat: [-47.5, -29] },
	ZAF: { lon: [16.3, 33], lat: [-35, -22.2] },
	// Not Ulleung Airport, which OurAirports places in China (see the exclude list in airport-rules.ts).
	KOR: { lon: [125.8, 131.5], lat: [32.8, 38.9] },
	CHE: { lon: [5.9, 10.6], lat: [45.8, 47.9] },
	LUX: { lon: [5.7, 6.6], lat: [49.4, 50.2] },
};

describe('zone data files', () => {
	it('has at least one file', () => {
		expect(files.length).toBeGreaterThan(0);
	});

	it.each(files)('$file is valid', ({ raw }) => {
		const result = zoneCollectionSchema.safeParse(raw);
		expect(result.success, JSON.stringify(result.error?.issues)).toBe(true);
	});

	it.each(parsed)('$file is named for its country', ({ file, data }) => {
		expect(file.startsWith(`${data.meta.iso3.toLowerCase()}-`)).toBe(true);
	});

	it('uses each zone id once across all files', () => {
		const ids = parsed.flatMap(({ data }) => data.features.map((f) => f.properties.id));
		expect(new Set(ids).size).toBe(ids.length);
	});

	it.each(parsed)('$file has every zone inside its country', ({ data }) => {
		const box = BOX[data.meta.iso3];
		expect(box, `no bounding box for ${data.meta.iso3}`).toBeDefined();
		for (const f of data.features) {
			for (const [lon, lat] of positions(f.geometry)) {
				expect(lon, f.properties.id).toBeGreaterThanOrEqual(box.lon[0]);
				expect(lon, f.properties.id).toBeLessThanOrEqual(box.lon[1]);
				expect(lat, f.properties.id).toBeGreaterThanOrEqual(box.lat[0]);
				expect(lat, f.properties.id).toBeLessThanOrEqual(box.lat[1]);
			}
		}
	});

	// DESIGN.md, Voice: we say what a place is and who says so, never that you may fly there.
	it.each(parsed)('$file never says flying is allowed or safe', ({ data }) => {
		for (const f of data.features) {
			expect(`${f.properties.name} ${f.properties.note ?? ''}`, f.properties.id).not.toMatch(/\b(you can fly|allowed to fly|safe to fly|legal to fly)\b/i);
		}
	});
});

// The rule: every country with a guide has airport circles, sized by its own authority. Adding a guide fails here
// until src/lib/airport-rules.ts has an entry for it and `npm run build:zones` has made the file.
describe('airport circles', () => {
	const guideCodes = readdirSync(join(root, 'src/content/countries'))
		.filter((f) => f.endsWith('.mdx'))
		.map((f) => ({ slug: f.replace(/\.mdx$/, ''), iso3: readFileSync(join(root, 'src/content/countries', f), 'utf8').match(/^iso3: (\w{3})$/m)![1] }));
	const file = (iso3: string) => parsed.find((p) => p.file === `${iso3.toLowerCase()}-airports.geojson`);
	const withRule = Object.entries(AIRPORT_RULES).filter((e): e is [string, AirportRule] => !('none' in e[1]));

	it('finds the guides it is meant to check', () => {
		expect(guideCodes.map((g) => g.iso3)).toEqual(expect.arrayContaining(['GBR', 'NPL', 'THA']));
	});

	it.each(guideCodes)('$slug ($iso3) has an airport rule in src/lib/airport-rules.ts', ({ iso3 }) => {
		expect(AIRPORT_RULES, `add an entry for ${iso3} to src/lib/airport-rules.ts`).toHaveProperty(iso3);
		const rule = AIRPORT_RULES[iso3];
		if ('none' in rule) expect(rule.none.length, 'say why there is no distance').toBeGreaterThan(20);
	});

	it.each(guideCodes)('$slug ($iso3) has its airport file when it has a rule', ({ iso3 }) => {
		if ('none' in AIRPORT_RULES[iso3]) return;
		expect(file(iso3), `run npm run build:zones to make data/zones/${iso3.toLowerCase()}-airports.geojson`).toBeDefined();
		expect(file(iso3)!.data.features.length).toBeGreaterThan(0);
	});

	it.each(withRule)('%s: every zone has the rule radius, and the file carries the rule note and its source', (iso3, rule) => {
		const { data } = file(iso3)!;
		for (const f of data.features) {
			expect(f.properties.radiusMeters, f.properties.id).toBe(rule.radiusMeters);
			expect(f.properties.ruleUrl, f.properties.id).toBe(rule.ruleUrl);
			expect(f.properties.indicative === true, f.properties.id).toBe(rule.indicative === true);
		}
		expect(data.meta.note).toBe(rule.note);
		expect(data.meta.attribution).toContain(rule.authority);
		expect(rule.ruleUrl.startsWith('https://')).toBe(true);
	});

	// The radius comes from the official rule the guide already cites, so the two must agree.
	it.each([
		['NPL', 'nepal'],
		['THA', 'thailand'],
	])('%s: the radius is the one the %s guide gives', (iso3, slug) => {
		const rule = AIRPORT_RULES[iso3] as AirportRule;
		expect(guide(slug)).toContain(`**${rule.radiusMeters / 1000} km**`);
	});

	it('uses 2 nautical miles for the UK, the CAA figure for a zone with no ATZ, and says the circle is only a guide', () => {
		const rule = AIRPORT_RULES.GBR as AirportRule;
		expect(rule.radiusMeters).toBe(3704);
		expect(rule.indicative).toBe(true);
		expect(rule.note).toContain('only a guide');
		expect(rule.note).toContain('1 km past the airfield boundary');
		expect(rule.note).toContain('Heliports are not shown');
	});

	it('has the main international airports', () => {
		const ids = (iso3: string) => file(iso3)!.data.features.map((f) => f.properties.id);
		expect(ids('NPL')).toContain('ourairports:VNKT');
		for (const id of ['VTBS', 'VTBD', 'VTSP', 'VTCC']) expect(ids('THA')).toContain(`ourairports:${id}`);
		for (const id of ['EGLL', 'EGKK', 'EGCC', 'EGPH']) expect(ids('GBR')).toContain(`ourairports:${id}`);
	});

	it('records where the airports came from and when', () => {
		for (const [iso3] of withRule) {
			const { data } = file(iso3)!;
			expect(data.meta.sourceUrl).toContain('ourairports');
			expect(data.meta.sourceHash).toBeDefined();
			expect(data.meta.fetchedAt).toBeDefined();
		}
	});
});

describe('Richmond Park flying field', () => {
	// Looked up inside each test, so a broken or missing file fails these tests instead of the whole file.
	const load = () => {
		const { data } = parsed.find((p) => p.file === 'gbr-curated.geojson')!;
		return { data, zone: data.features.find((f) => f.properties.id === 'royal-parks:richmond-park-flying-field')! };
	};

	it('is flagged as a flying site, with the Royal Parks as its source', () => {
		const { data, zone } = load();
		expect(zone.properties.kind).toBe('flying-site');
		expect(new URL(data.meta.sourceUrl).hostname).toBe('royalparks.org.uk');
		expect(zone.properties.ruleUrl).toBe(data.meta.sourceUrl);
		expect(data.meta.verifiedOn).toBeDefined();
	});

	it('is in Richmond Park, not just somewhere in London', () => {
		const { zone } = load();
		const [lon, lat] = positions(zone.geometry)[0];
		expect(lon).toBeGreaterThan(-0.31);
		expect(lon).toBeLessThan(-0.24);
		expect(lat).toBeGreaterThan(51.42);
		expect(lat).toBeLessThan(51.47);
	});

	it('keeps the conditions that come with it: park regulations, CAA rules and no FPV goggles', () => {
		const { zone } = load();
		expect(zone.properties.note).toContain('Park Regulations');
		expect(zone.properties.note).toContain('CAA');
		expect(zone.properties.note).toContain('FPV');
	});

	it('credits OpenStreetMap for the position, as its licence requires', () => {
		const { data } = load();
		expect(data.meta.attribution).toContain('OpenStreetMap');
		expect(data.meta.attribution).toContain('ODbL');
	});
});

// Anything built from OpenStreetMap must credit it and carry its licence, whichever file it is in.
describe('OpenStreetMap data', () => {
	const fromOsm = parsed.filter(({ data }) => data.features.some((f) => f.properties.osm || f.properties.id.startsWith('osm:')));

	it('is found in the files we expect', () => {
		expect(fromOsm.map((p) => p.file)).toEqual(expect.arrayContaining(['gbr-curated.geojson', 'gbr-royal-parks.geojson']));
	});

	it.each(fromOsm)('$file credits OpenStreetMap and names the ODbL', ({ data }) => {
		expect(data.meta.attribution).toContain('OpenStreetMap');
		expect(`${data.meta.attribution} ${data.meta.licence}`).toContain('ODbL');
	});
});

describe('Royal Parks that need approval', () => {
	const load = () => parsed.find((p) => p.file === 'gbr-royal-parks.geojson')!.data;
	const NAMED_BY_THE_POLICY = ['Hyde Park', 'Kensington Gardens', "St James's Park", 'Victoria Tower Gardens', 'The Green Park', "The Regent's Park", 'Primrose Hill', 'Brompton Cemetery'];

	it('has exactly the areas the Royal Parks policy names, and no others', () => {
		expect(load().features.map((f) => f.properties.name).sort()).toEqual([...NAMED_BY_THE_POLICY].sort());
	});

	it('flags each as check-first, with an outline and its OpenStreetMap object', () => {
		for (const f of load().features) {
			expect(f.properties.kind, f.properties.id).toBe('check-first');
			expect(['Polygon', 'MultiPolygon'], f.properties.id).toContain(f.geometry.type);
			expect(f.properties.osm, f.properties.id).toBeDefined();
		}
	});

	it('says which approval each needs: NATS, or London Heliport for Brompton Cemetery', () => {
		for (const f of load().features) {
			const expected = f.properties.name === 'Brompton Cemetery' ? 'London Heliport approval is required' : 'NATS approval is required';
			expect(f.properties.note, f.properties.id).toContain(expected);
		}
	});

	it('cites the Royal Parks policy and was checked by a person', () => {
		const { meta, features } = load();
		expect(new URL(meta.sourceUrl).hostname).toBe('royalparks.org.uk');
		expect(meta.verifiedOn).toBeDefined();
		for (const f of features) expect(f.properties.ruleUrl).toBe(meta.sourceUrl);
	});

	it('keeps every outline in central London', () => {
		for (const f of load().features) {
			for (const [lon, lat] of positions(f.geometry)) {
				expect(lon, f.properties.id).toBeGreaterThan(-0.25);
				expect(lon, f.properties.id).toBeLessThan(-0.08);
				expect(lat, f.properties.id).toBeGreaterThan(51.47);
				expect(lat, f.properties.id).toBeLessThan(51.56);
			}
		}
	});
});

describe('model aircraft fields', () => {
	const fieldFiles = () => parsed.filter((p) => p.file.endsWith('-model-fields.geojson'));

	it('exist for each country', () => {
		expect(fieldFiles().map((p) => p.file).sort()).toEqual(['gbr-model-fields.geojson', 'npl-model-fields.geojson', 'tha-model-fields.geojson']);
	});

	it('are all flying sites, taken from OpenStreetMap, and none says it is an approval to fly', () => {
		for (const { data } of fieldFiles()) {
			expect(data.meta.sourceUrl).toContain('download.geofabrik.de');
			expect(data.meta.sourceHash).toBeDefined();
			for (const f of data.features) {
				expect(f.properties.kind, f.properties.id).toBe('flying-site');
				expect(f.properties.id, f.properties.id).toBe(`osm:${f.properties.osm}`);
				if (f.properties.status === 'active') expect(f.properties.note, f.properties.id).toContain('not an approval to fly a drone');
			}
		}
	});

	it('leave out the object known to be tagged by mistake', () => {
		const ids = fieldFiles().flatMap(({ data }) => data.features.map((f) => f.properties.id));
		expect(ids).not.toContain('osm:node/5392235753');
	});

	it('have the Thai field near Pattaya that we saw in the extract', () => {
		const { data } = fieldFiles().find((p) => p.file === 'tha-model-fields.geojson')!;
		expect(data.features.map((f) => f.properties.id)).toContain('osm:way/215522346');
	});
});
