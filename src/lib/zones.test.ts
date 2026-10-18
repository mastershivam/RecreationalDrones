import { describe, expect, it } from 'vitest';
import { ZONE_GROUPS, ZONE_LAYER_IDS, circlePolygon, enabledKinds, markerPosition, heightRange, zoneFeatures, zoneLayerFilters, zonePopupHtml, zonesPopupHtml, type ZoneFile, type ZoneProps } from './zones';
import { zoneKinds } from './zone-schema';

// Metres between two [lon, lat] positions (haversine), to check circles against.
function metres([lon1, lat1]: number[], [lon2, lat2]: number[]) {
	const r = (d: number) => (d * Math.PI) / 180;
	const a = Math.sin(r(lat2 - lat1) / 2) ** 2 + Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(r(lon2 - lon1) / 2) ** 2;
	return 2 * 6371008.8 * Math.asin(Math.sqrt(a));
}

describe('circlePolygon', () => {
	it('is a closed ring', () => {
		const ring = circlePolygon(85.36, 27.7, 5000);
		expect(ring).toHaveLength(49);
		expect(ring[0]).toEqual(ring[48]);
	});

	it.each([
		[85.36, 27.7, 5000],
		[-0.45, 51.47, 3704],
		[100.75, 13.69, 9000],
		[-1.2, 60.4, 3704],
	])('keeps every point %d, %d at the radius %d m, even far from the equator', (lon, lat, radius) => {
		for (const point of circlePolygon(lon, lat, radius)) expect(Math.abs(metres([lon, lat], point) - radius) / radius).toBeLessThan(0.005);
	});

	it('is centred on the position', () => {
		const ring = circlePolygon(85.36, 27.7, 5000).slice(0, -1);
		const [lon, lat] = [0, 1].map((i) => ring.reduce((sum, p) => sum + p[i], 0) / ring.length);
		expect(lon).toBeCloseTo(85.36, 3);
		expect(lat).toBeCloseTo(27.7, 3);
	});
});

const point = (lon: number, lat: number) => ({ type: 'Point' as const, coordinates: [lon, lat] as [number, number] });
const zone = (over: Record<string, unknown>, geometry: unknown = point(85.36, 27.7)) => ({
	type: 'Feature' as const,
	geometry,
	properties: { id: 'z', kind: 'airport-buffer', name: 'Z', status: 'active', radiusMeters: 5000, ...over },
});
const file = (features: unknown[], meta: Record<string, unknown> = {}) =>
	({
		type: 'FeatureCollection',
		meta: { iso3: 'NPL', sourceUrl: 'https://example.org/data.csv', fetchedAt: '2026-10-17', licence: 'x', attribution: 'x', ...meta },
		features,
	}) as unknown as ZoneFile;

describe('zoneFeatures', () => {
	it('draws an airport as a circle and a dot at its middle', () => {
		const { features } = zoneFeatures([file([zone({})])]);
		expect(features.map((f) => [f.properties.shape, f.geometry && (f.geometry as { type: string }).type])).toEqual([
			['area', 'Polygon'],
			['point', 'Point'],
		]);
	});

	it('draws a field as a dot, and an outline as an area with a dot at its middle', () => {
		const field = zone({ id: 'f', kind: 'flying-site', radiusMeters: undefined });
		const park = zone({ id: 'p', kind: 'check-first', radiusMeters: undefined }, { type: 'Polygon', coordinates: [[[0, 0], [0, 2], [4, 2], [4, 0], [0, 0]]] });
		const { features } = zoneFeatures([file([field, park])]);
		expect(features.map((f) => [f.properties.id, f.properties.shape])).toEqual([
			['f', 'point'],
			['p', 'area'],
			['p', 'point'],
		]);
		expect(features[2].geometry).toEqual({ type: 'Point', coordinates: [2, 1] });
	});

	it('carries the country code through, so a popup can open that country', () => {
		expect(zoneFeatures([file([zone({})], { iso3: 'THA' })]).features.every((f) => f.properties.iso3 === 'THA')).toBe(true);
	});

	it('leaves out zones that are removed or superseded', () => {
		const { features } = zoneFeatures([file([zone({ id: 'a' }), zone({ id: 'b', status: 'removed' }), zone({ id: 'c', status: 'superseded' })])]);
		expect(new Set(features.map((f) => f.properties.id))).toEqual(new Set(['a']));
	});

	it("takes the note, source and date from the file's meta unless the zone has its own", () => {
		const meta = { note: 'Shared note', fetchedAt: '2026-10-17T00:00:00.000Z' };
		const { features } = zoneFeatures([file([zone({ id: 'a' }), zone({ id: 'b', note: 'Own note', ruleUrl: 'https://example.org/rule' })], meta)]);
		const [a, b] = ['a', 'b'].map((id) => features.find((f) => f.properties.id === id)!.properties);
		expect(a).toMatchObject({ note: 'Shared note', source: 'https://example.org/data.csv', asOf: '2026-10-17', indicative: false });
		expect(b).toMatchObject({ note: 'Own note', source: 'https://example.org/rule' });
	});

	it('uses the date a person last checked a curated file, and passes on indicative', () => {
		const { features } = zoneFeatures([file([zone({ indicative: true })], { fetchedAt: undefined, verifiedOn: '2026-09-01' })]);
		expect(features[0].properties).toMatchObject({ asOf: '2026-09-01', indicative: true });
	});
});

