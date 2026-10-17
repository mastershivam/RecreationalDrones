import { describe, expect, it } from 'vitest';
import { countryAt, locateErrorMessage, locatedMessage } from './geo';

const square = (x: number, y: number, size: number) => [[x, y], [x + size, y], [x + size, y + size], [x, y + size], [x, y]];
const countries = [
	{ properties: { ADM0_A3: 'AAA', NAME: 'Aland' }, geometry: { type: 'Polygon' as const, coordinates: [square(0, 0, 10), square(4, 4, 2)] } },
	{ properties: { ADM0_A3: 'BBB', NAME: 'Bland' }, geometry: { type: 'MultiPolygon' as const, coordinates: [[square(20, 0, 5)], [square(30, 30, 5)]] } },
	{ properties: { ADM0_A3: 'CCC' }, geometry: null },
];

describe('countryAt', () => {
	it('finds the country a position is in', () => {
		expect(countryAt(2, 2, countries)).toEqual({ iso3: 'AAA', name: 'Aland' });
	});

	it('finds a position in any part of a multipolygon', () => {
		expect(countryAt(22, 2, countries)?.iso3).toBe('BBB');
		expect(countryAt(32, 32, countries)?.iso3).toBe('BBB');
	});

	it('is not fooled by a hole: a lake inside a country is outside it', () => {
		expect(countryAt(5, 5, countries)).toBeUndefined();
	});

	it('returns undefined for the sea, between parts, and for a country with no shape', () => {
		expect(countryAt(15, 15, countries)).toBeUndefined();
		expect(countryAt(-5, -5, countries)).toBeUndefined();
	});

	it('does not match one country’s box for another', () => {
		expect(countryAt(27, 2, countries)).toBeUndefined();
	});
});

describe('messages', () => {
	it('says where you are, and when there is no guide yet', () => {
		expect(locatedMessage({ name: 'Japan' }, true)).toBe('You are in Japan.');
		expect(locatedMessage({ name: 'Brazil' }, false)).toBe('You are in Brazil. We have no guide for it yet.');
		expect(locatedMessage(undefined, false)).toContain('at sea');
	});

	it('explains each way finding a location can fail, and offers search', () => {
		for (const code of [1, 2, 3]) expect(locateErrorMessage(code)).toContain('search for a country');
		expect(locateErrorMessage(1)).toContain('denied');
		expect(locateErrorMessage(3)).toContain('too long');
	});
});
