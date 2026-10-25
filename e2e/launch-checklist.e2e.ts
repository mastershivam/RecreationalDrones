import { expect, test } from '@playwright/test';
import { isOutsideRequest, GUIDE_COUNT } from './helpers';

// A page-by-page check of what makes the site a real one: titles, descriptions, sharing, icons, crawlers, no
// cookies, alt text, the register button, and speed on a slow phone connection.

async function sitemapPaths(request: import('@playwright/test').APIRequestContext) {
	const xml = await (await request.get('/sitemap.xml')).text();
	return [...xml.matchAll(/<loc>https?:\/\/[^/]+(\/[^<]*)<\/loc>/g)].map((m) => m[1]);
}

test.describe('every page has its own title, description and sharing tags', () => {
	test('across the whole sitemap', async ({ request }) => {
		const paths = await sitemapPaths(request);
		expect(paths.length).toBeGreaterThan(35);
		const titles = new Set<string>();
		const descriptions = new Set<string>();
		for (const path of paths) {
			const html = await (await request.get(path)).text();
			const get = (re: RegExp) => html.match(re)?.[1] ?? '';
			const title = get(/<title>([^<]+)<\/title>/);
			const description = get(/<meta name="description" content="([^"]*)"/);
			expect(title.length, `${path} title`).toBeGreaterThan(5);
			expect(title.length, `${path} title`).toBeLessThanOrEqual(75);
			expect(description.length, `${path} description`).toBeGreaterThan(40);
			expect(description.length, `${path} description`).toBeLessThanOrEqual(160);
			expect(get(/<link rel="canonical" href="([^"]+)"/), path).toMatch(new RegExp(`^https://[^/]+${path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`));
			expect(get(/<meta property="og:title" content="([^"]*)"/), path).toBe(title);
			expect(get(/<meta property="og:description" content="([^"]*)"/), path).toBe(description);
			expect(get(/<meta property="og:image" content="([^"]*)"/), path).toMatch(/\/og(-image|\/[a-z-]+)\.png$/);
			expect(get(/<meta name="twitter:card" content="([^"]*)"/), path).toBe('summary_large_image');
			expect(html, path).toContain('lang="en"');
			titles.add(title);
			descriptions.add(description);
		}
		expect(titles.size, 'titles are unique').toBe(paths.length);
		expect(descriptions.size, 'descriptions are unique').toBe(paths.length);
	});

	test('the social image and every icon exist, with the right sizes', async ({ request }) => {
		for (const [path, type] of [
			['/og-image.png', 'image/png'],
			['/favicon.svg', 'image/svg+xml'],
			['/favicon.ico', 'image'],
			['/favicon-32.png', 'image/png'],
			['/apple-touch-icon.png', 'image/png'],
			['/icon-192.png', 'image/png'],
			['/icon-512.png', 'image/png'],
		]) {
			const response = await request.get(path);
			expect(response.status(), path).toBe(200);
			expect(response.headers()['content-type'], path).toContain(type);
		}
		const png = await (await request.get('/og-image.png')).body();
		expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1200, 630]);
		const manifest = await (await request.get('/site.webmanifest')).json();
		expect(manifest.icons.map((i: { sizes: string }) => i.sizes)).toEqual(['192x192', '512x512']);
	});

	test('the 404 page stays out of search results', async ({ request }) => {
		const html = await (await request.get('/no-such-page/')).text();
		expect(html).toContain('<meta name="robots" content="noindex"');
	});
});

test.describe('crawlers', () => {
	test('robots.txt allows the site, keeps crawlers off the tiles, and names the sitemap', async ({ request }) => {
		const response = await request.get('/robots.txt');
		expect(response.status()).toBe(200);
		expect(response.headers()['content-type']).toContain('text/plain');
		const text = await response.text();
		expect(text).toContain('Disallow: /tiles/');
		expect(text).toMatch(/Sitemap: https:\/\/[^/]+\/sitemap\.xml/);
	});

	test('sitemap.xml lists every guide, the map, the countries page, privacy and contact', async ({ request }) => {
		const response = await request.get('/sitemap.xml');
		expect(response.status()).toBe(200);
		expect(response.headers()['content-type']).toContain('xml');
		const paths = await sitemapPaths(request);
		for (const path of ['/', '/countries/', '/countries/japan/', '/countries/germany/', '/privacy/', '/contact/']) expect(paths).toContain(path);
		expect(paths).not.toContain('/404.html');
		expect(paths.filter((p) => p.startsWith('/countries/') && p !== '/countries/')).toHaveLength(GUIDE_COUNT);
	});

	test('every page in the sitemap exists', async ({ request }) => {
		for (const path of await sitemapPaths(request)) expect((await request.get(path)).status(), path).toBe(200);
	});
});

