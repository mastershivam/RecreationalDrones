import { describe, expect, it } from 'vitest';
import { positions, zoneCollectionSchema } from './zone-schema';

const feature = (over: Record<string, unknown> = {}, geometry: unknown = { type: 'Point', coordinates: [85.3, 27.7] }) => ({
	type: 'Feature',
	geometry,
	properties: { id: 'a', kind: 'airport-buffer', name: 'A', status: 'active', radiusMeters: 5000, ...over },
});
const collection = (features: unknown[] = [feature()], meta: Record<string, unknown> = {}) => ({
	type: 'FeatureCollection',
	meta: {
		iso3: 'NPL',
		sourceUrl: 'https://example.org/data.csv',
		fetchedAt: '2026-10-17',
		licence: 'Public domain',
		attribution: 'Example',
		...meta,
	},
	features,
});
const ok = (value: unknown) => zoneCollectionSchema.safeParse(value).success;

describe('zoneCollectionSchema', () => {
	it('accepts a valid collection', () => {
		expect(ok(collection())).toBe(true);
	});

	it('needs fetchedAt for bulk data or verifiedOn for curated data', () => {
		expect(ok(collection([feature()], { fetchedAt: undefined }))).toBe(false);
		expect(ok(collection([feature()], { fetchedAt: undefined, verifiedOn: '2026-10-17' }))).toBe(true);
	});

	it('needs a licence and an attribution, so a zone file cannot lose where its data came from', () => {
		expect(ok(collection([feature()], { licence: '' }))).toBe(false);
		expect(ok(collection([feature()], { attribution: undefined }))).toBe(false);
	});

	it('needs a source URL and an ISO alpha-3 country code', () => {
		expect(ok(collection([feature()], { sourceUrl: 'not a url' }))).toBe(false);
		expect(ok(collection([feature()], { iso3: 'NP' }))).toBe(false);
	});

	it('needs a SHA-256 for sourceHash when there is one', () => {
		expect(ok(collection([feature()], { sourceHash: 'abc' }))).toBe(false);
		expect(ok(collection([feature()], { sourceHash: 'a'.repeat(64) }))).toBe(true);
	});

	it('needs a radius on an airport buffer', () => {
		expect(ok(collection([feature({ radiusMeters: undefined })]))).toBe(false);
		expect(ok(collection([feature({ radiusMeters: 0 })]))).toBe(false);
		expect(ok(collection([feature({ kind: 'flying-site', radiusMeters: undefined })]))).toBe(true);
	});

	it('refuses an unknown kind or status', () => {
		expect(ok(collection([feature({ kind: 'safe-to-fly' })]))).toBe(false);
		expect(ok(collection([feature({ status: 'deleted' })]))).toBe(false);
	});

	it('refuses two zones with the same id', () => {
		expect(ok(collection([feature(), feature()]))).toBe(false);
	});

	it('refuses a longitude and latitude that are out of range or the wrong way round', () => {
		expect(ok(collection([feature({}, { type: 'Point', coordinates: [27.7, 185.3] })]))).toBe(false);
		expect(ok(collection([feature({}, { type: 'Point', coordinates: [85.3, 95] })]))).toBe(false);
	});

	it('accepts an empty collection, which records that a source was checked and had none', () => {
		expect(ok(collection([]))).toBe(true);
	});

	const ring = [[0, 0], [0, 1], [1, 1], [0, 0]];

	it('accepts a polygon and a multipolygon', () => {
		expect(ok(collection([feature({ kind: 'check-first' }, { type: 'Polygon', coordinates: [ring] })]))).toBe(true);
		expect(ok(collection([feature({ kind: 'check-first' }, { type: 'MultiPolygon', coordinates: [[ring], [ring]] })]))).toBe(true);
	});

	it('refuses a ring with fewer than four positions, and an unknown geometry', () => {
		expect(ok(collection([feature({}, { type: 'Polygon', coordinates: [[[0, 0], [0, 1], [0, 0]]] })]))).toBe(false);
		expect(ok(collection([feature({}, { type: 'LineString', coordinates: [[0, 0], [1, 1]] })]))).toBe(false);
	});

	it('takes an official airport outline as an area but not as a point, and needs no radius', () => {
		const props = { kind: 'airport-zone', radiusMeters: undefined };
		expect(ok(collection([feature(props, { type: 'Polygon', coordinates: [ring] })]))).toBe(true);
		expect(ok(collection([feature(props, { type: 'MultiPolygon', coordinates: [[ring]] })]))).toBe(true);
		expect(ok(collection([feature(props)]))).toBe(false);
	});

	it('takes heights above the ground, with the floor below the ceiling', () => {
		expect(ok(collection([feature({ floorMeters: 0, ceilingMeters: 120 })]))).toBe(true);
		expect(ok(collection([feature({ floorMeters: 120, ceilingMeters: 120 })]))).toBe(false);
		expect(ok(collection([feature({ floorMeters: -5 })]))).toBe(false);
		expect(ok(collection([feature({ ceilingMeters: 0 })]))).toBe(false);
	});

	it('takes an OpenStreetMap reference only in the form node/1, way/1 or relation/1', () => {
		expect(ok(collection([feature({ osm: 'way/372975520' })]))).toBe(true);
		expect(ok(collection([feature({ osm: 'relation/1' })]))).toBe(true);
		expect(ok(collection([feature({ osm: '372975520' })]))).toBe(false);
		expect(ok(collection([feature({ osm: 'way/abc' })]))).toBe(false);
	});
});

describe('positions', () => {
	const geometry = (g: unknown) => g as Parameters<typeof positions>[0];
	it('lists every position of a point, a polygon and a multipolygon', () => {
		expect(positions(geometry({ type: 'Point', coordinates: [1, 2] }))).toEqual([[1, 2]]);
		expect(positions(geometry({ type: 'Polygon', coordinates: [[[0, 0], [0, 1], [1, 1], [0, 0]]] }))).toHaveLength(4);
		expect(positions(geometry({ type: 'MultiPolygon', coordinates: [[[[0, 0], [0, 1], [1, 1], [0, 0]]], [[[5, 5], [5, 6], [6, 6], [5, 5]]]] }))).toHaveLength(8);
	});
});
