import { describe, expect, it } from 'vitest';
import { guideUrls } from './guides';

describe('guideUrls', () => {
	it('maps iso3 codes to guide URLs', () => {
		expect(
			guideUrls([
				{ id: 'united-kingdom', data: { iso3: 'GBR' } },
				{ id: 'france', data: { iso3: 'FRA' } },
			]),
		).toEqual({ GBR: '/countries/united-kingdom/', FRA: '/countries/france/' });
	});

	it('throws when two guides share an iso3', () => {
		expect(() =>
			guideUrls([
				{ id: 'united-kingdom', data: { iso3: 'GBR' } },
				{ id: 'great-britain', data: { iso3: 'GBR' } },
			]),
		).toThrow(/Duplicate iso3 GBR/);
	});
});
