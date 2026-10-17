import { describe, expect, it } from 'vitest';
import { countryFromSearch, searchWithCountry } from './deeplink';

const guides = { JPN: 1 };

describe('countryFromSearch', () => {
	it('reads a guided country, ignoring case', () => {
		expect(countryFromSearch('?country=jpn', guides)).toBe('JPN');
	});
	it('ignores an unknown country, a missing one and inherited keys', () => {
		expect(countryFromSearch('?country=XXX', guides)).toBeUndefined();
		expect(countryFromSearch('', guides)).toBeUndefined();
		expect(countryFromSearch('?country=constructor', guides)).toBeUndefined();
	});
});

describe('searchWithCountry', () => {
	it('adds, replaces and removes the country, keeping other parameters', () => {
		expect(searchWithCountry('?e2e', 'JPN')).toBe('?e2e=&country=JPN');
		expect(searchWithCountry('?country=GBR', 'JPN')).toBe('?country=JPN');
		expect(searchWithCountry('?country=JPN')).toBe('');
	});
});
