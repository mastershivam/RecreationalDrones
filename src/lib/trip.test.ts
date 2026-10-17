import { describe, expect, it } from 'vitest';
import { TRIP_ROWS, parseTrip, tripSearch, type TripCountry } from './trip';

const valid = new Set(['japan', 'germany']);

describe('parseTrip', () => {
	it('reads known countries once each and drops the rest', () => {
		expect(parseTrip('?c=japan,xx,germany,japan', valid)).toEqual(['japan', 'germany']);
	});
	it('is empty without a parameter', () => {
		expect(parseTrip('', valid)).toEqual([]);
	});
	it('ignores inherited object keys', () => {
		expect(parseTrip('?c=constructor', valid)).toEqual([]);
	});
});

describe('tripSearch', () => {
	it('round-trips with parseTrip', () => {
		expect(parseTrip(tripSearch(['germany', 'japan']), valid)).toEqual(['germany', 'japan']);
		expect(tripSearch([])).toBe('');
	});
});

describe('TRIP_ROWS', () => {
	const c: TripCountry = { id: 'japan', name: 'Japan', levelText: 'Complex restrictions', whoMustRegister: null, fee: '¥900', weight: 100, age: null, remoteId: null, insurance: null, registerUrl: null };
	it('gives null for what is not yet verified and text for the rest', () => {
		const value = Object.fromEntries(TRIP_ROWS.map((r) => [r.label, r.value(c)]));
		expect(value['Registration from']).toBe('100 g');
		expect(value['Registration fee']).toBe('¥900');
		expect(value['Minimum age']).toBeNull();
		expect(value['Who must register']).toBeNull();
	});
});
