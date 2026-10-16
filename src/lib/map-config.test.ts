import { describe, expect, it } from 'vitest';
import {
	GLOBE_PROJECTION,
	MAP_COLOR_TOKENS,
	coveredCountriesFilter,
	guideForFeature,
	initialZoom,
	readMapColors,
	tapBox,
} from './map-config';

const guides = { GBR: '/countries/united-kingdom/' };

describe('GLOBE_PROJECTION', () => {
	it('selects the globe projection', () => {
		expect(GLOBE_PROJECTION.type).toBe('globe');
	});
});

describe('coveredCountriesFilter', () => {
	it('matches only countries that have a guide', () => {
		expect(coveredCountriesFilter(guides)).toEqual(['in', ['get', 'ADM0_A3'], ['literal', ['GBR']]]);
	});

	it('matches nothing when there are no guides', () => {
		expect(coveredCountriesFilter({})).toEqual(['in', ['get', 'ADM0_A3'], ['literal', []]]);
	});
});

describe('guideForFeature', () => {
	it('works with any kind of guide entry, not only URLs', () => {
		const entry = { name: 'United Kingdom' };
		expect(guideForFeature({ properties: { ADM0_A3: 'GBR' } }, { GBR: entry })).toBe(entry);
	});

	it('returns the guide URL for a covered country', () => {
		expect(guideForFeature({ properties: { ADM0_A3: 'GBR' } }, guides)).toBe('/countries/united-kingdom/');
	});

	it.each([
		['an uncovered country', { properties: { ADM0_A3: 'FRA' } }],
		['a feature without ADM0_A3', { properties: {} }],
		['a feature without properties', {}],
		['no feature', undefined],
		['a non-string code', { properties: { ADM0_A3: 42 } }],
	])('returns undefined for %s', (_, feature) => {
		expect(guideForFeature(feature, guides)).toBeUndefined();
	});
});

const colors = {
	ocean: '#000001',
	land: '#000002',
	landBorder: '#000003',
	text: '#000008',
	textMuted: '#000004',
	accent: '#000005',
	night: '#000006',
};

describe('readMapColors', () => {
	it('reads each color from its CSS token, trimmed', () => {
		const read = (name: string) => ` ${name}-value `;
		const result = readMapColors(read);
		for (const [key, token] of Object.entries(MAP_COLOR_TOKENS)) {
			expect(result[key as keyof typeof result]).toBe(`${token}-value`);
		}
	});

	it('throws naming the token when one is missing', () => {
		expect(() => readMapColors((name) => (name === '--color-night' ? '' : '#fff'))).toThrow('--color-night');
	});
});



describe('initialZoom', () => {
	it('fits the whole globe on a phone in portrait', () => {
		const zoom = initialZoom(375, 600);
		const globePx = (512 / Math.PI) * 2 ** zoom;
		expect(globePx).toBeLessThanOrEqual(375);
		expect(globePx).toBeGreaterThan(375 * 0.8);
	});

	it('is limited by the shorter side, so a phone in landscape fits by height', () => {
		expect(initialZoom(812, 300)).toBe(initialZoom(300, 812));
	});

	it('zooms in further on bigger screens', () => {
		expect(initialZoom(1440, 800)).toBeGreaterThan(initialZoom(375, 600));
	});

	it('stays within sensible bounds', () => {
		expect(initialZoom(10, 10)).toBe(0.5);
		expect(initialZoom(10000, 10000)).toBe(3);
	});
});

describe('tapBox', () => {
	it('is a square centered on the tap', () => {
		expect(tapBox({ x: 100, y: 200 }, 10)).toEqual([
			[90, 190],
			[110, 210],
		]);
	});

	it('uses a finger-sized default radius', () => {
		const [[x0], [x1]] = tapBox({ x: 100, y: 100 });
		expect(x1 - x0).toBeGreaterThanOrEqual(24);
	});
});
