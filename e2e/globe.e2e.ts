import { expect, test } from '@playwright/test';
import { highlightedAt, openGlobe, renderedCount } from './helpers';

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
		expect(await highlightedAt(page, [2, 47])).toEqual([]); // France has no guide yet
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
		page.on('console', (m) => m.type() === 'error' && problems.push(`console: ${m.text()}`));
		page.on('pageerror', (e) => problems.push(`page error: ${e.message}`));
		await openGlobe(page);
		expect(problems).toEqual([]);
	});

	test('makes no third-party requests', async ({ page, baseURL }) => {
		const outside: string[] = [];
		page.on('request', (r) => {
			const url = new URL(r.url());
			if (!['data:', 'blob:'].includes(url.protocol) && url.origin !== new URL(baseURL!).origin) outside.push(r.url());
		});
		await openGlobe(page);
		expect(outside).toEqual([]);
	});
});

test.describe('map files', () => {
	test('serves tiles as plain files with a vector tile content type', async ({ request }) => {
		const response = await request.get('/tiles/0/0/0.mvt');
		expect(response.status()).toBe(200);
		expect(response.headers()['content-type']).toContain('vector-tile');
		expect((await response.body()).length).toBeGreaterThan(1000);
	});

	test('does not need range requests for tiles', async ({ request }) => {
		// Regression: Workers static assets ignore the Range header, which broke the .pmtiles archive.
		const response = await request.get('/tiles/2/1/1.mvt', { headers: { Range: 'bytes=0-99' } });
		expect(response.ok()).toBe(true);
		expect((await response.body()).length).toBeGreaterThan(100);
	});

	test('does not deploy the 15 MB source archive', async ({ request }) => {
		expect((await request.get('/tiles/basemap.pmtiles')).status()).toBe(404);
		expect((await request.get('/data/basemap.pmtiles')).status()).toBe(404);
	});

	test('serves the country shapes and the label fonts', async ({ request }) => {
		expect((await request.get('/data/countries.geojson')).ok()).toBe(true);
		expect((await request.get('/fonts/Noto%20Sans%20Regular/0-255.pbf')).ok()).toBe(true);
	});
});
