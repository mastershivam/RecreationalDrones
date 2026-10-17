import { describe, expect, it } from 'vitest';
import { KNOWN_MISTAGS, modelFieldZones } from './model-fields';

describe('modelFieldZones', () => {
	it('makes a flying-site zone with the OpenStreetMap id, longitude first', () => {
		const [zone] = modelFieldZones([{ id: 'node/123', lon: -0.26969, lat: 51.45026, name: 'Sawyer Flying Club', access: 'members' }]);
		expect(zone.geometry).toEqual({ type: 'Point', coordinates: [-0.26969, 51.45026] });
		expect(zone.properties).toMatchObject({ id: 'osm:node/123', kind: 'flying-site', name: 'Sawyer Flying Club', status: 'active', osm: 'node/123' });
	});

	it('says it is not an approval to fly a drone, and passes on the mapped access', () => {
		const [zone] = modelFieldZones([{ id: 'way/9', lon: 1, lat: 2, access: 'private' }]);
		expect(zone.properties.note).toContain('not an approval to fly a drone');
		expect(zone.properties.note).toContain('Access, as mapped: private.');
	});

	it('leaves out the access sentence when none is mapped', () => {
		const [zone] = modelFieldZones([{ id: 'way/9', lon: 1, lat: 2 }]);
		expect(zone.properties.note).not.toContain('Access');
	});

	it('names an unnamed field, and ignores a blank name', () => {
		const names = modelFieldZones([{ id: 'node/1', lon: 1, lat: 2 }, { id: 'node/2', lon: 1, lat: 2, name: '  ' }]).map((z) => z.properties.name);
		expect(names).toEqual(['Model aircraft field (unnamed)', 'Model aircraft field (unnamed)']);
	});

	it('rounds to about a metre and sorts by id for a stable diff', () => {
		const zones = modelFieldZones([
			{ id: 'node/2', lon: 85.123456789, lat: 27.987654321 },
			{ id: 'node/1', lon: 1, lat: 2 },
		]);
		expect(zones.map((z) => z.properties.id)).toEqual(['osm:node/1', 'osm:node/2']);
		expect(zones[1].geometry).toEqual({ type: 'Point', coordinates: [85.12346, 27.98765] });
	});

	it('drops an object known to carry the tag by mistake, and each mistake has a reason', () => {
		const [id] = Object.keys(KNOWN_MISTAGS);
		expect(modelFieldZones([{ id, lon: 1, lat: 2, name: 'Saurya Airlines' }, { id: 'node/1', lon: 1, lat: 2 }]).map((z) => z.properties.id)).toEqual(['osm:node/1']);
		for (const reason of Object.values(KNOWN_MISTAGS)) expect(reason.length).toBeGreaterThan(20);
	});
});
