import { describe, expect, it } from 'vitest';
import { visibleCountries, type CountryRow } from './country-filter';

const rows: CountryRow[] = [
	{ id: 'japan', name: 'Japan', level: 3, weight: 100, checked: '2026-10-01', region: 'Asia' },
	{ id: 'austria', name: 'Austria', level: 2, weight: 250, checked: '2026-09-01', region: 'European Union' },
	{ id: 'cote', name: 'Côte d’Ivoire', level: 4, weight: null, checked: '2026-10-10', region: 'Africa' },
];
const none = new Set<never>();

describe('visibleCountries', () => {
	it('sorts by name, level or longest since checked', () => {
		expect(visibleCountries(rows, '', none, 'name')).toEqual(['austria', 'cote', 'japan']);
		expect(visibleCountries(rows, '', none, 'level')).toEqual(['austria', 'japan', 'cote']);
		expect(visibleCountries(rows, '', none, 'checked')).toEqual(['austria', 'japan', 'cote']);
	});
	it('matches typed text ignoring case and accents', () => {
		expect(visibleCountries(rows, 'COTE', none, 'name')).toEqual(['cote']);
	});
	it('keeps only the selected levels', () => {
		expect(visibleCountries(rows, '', new Set([2, 3] as const), 'name')).toEqual(['austria', 'japan']);
	});
	it('keeps only the chosen region', () => {
		expect(visibleCountries(rows, '', none, 'name', 'Asia')).toEqual(['japan']);
	});
	it('can match nothing', () => {
		expect(visibleCountries(rows, 'zzz', none, 'name')).toEqual([]);
	});
});
