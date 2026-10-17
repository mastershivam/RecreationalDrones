import { describe, expect, it } from 'vitest';
import { chipCountries, pushRecent } from './recent';

describe('pushRecent', () => {
	it('puts the newest first and drops a repeat', () => {
		expect(pushRecent(['JPN', 'GBR'], 'GBR')).toEqual(['GBR', 'JPN']);
	});
	it('keeps at most max', () => {
		expect(pushRecent(['A', 'B', 'C', 'D'], 'E')).toEqual(['E', 'A', 'B', 'C']);
	});
});

describe('chipCountries', () => {
	const guides = { GBR: 1, JPN: 1, USA: 1 };
	it('shows recent first, then popular, once each', () => {
		expect(chipCountries([], ['JPN'], ['GBR', 'JPN', 'USA'], guides)).toEqual(['JPN', 'GBR', 'USA']);
	});
	it('skips countries with no guide', () => {
		expect(chipCountries([], ['XXX'], ['GBR'], guides)).toEqual(['GBR']);
	});
	it('puts saved countries first', () => {
		expect(chipCountries(['USA'], ['JPN'], ['GBR'], guides)).toEqual(['USA', 'JPN', 'GBR']);
	});
	it('caps the count', () => {
		expect(chipCountries([], [], ['GBR', 'JPN', 'USA'], guides, 2)).toEqual(['GBR', 'JPN']);
	});
});