describe('zone filters', () => {
	const all = enabledKinds(ZONE_GROUPS.map((g) => g.id));
	const kindsIn = (filter: unknown) => ((filter as unknown[][])[2] as unknown[][])[2][1];

	it('turns a group of switches into the kinds they cover', () => {
		expect(enabledKinds(['airport'])).toEqual(['airport-buffer', 'airport-zone']);
		expect(enabledKinds(['approval', 'site'])).toEqual(['check-first', 'restricted', 'flying-site']);
		expect(enabledKinds([])).toEqual([]);
	});

	it('draws every kind when every group is on', () => {
		const filters = zoneLayerFilters(all);
		expect(Object.keys(filters)).toEqual(ZONE_LAYER_IDS);
		expect(new Set(Object.values(filters).flatMap(kindsIn))).toEqual(new Set(zoneKinds));
	});

	it('draws nothing when every group is off', () => {
		for (const filter of Object.values(zoneLayerFilters([]))) expect(kindsIn(filter)).toEqual([]);
	});

	it('hides only what a group covers', () => {
		const filters = zoneLayerFilters(enabledKinds(['site']));
		expect(kindsIn(filters['zones-points'])).toEqual(['flying-site']);
		expect(kindsIn(filters['zones-fill'])).toEqual([]);
		expect(kindsIn(filters['zones-airport-line'])).toEqual([]);
	});

	// A new kind in the schema has to be drawn and switchable, or it would be on the map with no way to hide it.
	it('has a group and a layer for every kind of zone', () => {
		const grouped = ZONE_GROUPS.flatMap((g) => g.kinds);
		expect([...grouped].sort()).toEqual([...zoneKinds].sort());
		expect(new Set(grouped).size).toBe(grouped.length);
		expect(new Set(Object.values(zoneLayerFilters(all)).flatMap(kindsIn))).toEqual(new Set(zoneKinds));
	});
});

describe('markerPosition', () => {
	const square = (x: number, y: number, size: number): [number, number][] => [[x, y], [x + size, y], [x + size, y + size], [x, y + size], [x, y]];

	it('is the middle of a polygon’s box', () => {
		expect(markerPosition({ type: 'Polygon', coordinates: [square(10, 20, 4)] })).toEqual([12, 22]);
	});

	it('uses the biggest part of a multipolygon, not an outlying island', () => {
		expect(markerPosition({ type: 'MultiPolygon', coordinates: [[square(50, 50, 1)], [square(0, 0, 10)], [square(30, 30, 2)]] })).toEqual([5, 5]);
	});
});

const props = (over: Partial<ZoneProps> = {}): ZoneProps => ({
	id: 'a',
	iso3: 'NPL',
	kind: 'airport-buffer',
	name: 'Tribhuvan International Airport',
	note: 'Do not fly within 5 km.',
	source: 'https://caanepal.gov.np/rule.pdf',
	asOf: '2026-10-17',
	indicative: false,
	shape: 'area',
	...over,
});

