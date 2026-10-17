import { describe, expect, it } from 'vitest';
import { airportZones, mergeZones } from './airport-zones';

const rule = { iso2: 'NP', radiusMeters: 5000, ruleUrl: 'https://example.org/rule' };
const row = (over: Record<string, string>) => ({
	ident: 'VNKT',
	type: 'large_airport',
	name: 'Tribhuvan International Airport',
	latitude_deg: '27.6966',
	longitude_deg: '85.3591',
	iso_country: 'NP',
	...over,
});

describe('airportZones', () => {
	it('makes one buffer per airport, with longitude first and the radius from the rule', () => {
		const [zone] = airportZones([row({})], rule);
		expect(zone.geometry.coordinates).toEqual([85.3591, 27.6966]);
		expect(zone.properties).toMatchObject({
			id: 'ourairports:VNKT',
			kind: 'airport-buffer',
			status: 'active',
			radiusMeters: 5000,
			ruleUrl: 'https://example.org/rule',
		});
	});

	it('keeps only airports in the country', () => {
		expect(airportZones([row({}), row({ ident: 'VIDP', iso_country: 'IN' })], rule)).toHaveLength(1);
	});

	it('leaves out heliports, seaplane bases and closed fields', () => {
		const rows = ['heliport', 'seaplane_base', 'closed', 'balloonport'].map((type) => row({ type, ident: type }));
		expect(airportZones(rows, rule)).toEqual([]);
	});

	it('keeps small and medium airports', () => {
		const rows = [row({ ident: 'A', type: 'small_airport' }), row({ ident: 'B', type: 'medium_airport' })];
		expect(airportZones(rows, rule)).toHaveLength(2);
	});

	it('sorts by id so a refresh gives a stable diff', () => {
		const ids = airportZones([row({ ident: 'VNPK' }), row({ ident: 'VNBW' })], rule).map((z) => z.properties.id);
		expect(ids).toEqual(['ourairports:VNBW', 'ourairports:VNPK']);
	});

	it('rounds coordinates to about a metre', () => {
		const [zone] = airportZones([row({ longitude_deg: '85.123456789', latitude_deg: '27.987654321' })], rule);
		expect(zone.geometry.coordinates).toEqual([85.12346, 27.98765]);
	});
});

describe('mergeZones', () => {
	const [a, b] = airportZones([row({ ident: 'A' }), row({ ident: 'B' })], rule);

	it('marks a zone that has left the source as removed, instead of deleting it', () => {
		const merged = mergeZones([a, b], [a]);
		expect(merged.map((z) => [z.properties.id, z.properties.status])).toEqual([
			['ourairports:A', 'active'],
			['ourairports:B', 'removed'],
		]);
	});

	it('takes the new values for a zone that is still there', () => {
		const moved = { ...a, properties: { ...a.properties, name: 'Renamed' } };
		expect(mergeZones([a], [moved])[0].properties.name).toBe('Renamed');
	});

	it('brings back a zone that was removed and has returned', () => {
		const removed = { ...b, properties: { ...b.properties, status: 'removed' as const } };
		expect(mergeZones([removed], [b])[0].properties.status).toBe('active');
	});

	it('adds a new zone', () => {
		expect(mergeZones([a], [a, b])).toHaveLength(2);
	});
});
