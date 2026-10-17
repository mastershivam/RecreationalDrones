import { describe, expect, it } from 'vitest';
import { outline } from './outline';

const square = (w: number, s: number, e: number, n: number) => [[[w, s], [e, s], [e, n], [w, n], [w, s]]];
const feature = (iso3: string, polygons: number[][][][]) => ({ properties: { ADM0_A3: iso3 }, geometry: { type: 'MultiPolygon' as const, coordinates: polygons } });

describe('outline', () => {
	it('draws a path as wide as asked, with a height that keeps the shape', () => {
		const o = outline([feature('AAA', [square(0, 0, 10, 10)])], 'AAA', 100)!;
		expect(o.width).toBe(100);
		expect(o.height).toBeGreaterThan(95);
		expect(o.height).toBeLessThan(105);
		expect(o.d.startsWith('M')).toBe(true);
		expect(o.d.endsWith('Z')).toBe(true);
	});
	it('keeps a near island and drops a far one', () => {
		const near = outline([feature('AAA', [square(0, 0, 10, 10), square(11, 0, 12, 1)])], 'AAA')!;
		const far = outline([feature('AAA', [square(0, 0, 10, 10), square(100, 0, 101, 1)])], 'AAA')!;
		expect(near.d.split('Z').length - 1).toBe(2);
		expect(far.d.split('Z').length - 1).toBe(1);
	});
	it('returns nothing for an unknown country', () => {
		expect(outline([], 'AAA')).toBeUndefined();
	});
});
