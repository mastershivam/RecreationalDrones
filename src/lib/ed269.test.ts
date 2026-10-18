import { describe, expect, it } from 'vitest';
import { ed269Zones, shareCommonNote, simplifyRing, type Ed269Zone } from './ed269';

const square = [[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]];
const zone = (over: Partial<Ed269Zone> = {}, geometry: Record<string, unknown> = {}): Ed269Zone => ({
	identifier: 'Z1',
	name: 'Zone one',
	restriction: 'REQ_AUTHORISATION',
	reason: ['NATURE'],
	geometry: [{ uomDimensions: 'M', lowerLimit: 0, lowerVerticalReference: 'AGL', upperLimit: 120, upperVerticalReference: 'AGL', horizontalProjection: { type: 'Polygon', coordinates: [square] }, ...geometry }],
	...over,
});
const convert = (zones: Ed269Zone[], now = new Date('2026-10-18')) => ed269Zones(zones, { iso3: 'CHE', now });

describe('simplifyRing', () => {
	it('drops points on a straight line and keeps the corners, staying closed', () => {
		const ring = [[0, 0], [0, 0.5], [0, 1], [1, 1], [1, 0], [0, 0]];
		const out = simplifyRing(ring, 0.001);
		expect(out).toEqual([[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]);
	});
	it('rounds to 5 decimals', () => {
		expect(simplifyRing([[0.123456789, 0], [0, 1], [1, 1], [0.123456789, 0]], 0)[0]).toEqual([0.12346, 0]);
	});
	it('does not let a tiny zone collapse to a line', () => {
		const tiny = [[0, 0], [0.00001, 0], [0.00001, 0.00001], [0, 0]];
		expect(simplifyRing(tiny, 0.1)).toHaveLength(4);
	});
});

describe('ed269Zones', () => {
	it('makes an airport zone of anything for air traffic, whatever its class', () => {
		const [z] = convert([zone({ reason: ['AIR_TRAFFIC'], restriction: 'CONDITIONAL' })]);
		expect(z.properties.kind).toBe('airport-zone');
		expect(z.properties.note).toContain('allowed only on conditions');
	});
	it('maps other zones by class: prohibited is restricted, the rest check first', () => {
		expect(convert([zone({ restriction: 'PROHIBITED' })])[0].properties.kind).toBe('restricted');
		expect(convert([zone({ restriction: 'REQ_AUTHORISATION' })])[0].properties.kind).toBe('check-first');
	});
	it('leaves out unrestricted zones and zones that have ended, but keeps permanent ones', () => {
		expect(convert([zone({ restriction: 'NO_RESTRICTION' })])).toEqual([]);
		expect(convert([zone({ applicability: [{ endDateTime: '2025-01-01T00:00:00Z', permanent: 'NO' }] })])).toEqual([]);
		expect(convert([zone({ applicability: [{ endDateTime: '2031-01-01T00:00:00Z', permanent: 'NO' }] })])).toHaveLength(1);
		expect(convert([zone({ applicability: [{ endDateTime: '', permanent: 'YES' }] })])).toHaveLength(1);
	});
	it('gives heights above ground, in metres, and none above sea level', () => {
		expect(convert([zone()])[0].properties).toMatchObject({ floorMeters: 0, ceilingMeters: 120 });
		const feet = convert([zone({}, { uomDimensions: 'FT', upperLimit: 400 })])[0].properties;
		expect(feet.ceilingMeters).toBe(122);
		const amsl = convert([zone({}, { upperVerticalReference: 'AMSL' })])[0].properties;
		expect(amsl.ceilingMeters).toBeUndefined();
	});
	it('makes one zone per height band, with distinct ids', () => {
		const two = zone();
		two.geometry.push({ ...two.geometry[0], upperLimit: 50 });
		expect(convert([two]).map((z) => z.properties.id)).toEqual(['ed269:CHE:Z1#1', 'ed269:CHE:Z1#2']);
	});
	it('puts the authority\'s own conditions and message in the note', () => {
		const note = convert([zone({ restrictionConditions: ['No drones over 250 g.'], message: 'Ask the canton.' })])[0].properties.note;
		expect(note).toContain('No drones over 250 g.');
		expect(note).toContain('Ask the canton.');
	});
	it('refuses a shape it cannot draw, instead of dropping the zone', () => {
		expect(() => convert([zone({}, { horizontalProjection: { type: 'Circle' } })])).toThrow('unsupported shape');
	});
});

describe('shareCommonNote', () => {
	it('moves the most common note out of the zones that have it', () => {
		const zones = convert([zone({ identifier: 'A' }), zone({ identifier: 'B' }), zone({ identifier: 'C', message: 'Other.' })]);
		const out = shareCommonNote(zones);
		expect(out.note).toContain('approval needed');
		expect(out.zones.map((z) => z.properties.note)).toEqual([undefined, undefined, expect.stringContaining('Other.')]);
	});
	it('does nothing when no zone has a note', () => {
		expect(shareCommonNote([])).toEqual({ zones: [] });
	});
});