describe('zonePopupHtml', () => {
	it('says what the place is, its note, its source and the date', () => {
		const html = zonePopupHtml(props(), { link: false });
		expect(html).toContain('Tribhuvan International Airport');
		expect(html).toContain('Airport zone');
		expect(html).toContain('Do not fly within 5 km.');
		expect(html).toContain('Source: caanepal.gov.np · as of 2026-10-17');
	});

	it('has no link in the hover preview, and says how to get one', () => {
		const html = zonePopupHtml(props(), { link: false });
		expect(html).not.toContain('<a ');
		expect(html).toContain('click or tap for the link');
	});

	it('links to the source in the click popup, opening safely in a new tab', () => {
		const html = zonePopupHtml(props(), { link: true });
		expect(html).toContain('<a href="https://caanepal.gov.np/rule.pdf" target="_blank" rel="noopener noreferrer">caanepal.gov.np</a>');
		expect(html).not.toContain('click or tap');
	});

	it('offers the country’s rules in the tap popup, as a button, and not in the hover preview', () => {
		expect(zonePopupHtml(props(), { link: true })).toContain(`<button type="button" class="zone-country" data-iso3="NPL">See this country's rules</button>`);
		expect(zonePopupHtml(props(), { link: false })).not.toContain('button');
	});

	it('escapes the country code in the button', () => {
		expect(zonePopupHtml(props({ iso3: '"><img src=x>' }), { link: true })).not.toContain('<img');
	});

	it('marks an approximate zone as indicative', () => {
		expect(zonePopupHtml(props({ indicative: true }), { link: false })).toContain('Airport zone (indicative)');
		expect(zonePopupHtml(props(), { link: false })).not.toContain('indicative');
	});

	it('escapes the name, the note and the address', () => {
		const html = zonePopupHtml(props({ name: '<img src=x onerror=alert(1)>', note: '<script>alert(1)</script>', source: 'https://example.org/?a="b"&c=<d>' }), { link: true });
		expect(html).not.toContain('<img');
		expect(html).not.toContain('<script');
		expect(html).toContain('&lt;img');
		expect(html).toContain('&quot;');
	});

	it('never makes a link from a javascript: or other non-web address', () => {
		for (const source of ['javascript:alert(1)', 'data:text/html,hi', 'not a url', '']) {
			const html = zonePopupHtml(props({ source }), { link: true });
			expect(html, source).not.toContain('<a ');
			expect(html, source).toContain('Source: unknown');
		}
	});

	it('says a model aircraft field is a field, and never that flying is allowed', () => {
		const html = zonePopupHtml(props({ kind: 'flying-site', note: 'Not an approval to fly a drone there.' }), { link: false });
		expect(html).toContain('Model aircraft field');
		expect(html).not.toMatch(/you can fly|allowed to fly|safe to fly/i);
	});

	it('labels an official airport outline as one, and says where in the sky a zone applies without saying how high to fly', () => {
		const html = zonePopupHtml(props({ kind: 'airport-zone', floorMeters: 0, ceilingMeters: 120 }), { link: false });
		expect(html).toContain('Airport zone (official outline)');
		expect(html).toContain('Applies up to 120 m above the ground');
		expect(html).not.toMatch(/you can fly|allowed to fly|safe to fly|may fly/i);
	});

	it('labels the kinds plainly', () => {
		expect(zonePopupHtml(props({ kind: 'check-first' }), { link: false })).toContain('Check first: approval needed');
		expect(zonePopupHtml(props({ kind: 'restricted' }), { link: false })).toContain('Restricted area');
	});
});

describe('zonesPopupHtml', () => {
	const many = (n: number) => Array.from({ length: n }, (_, i) => props({ id: `z${i}`, name: `Zone ${i}` }));

	it('lists each zone once, even when the map reports it twice (its fill and its outline)', () => {
		const html = zonesPopupHtml([...many(2), ...many(2)], { link: false });
		expect(html.match(/<section class="zone">/g)).toHaveLength(2);
	});

	it('lists every zone under the pointer, however many, since the popup scrolls', () => {
		const html = zonesPopupHtml(many(7), { link: false });
		expect(html.match(/<section class="zone">/g)).toHaveLength(7);
		expect(html).not.toContain('more here');
	});
});

describe('heightRange', () => {
	it('says nothing when the authority gives no limits', () => {
		expect(heightRange({})).toBeUndefined();
	});
	it('words a ceiling, a floor and both', () => {
		expect(heightRange({ ceilingMeters: 50 })).toBe('Applies up to 50 m above the ground');
		expect(heightRange({ floorMeters: 30, ceilingMeters: 120 })).toBe('Applies from 30 to 120 m above the ground');
		expect(heightRange({ floorMeters: 30 })).toBe('Applies from 30 m above the ground');
	});
});

describe('zoneFeatures with an official outline', () => {
	it('keeps the outline and the height range, and adds a dot at its middle without inventing a circle', () => {
		const ring = [[0, 0], [0, 2], [2, 2], [0, 0]];
		const ctr = zone({ id: 'ctr', kind: 'airport-zone', radiusMeters: undefined, ceilingMeters: 100 }, { type: 'Polygon', coordinates: [ring] });
		const out = zoneFeatures([file([ctr])]).features;
		expect(out.map((f) => f.properties.shape)).toEqual(['area', 'point']);
		expect(out[0].properties).toMatchObject({ kind: 'airport-zone', ceilingMeters: 100 });
		expect((out[0].geometry as { coordinates: unknown[][] }).coordinates[0]).toHaveLength(4);
	});
});
