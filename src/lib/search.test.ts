import { describe, expect, it } from 'vitest';
import { searchCountries } from './search';

const guides = {
	GBR: { name: 'United Kingdom' },
	USA: { name: 'United States' },
	AUT: { name: 'Austria' },
	NPL: { name: 'Nepal' },
	CZE: { name: 'Czechia' },
};

describe('searchCountries', () => {
	it('returns nothing for empty or blank text', () => {
		expect(searchCountries('', guides)).toEqual([]);
		expect(searchCountries('   ', guides)).toEqual([]);
	});

	it('ignores case and surrounding spaces', () => {
		expect(searchCountries('  NEPAL ', guides)).toEqual([{ iso3: 'NPL', name: 'Nepal' }]);
	});

	it('ignores accents in the text typed and in the names', () => {
		expect(searchCountries('cesko', { CZE: { name: 'Česko' } })).toEqual([{ iso3: 'CZE', name: 'Česko' }]);
		expect(searchCountries('Česko', guides)).toEqual([]);
	});

	it('puts names that start with the text before names that only contain it, then sorts by name', () => {
		const hits = searchCountries('un', guides).map((h) => h.iso3);
		expect(hits).toEqual(['GBR', 'USA']);
		expect(searchCountries('st', guides).map((h) => h.iso3)).toEqual(['AUT', 'USA']);
	});

	it('returns an empty list when nothing matches, and respects the limit', () => {
		expect(searchCountries('zzz', guides)).toEqual([]);
		expect(searchCountries('a', guides, 2)).toHaveLength(2);
	});
});
