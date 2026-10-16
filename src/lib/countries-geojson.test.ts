import { describe, expect, it } from 'vitest';
import { trimCountries } from './countries-geojson';

const square = (x: number, y: number, size = 1) => [
	[x, y],
	[x + size, y],
	[x + size, y + size],
	[x, y + size],
	[x, y],
];

const feature = (props: Record<string, unknown>, geometry: any) => ({ type: 'Feature' as const, properties: props, geometry });
const collection = (...features: any[]) => ({ type: 'FeatureCollection' as const, features });

describe('trimCountries', () => {
	it('keeps only ADM0_A3 and NAME', () => {
		const out = trimCountries(
			collection(feature({ ADM0_A3: 'GBR', NAME: 'United Kingdom', POP_EST: 1, ISO_A3: 'GBR' }, { type: 'Polygon', coordinates: [square(0, 0)] })),
		);
		expect(out.features[0].properties).toEqual({ ADM0_A3: 'GBR', NAME: 'United Kingdom' });
	});

	it('turns polygons into multipolygons so the map reads one shape', () => {
		const out = trimCountries(collection(feature({ ADM0_A3: 'AAA' }, { type: 'Polygon', coordinates: [square(0, 0)] })));
		expect(out.features[0].geometry?.type).toBe('MultiPolygon');
	});

	it('rounds coordinates to the requested decimals', () => {
		const ring = [[0.123456, 0.987654], [1.111111, 0.987654], [1.111111, 1.555555], [0.123456, 1.555555], [0.123456, 0.987654]];
		const out = trimCountries(collection(feature({}, { type: 'Polygon', coordinates: [ring] })), 2);
		expect((out.features[0].geometry as any).coordinates[0][0]).toEqual([[0.12, 0.99], [1.11, 0.99], [1.11, 1.56], [0.12, 1.56], [0.12, 0.99]]);
	});

	it('drops points that collapse onto their neighbour after rounding', () => {
		const ring = [[0, 0], [0.001, 0.001], [1, 0], [1, 1], [0, 1], [0, 0]];
		const out = trimCountries(collection(feature({}, { type: 'Polygon', coordinates: [ring] })), 2);
		expect((out.features[0].geometry as any).coordinates[0][0]).toHaveLength(5);
	});

	it('removes tiny islands that disappear when rounded, but keeps the rest of the country', () => {
		const tiny = [[5, 5], [5.001, 5], [5.001, 5.001], [5, 5.001], [5, 5]];
		const out = trimCountries(
			collection(feature({ ADM0_A3: 'ISL' }, { type: 'MultiPolygon', coordinates: [[square(0, 0)], [tiny]] })),
			2,
		);
		expect((out.features[0].geometry as any).coordinates).toHaveLength(1);
	});

	it('removes countries with no geometry or nothing left after rounding', () => {
		const tiny = [[5, 5], [5.001, 5], [5.001, 5.001], [5, 5.001], [5, 5]];
		const out = trimCountries(
			collection(
				feature({ ADM0_A3: 'NUL' }, null),
				feature({ ADM0_A3: 'TNY' }, { type: 'Polygon', coordinates: [tiny] }),
				feature({ ADM0_A3: 'OKK' }, { type: 'Polygon', coordinates: [square(0, 0)] }),
			),
			2,
		);
		expect(out.features.map((f) => f.properties.ADM0_A3)).toEqual(['OKK']);
	});

	it('drops holes that collapse but keeps holes that survive', () => {
		const tinyHole = [[0.5, 0.5], [0.501, 0.5], [0.501, 0.501], [0.5, 0.501], [0.5, 0.5]];
		const hole = square(2, 2, 0.5);
		const out = trimCountries(
			collection(feature({}, { type: 'Polygon', coordinates: [square(0, 0, 5), tinyHole, hole] })),
			2,
		);
		expect((out.features[0].geometry as any).coordinates[0]).toHaveLength(2);
	});
});
