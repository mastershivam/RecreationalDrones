import { describe, expect, it } from 'vitest';
import { nightGeoJSON, subsolarPoint } from './daynight';

const RAD = Math.PI / 180;

// Angle in degrees between two lon/lat points on the sphere.
function angleBetween(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
	const cos =
		Math.sin(a.lat * RAD) * Math.sin(b.lat * RAD) +
		Math.cos(a.lat * RAD) * Math.cos(b.lat * RAD) * Math.cos((a.lon - b.lon) * RAD);
	return Math.acos(Math.min(1, Math.max(-1, cos))) / RAD;
}

describe('subsolarPoint', () => {
	it('is near the Tropic of Cancer at the June solstice', () => {
		expect(subsolarPoint(new Date('2026-06-21T12:00:00Z')).lat).toBeCloseTo(23.4, 0);
	});

	it('is near the Tropic of Capricorn at the December solstice', () => {
		expect(subsolarPoint(new Date('2026-12-21T12:00:00Z')).lat).toBeCloseTo(-23.4, 0);
	});

	it('is near the equator at the March equinox', () => {
		expect(Math.abs(subsolarPoint(new Date('2026-03-20T12:00:00Z')).lat)).toBeLessThan(1);
	});

	it('is close to the prime meridian at noon UTC', () => {
		for (const day of ['2026-03-20', '2026-06-21', '2026-09-22', '2026-12-21']) {
			expect(Math.abs(subsolarPoint(new Date(`${day}T12:00:00Z`)).lon)).toBeLessThan(5);
		}
	});

	it('moves west by 15 degrees each hour', () => {
		const a = subsolarPoint(new Date('2026-06-21T12:00:00Z')).lon;
		const b = subsolarPoint(new Date('2026-06-21T13:00:00Z')).lon;
		expect(a - b).toBeCloseTo(15, 0);
	});

	it('keeps longitude within -180 to 180', () => {
		for (let h = 0; h < 24; h++) {
			const { lon } = subsolarPoint(new Date(Date.UTC(2026, 5, 21, h)));
			expect(lon).toBeGreaterThanOrEqual(-180);
			expect(lon).toBeLessThanOrEqual(180);
		}
	});
});

describe('nightGeoJSON', () => {
	const dates = ['2026-03-20T12:00:00Z', '2026-06-21T03:30:00Z', '2026-12-21T18:45:00Z'].map((d) => new Date(d));

	it.each(dates)('puts every day/night line point 90 degrees from the sun (%s)', (date) => {
		const sun = subsolarPoint(date);
		const line = nightGeoJSON(date).features.find((f) => f.properties.kind === 'terminator')!;
		for (const [lon, lat] of line.geometry.coordinates as [number, number][]) {
			expect(angleBetween({ lon, lat }, sun)).toBeCloseTo(90, 3);
		}
	});

	it.each(dates)('closes the polygon ring (%s)', (date) => {
		const ring = (nightGeoJSON(date).features[0].geometry.coordinates as [number, number][][])[0];
		expect(ring[0]).toEqual(ring[ring.length - 1]);
	});

	it('includes the south pole in the night when the sun is north of the equator', () => {
		const date = new Date('2026-06-21T12:00:00Z');
		const ring = (nightGeoJSON(date).features[0].geometry.coordinates as [number, number][][])[0];
		expect(ring).toContainEqual([180, -90]);
	});

	it('includes the north pole in the night when the sun is south of the equator', () => {
		const date = new Date('2026-12-21T12:00:00Z');
		const ring = (nightGeoJSON(date).features[0].geometry.coordinates as [number, number][][])[0];
		expect(ring).toContainEqual([180, 90]);
	});

	it('spans the full longitude range with the requested step', () => {
		const line = nightGeoJSON(dates[0], 10).features[1].geometry.coordinates as [number, number][];
		expect(line[0][0]).toBe(-180);
		expect(line[line.length - 1][0]).toBe(180);
		expect(line).toHaveLength(37);
	});

	it('stays finite at an exact equinox, where the sun is on the equator', () => {
		// 2026-03-20T14:46Z is the equinox; the terminator is then a pair of meridians.
		const line = nightGeoJSON(new Date('2026-03-20T14:46:00Z')).features[1].geometry.coordinates as [number, number][];
		for (const [, lat] of line) expect(Number.isFinite(lat)).toBe(true);
	});
});