test.describe('trust pages', () => {
	test('privacy says what is and is not collected, and is linked from every page', async ({ page }) => {
		await page.goto('/countries/japan/');
		await page.getByRole('contentinfo').getByRole('link', { name: 'Privacy' }).click();
		await expect(page).toHaveURL(/\/privacy\/$/);
		await expect(page.getByRole('heading', { level: 1 })).toHaveText('Privacy');
		await expect(page.getByText('no cookies', { exact: false }).first()).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Your location' })).toBeVisible();
		await expect(page.getByRole('link', { name: /Cloudflare's privacy policy/ })).toHaveAttribute('href', /cloudflare\.com/);
	});

	test('contact gives a real way to reach us, and a report link for every country', async ({ page }) => {
		await page.goto('/contact/');
		await expect(page.getByRole('link', { name: 'issue tracker on GitHub' })).toHaveAttribute('href', /github\.com\/.+\/issues$/);
		await expect(page.locator('.reports li a')).toHaveCount(GUIDE_COUNT);
		await expect(page.getByRole('link', { name: 'Japan', exact: true })).toHaveAttribute('href', /issues\/new\?title=Mistake\+in\+the\+Japan\+guide/);
		await expect(page.getByRole('contentinfo').getByRole('link', { name: 'Contact' })).toHaveAttribute('aria-current', 'page');
	});

	test('a guide has a report-a-mistake link that names the country', async ({ page }) => {
		await page.goto('/countries/canada/');
		const link = page.getByRole('link', { name: 'Report a mistake in this guide' });
		await expect(link).toHaveAttribute('href', /issues\/new\?title=Mistake\+in\+the\+Canada\+guide/);
	});
});

test.describe('no cookies, no storage, no trackers', () => {
	for (const path of ['/', '/countries/', '/countries/japan/', '/privacy/']) {
		test(`${path} sets no cookies, stores nothing and loads nothing from other sites but the analytics beacon`, async ({ page, context }) => {
			const outside: string[] = [];
			const origin = new URL(test.info().project.use.baseURL!).origin;
			page.on('request', (r) => {
				if (isOutsideRequest(r.url(), origin)) outside.push(r.url());
			});
			await page.goto(path === '/' ? '/?e2e' : path);
			if (path === '/') await expect(page.locator('#map[data-ready="true"]')).toBeAttached({ timeout: 30_000 });
			expect(await context.cookies()).toEqual([]);
			expect(await page.evaluate(() => ({ cookie: document.cookie, local: localStorage.length, session: sessionStorage.length }))).toEqual({ cookie: '', local: 0, session: 0 });
			expect(outside).toEqual([]);
		});
	}
});

test.describe('images', () => {
	test('every image on every page has alt text, and the decorative canvases are hidden from readers', async ({ page, request }) => {
		for (const path of await sitemapPaths(request)) {
			await page.goto(path);
			const bad = await page.evaluate(() => [...document.querySelectorAll('img')].filter((i) => i.getAttribute('alt') === null).map((i) => i.src));
			expect(bad, path).toEqual([]);
			const canvases = await page.evaluate(() => [...document.querySelectorAll('canvas')].filter((c) => c.getAttribute('aria-hidden') !== 'true' && !c.classList.contains('maplibregl-canvas')).length);
			expect(canvases, path).toBe(0);
		}
	});
});

test.describe('the register button', () => {
	test('is the first thing to do on a guide, above the fold, and goes to the official page', async ({ page }) => {
		await page.goto('/countries/united-states/');
		const button = page.locator('.cta .button');
		await expect(button).toHaveText('Register online');
		await expect(button).toHaveAttribute('href', 'https://faadronezone-access.faa.gov/');
		await expect(button).toBeInViewport();
		const box = (await button.boundingBox())!;
		expect(box.height).toBeGreaterThanOrEqual(44);
		expect(box.y + box.height).toBeLessThan(page.viewportSize()!.height);
	});

	test('goes to the official source when we have no registration page for the country', async ({ page }) => {
		await page.goto('/countries/nepal/');
		const button = page.locator('.cta .button');
		await expect(button).toHaveText('Go to the official source');
		await expect(button).toHaveAttribute('href', 'https://caanepal.gov.np/');
	});

	test('stays at the bottom of a phone screen while you read, and is not shown on a desktop', async ({ page }) => {
		await page.goto('/countries/japan/');
		const bar = page.locator('.cta-bar .button');
		if (test.info().project.name === 'mobile') {
			await page.evaluate(() => window.scrollTo(0, 900));
			await expect(bar).toBeInViewport();
			const box = (await bar.boundingBox())!;
			expect(box.y + box.height).toBeLessThanOrEqual(page.viewportSize()!.height);
			await expect(bar).toHaveAttribute('href', 'https://www.mlit.go.jp/koku/drone/en/');
		} else {
			await expect(bar).toBeHidden();
		}
	});
});

test.describe('speed on a slow phone connection', () => {
	test.skip(({ browserName }) => browserName !== 'chromium', 'uses Chrome network throttling');

	// About Lighthouse's mobile profile: 1.6 Mbps down, 150 ms round trip.
	async function throttled(page: import('@playwright/test').Page, context: import('@playwright/test').BrowserContext) {
		const cdp = await context.newCDPSession(page);
		await cdp.send('Network.enable');
		await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 });
		return cdp;
	}
	const firstPaint = (page: import('@playwright/test').Page) =>
		page.evaluate(() => performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? Infinity);

	for (const path of ['/countries/', '/countries/japan/', '/privacy/']) {
		test(`${path} paints in under 2 seconds and is small`, async ({ page, context }) => {
			const cdp = await throttled(page, context);
			// Bytes on the wire (compressed), as a phone on a slow connection downloads them, not the size once unpacked.
			let bytes = 0;
			cdp.on('Network.loadingFinished', (e) => (bytes += e.encodedDataLength));
			await page.goto(path, { waitUntil: 'load' });
			await expect.poll(() => firstPaint(page)).toBeLessThan(2000);
			expect(bytes / 1024, 'KB downloaded').toBeLessThan(120);
		});
	}

	test('the map page shows its search box and intro in under 2 seconds, before the globe has finished', async ({ page, context }) => {
		await throttled(page, context);
		await page.goto('/', { waitUntil: 'commit' });
		await expect(page.getByRole('combobox', { name: 'Search for a country' })).toBeVisible({ timeout: 2000 });
		await expect.poll(() => firstPaint(page)).toBeLessThan(2000);
	});
});
