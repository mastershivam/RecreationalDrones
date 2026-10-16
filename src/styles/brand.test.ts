import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = join(import.meta.dirname, '../..');
const read = (path: string) => readFileSync(join(root, path), 'utf8');

const tokens = read('src/styles/tokens.css');
const token = (name: string) => tokens.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`))![1].toLowerCase();
// Every colour a logo may use, taken from the design tokens so the logo can't drift from the site's palette.
const palette = new Set(
	['color-bg', 'color-ocean', 'color-land', 'color-land-border', 'color-night', 'color-accent', 'color-text'].map(token),
);

const logos = {
	'brand/logo-mark.svg': { maxBytes: 20_000 },
	'brand/favicon.svg': { maxBytes: 8_000 },
	'brand/logo-lockup.svg': { maxBytes: 20_000 },
	'brand/logo-mark-mono.svg': { maxBytes: 20_000 },
};
const colours = (svg: string) => (svg.match(/#[0-9a-fA-F]{6}\b/g) ?? []).map((c) => c.toLowerCase());
const count = (svg: string, text: string) => svg.split(text).length - 1;

describe.each(Object.entries(logos))('%s', (path, { maxBytes }) => {
	const svg = read(path);

	it('is a complete SVG with a viewBox', () => {
		expect(svg.trim().startsWith('<svg')).toBe(true);
		expect(svg.trim().endsWith('</svg>')).toBe(true);
		expect(svg).toContain('viewBox=');
		expect(count(svg, '<g')).toBe(count(svg, '</g>'));
	});

	it('has an accessible name', () => {
		expect(svg).toContain('role="img"');
		expect(svg).toMatch(/aria-label="[^"]+"/);
	});

	it('stays small, so regenerating it with too much detail fails here', () => {
		expect(Buffer.byteLength(svg)).toBeLessThanOrEqual(maxBytes);
	});

	it('contains no scripts and no external links', () => {
		expect(svg).not.toMatch(/<script|href=|xlink:|<image|url\(http/i);
	});
});

describe('logo colours', () => {
	it.each(Object.keys(logos).filter((p) => !p.includes('mono')))('%s uses only palette colours', (path) => {
		const unknown = colours(read(path)).filter((c) => !palette.has(c));
		expect(unknown).toEqual([]);
	});

	it('the one-colour logo takes its colour from the page, with no fixed colours', () => {
		const mono = read('brand/logo-mark-mono.svg');
		expect(colours(mono)).toEqual([]);
		expect(mono).toContain('currentColor');
	});

	it('amber is used only for the drone, because amber means "we have data here, you can act"', () => {
		const mark = read('brand/logo-mark.svg');
		const amber = token('color-accent');
		const droneGroup = mark.match(/<g transform="translate\([^"]*\) rotate\([^"]*\)"[^>]*>[\s\S]*?<\/g><circle[^>]*\/>[\s\S]*?<\/g>/)![0];
		expect(count(mark.toLowerCase(), amber)).toBe(count(droneGroup.toLowerCase(), amber));
	});
});

describe('the drone', () => {
	it.each(['brand/logo-mark.svg', 'brand/favicon.svg', 'brand/logo-lockup.svg', 'brand/logo-mark-mono.svg'])(
		'%s has four rotors, a body and a camera, tilted',
		(path) => {
			const svg = read(path);
			const drone = svg.match(/<g transform="translate\([^"]*\) rotate\(([-\d.]+)\)"[\s\S]*?<\/g><circle r=[\s\S]*?<\/g>/)!;
			expect(drone, 'drone group not found').toBeTruthy();
			expect(count(drone[0], '<circle cx=')).toBe(4); // rotors
			expect(count(drone[0], '<circle r=')).toBe(1); // body
			expect(count(drone[0], '<rect')).toBe(1); // camera
			const tilt = Number(drone[1]);
			expect(Math.abs(tilt)).toBeGreaterThan(0);
			expect(Math.abs(tilt)).toBeLessThanOrEqual(30); // slight, so it stays readable
		},
	);
});

// Where on Earth a point of the 64-unit logo is: the inverse of the orthographic projection the logo is drawn with
// (globe centred on 12°E, 28°N, radius 26 around (32, 32)).
function lonLatAt(px: number, py: number, { cx = 32, cy = 32, r = 26 } = {}) {
	const [lon0, lat0] = [(12 * Math.PI) / 180, (28 * Math.PI) / 180];
	const x = (px - cx) / r;
	const y = (cy - py) / r;
	const rho = Math.hypot(x, y);
	const c = Math.asin(rho);
	const lat = Math.asin(Math.cos(c) * Math.sin(lat0) + (y * Math.sin(c) * Math.cos(lat0)) / rho);
	const lon = lon0 + Math.atan2(x * Math.sin(c), rho * Math.cos(lat0) * Math.cos(c) - y * Math.sin(lat0) * Math.sin(c));
	return { lon: (lon * 180) / Math.PI, lat: (lat * 180) / Math.PI };
}
const droneCentre = (svg: string) => {
	const [, x, y] = svg.match(/<g transform="translate\(([-\d.]+) ([-\d.]+)\) rotate/)!;
	return { x: Number(x), y: Number(y) };
};

describe('where the drone is', () => {
	it('the inverse projection finds a known place (the middle of the globe is 12°E, 28°N)', () => {
		const { lon, lat } = lonLatAt(32, 32.0001);
		expect(lon).toBeCloseTo(12, 0);
		expect(lat).toBeCloseTo(28, 0);
	});

	it.each([
		['brand/logo-mark.svg', {}],
		['brand/logo-lockup.svg', {}],
		['brand/logo-mark-mono.svg', {}],
		['brand/favicon.svg', { r: 22 }],
	])('%s: the drone hovers over the Atlantic Ocean, not over land or the Middle East', (path, geometry) => {
		const { x, y } = droneCentre(read(path));
		const { lon, lat } = lonLatAt(x, y, geometry);
		// Open water west of Europe and Africa: no mainland coast or large island lies inside this box.
		expect(lon).toBeGreaterThan(-45);
		expect(lon).toBeLessThan(-12);
		expect(lat).toBeGreaterThan(25);
		expect(lat).toBeLessThan(50);
	});

	it('the drone body is outlined in the sea colour, since it floats over water', () => {
		expect(read('brand/logo-mark.svg')).toContain(`<circle r="2.2" stroke="${token('color-ocean')}"`);
	});
});

describe('the globe', () => {
	it('has real land shapes, not just a plain circle', () => {
		const mark = read('brand/logo-mark.svg');
		const land = mark.match(/<path d="(M[^"]+)" fill="#3f5f94"/i)![1];
		expect(count(land, 'M')).toBeGreaterThan(20); // many separate pieces of land
		expect(land.length).toBeGreaterThan(3000);
	});

	it('shows night as a crescent on the left, like the globe on the site', () => {
		expect(read('brand/logo-mark.svg')).toContain(`fill="${token('color-night')}" opacity="0.55"`);
	});

	it('the lockup uses the same mark as the logo file', () => {
		const mark = read('brand/logo-mark.svg').match(/<path d="(M[^"]+)" fill="#3f5f94"/i)![1];
		expect(read('brand/logo-lockup.svg')).toContain(mark);
	});

	it('the lockup spells the product name', () => {
		expect(read('brand/logo-lockup.svg')).toContain('>Flyable</text>');
	});
});
