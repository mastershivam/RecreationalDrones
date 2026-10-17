import { describe, expect, it } from 'vitest';
import { mainlandBounds } from './country-bounds';

const square = (x: number, y: number, size: number) => [
	[x, y],
	[x + size, y],
	[x + size, y + size],
	[x, y + size],
	[x, y],
];

describe('mainlandBounds', () => {
	it('boxes a single polygon', () => {
		const out = mainlandBounds([{ properties: { ADM0_A3: 'AAA' }, geometry: { type: 'Polygon', coordinates: [square(10, 20, 4)] } }], ['AAA']);
		expect(out.AAA).toEqual([10, 20, 14, 24]);
	});

	it('uses the largest polygon, so far-off territories do not pull the camera away', () => {
		const out = mainlandBounds(
			[{ properties: { ADM0_A3: 'USA' }, geometry: { type: 'MultiPolygon', coordinates: [[square(-160, 19, 2)], [square(-120, 30, 40)], [square(-70, 18, 1)]] } }],
			['USA'],
		);
		expect(out.USA).toEqual([-120, 30, -80, 70]);
	});

	it('skips countries that were not asked for or have no shape', () => {
		const out = mainlandBounds(
			[
				{ properties: { ADM0_A3: 'AAA' }, geometry: { type: 'Polygon', coordinates: [square(0, 0, 1)] } },
				{ properties: { ADM0_A3: 'BBB' }, geometry: null },
			],
			['BBB'],
		);
		expect(out).toEqual({});
	});
});
