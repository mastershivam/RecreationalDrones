import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { highlightedAt, isOutsideRequest, openGlobe, renderedCount } from './helpers';

test.describe('globe', () => {
	test('draws the basemap itself, not only the overlays', async ({ page }) => {
		// Regression: in production the tile file was sent whole instead of by byte range, so no basemap
		// loaded and the globe showed only the UK highlight and night shading on an empty sphere.
		await openGlobe(page);
		expect(await renderedCount(page, ['earth'])).toBeGreaterThan(0);
		expect(await renderedCount(page, ['boundaries_country'])).toBeGreaterThan(0);
		expect(await renderedCount(page, ['places_country'])).toBeGreaterThan(0);
	});

	test('highlights countries that have a guide, and only those', async ({ page }) => {
		await openGlobe(page);
		await expect.poll(() => highlightedAt(page, [-2, 54])).toContain('GBR'); // United Kingdom
		expect(await highlightedAt(page, [0, -80])).toEqual([]); // Antarctica has no guide (a country that might get one would break this test)
	});

	test('has night shading', async ({ page }) => {
		await openGlobe(page);
		const night = await page.evaluate(() => {
			const map = (window as any).__map;
			return { layer: !!map.getLayer('night-fill'), source: !!map.getSource('night') };
		});
		expect(night).toEqual({ layer: true, source: true });
	});

	test('credits OpenStreetMap and Protomaps', async ({ page }) => {
		await openGlobe(page);
		const credit = page.locator('.maplibregl-ctrl-attrib');
		await expect(credit).toContainText('Protomaps');
		await expect(credit).toContainText('OpenStreetMap');
	});

	test('loads without failed requests or console errors', async ({ page }) => {
		const problems: string[] = [];
		page.on('response', (r) => r.status() >= 400 && problems.push(`${r.status()} ${r.url()}`));
		// The analytics beacon reports to Cloudflare, which refuses a test address that is not a registered site.
		// Chrome words that as a console error, so ignore errors that come from the analytics address.
		const fromAnalytics = (m: import('@playwright/test').ConsoleMessage) => (m.text() + m.location().url).includes('cloudflareinsights');
		page.on('console', (m) => m.type() === 'error' && !fromAnalytics(m) && problems.push(`console: ${m.text()}`));
		page.on('pageerror', (e) => problems.push(`page error: ${e.message}`));
		await openGlobe(page);
		expect(problems).toEqual([]);
	});

	test('makes no third-party requests, apart from the Cloudflare analytics beacon', async ({ page, baseURL }) => {
		const outside: string[] = [];
		page.on('request', (r) => isOutsideRequest(r.url(), new URL(baseURL!).origin) && outside.push(r.url()));
		await openGlobe(page);
		expect(outside).toEqual([]);
	});
});

test.describe('map files', () => {
	const TILES = '/tiles/basemap.pmtiles';

	test('serves a byte range of the basemap file, and only that range', async ({ request }) => {
		// Regression: Workers static assets ignored the Range header and sent the whole file, which blanked the globe.
		// The Worker now answers ranges itself, out of R2.
		const size = Number((await request.head(TILES)).headers()['content-length']);
		expect(size).toBeGreaterThan(1_000_000);

		const response = await request.get(TILES, { headers: { Range: 'bytes=0-1023' } });
		expect(response.status()).toBe(206);
		expect(response.headers()['content-range']).toBe(`bytes 0-1023/${size}`);
		expect(response.headers()['accept-ranges']).toBe('bytes');
		const body = await response.body();
		expect(body.length).toBe(1024);
		expect(body.subarray(0, 7).toString()).toBe('PMTiles'); // the file's own header
	});

	test('serves ranges from the middle and the end of the file', async ({ request }) => {
		const size = Number((await request.head(TILES)).headers()['content-length']);
		const middle = await request.get(TILES, { headers: { Range: 'bytes=5000-5099' } });
		expect(middle.status()).toBe(206);
		expect((await middle.body()).length).toBe(100);

		const end = await request.get(TILES, { headers: { Range: 'bytes=-100' } });
		expect(end.status()).toBe(206);
		expect(end.headers()['content-range']).toBe(`bytes ${size - 100}-${size - 1}/${size}`);
		expect((await end.body()).length).toBe(100);
	});

	test('answers HEAD with the file size and no body', async ({ request }) => {
		const response = await request.head(TILES);
		expect(response.status()).toBe(200);
		expect(Number(response.headers()['content-length'])).toBeGreaterThan(1_000_000);
		expect((await response.body()).length).toBe(0);
	});

	test('refuses a range that starts past the end of the file', async ({ request }) => {
		const size = Number((await request.head(TILES)).headers()['content-length']);
		const response = await request.get(TILES, { headers: { Range: `bytes=${size + 1000}-${size + 2000}` } });
		expect(response.status()).toBe(416);
		expect(response.headers()['content-range']).toBe(`bytes */${size}`);
	});

	test('serves nothing else under /tiles/, and only reads', async ({ request }) => {
		expect((await request.get('/tiles/0/0/0.mvt')).status()).toBe(404);
		expect((await request.get('/tiles/')).status()).toBe(404);
		expect((await request.post(TILES)).status()).toBe(405);
	});

	test('does not ship the tile file as a static asset', async ({ request }) => {
		// The file is served from R2 by the Worker, so it must not also be uploaded with the site.
		expect(existsSync(join(import.meta.dirname, '../dist/tiles'))).toBe(false);
		expect((await request.get('/data/basemap.pmtiles')).status()).toBe(404);
	});

	test('serves the country shapes and the label fonts', async ({ request }) => {
		expect((await request.get('/data/countries.geojson')).ok()).toBe(true);
		expect((await request.get('/fonts/Noto%20Sans%20Regular/0-255.pbf')).ok()).toBe(true);
	});
});
