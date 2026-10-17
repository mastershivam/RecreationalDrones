import { expect, test } from '@playwright/test';

// The header, skip link, sharing tags and 404 page that every page shares. These pages are light, so none of
// these tests start the globe.
test.describe('page chrome', () => {
	test('has a skip link that is the first tab stop and jumps to the content', async ({ page }) => {
		await page.goto('/countries/');
		await page.keyboard.press('Tab');
		const skip = page.getByRole('link', { name: 'Skip to content' });
		await expect(skip).toBeFocused();
		await expect(skip).toBeInViewport();
		await page.keyboard.press('Enter');
		await expect(page).toHaveURL(/#main$/);
		await expect(page.locator('main#main')).toBeAttached();
	});

	test('keeps the skip link out of sight until it is focused', async ({ page }) => {
		await page.goto('/countries/');
		await expect(page.getByRole('link', { name: 'Skip to content' })).not.toBeInViewport();
	});

	test('marks the current page in the navigation', async ({ page }) => {
		await page.goto('/countries/');
		await expect(page.getByRole('link', { name: 'Countries' })).toHaveAttribute('aria-current', 'page');
		await expect(page.getByRole('link', { name: 'Map' })).not.toHaveAttribute('aria-current', /.*/);
	});

	test('still marks Countries as current on a country guide', async ({ page }) => {
		await page.goto('/countries/nepal/');
		await expect(page.getByRole('link', { name: 'Countries' })).toHaveAttribute('aria-current', 'page');
		await expect(page.getByRole('link', { name: 'Map' })).not.toHaveAttribute('aria-current', /.*/);
	});

	test('shows the current page in more than color', async ({ page }) => {
		await page.goto('/countries/');
		const weight = (name: string) => page.getByRole('link', { name }).evaluate((a) => Number(getComputedStyle(a).fontWeight));
		expect(await weight('Countries')).toBeGreaterThan(await weight('Map'));
	});

	test('changes the nav link under the pointer', async ({ page }) => {
		test.skip(test.info().project.name === 'mobile', 'touch screens have no hover');
		await page.goto('/countries/');
		const link = page.getByRole('link', { name: 'Map' });
		const background = () => link.evaluate((a) => getComputedStyle(a).backgroundColor);
		const before = await background();
		await link.hover();
		await expect.poll(background).not.toBe(before);
	});

	test('has sharing tags with the page title and description', async ({ page }) => {
		await page.goto('/countries/nepal/');
		const meta = (selector: string) => page.locator(`head meta[${selector}]`).getAttribute('content');
		expect(await meta('property="og:title"')).toBe('Drone rules in Nepal');
		expect(await meta('property="og:description"')).toContain('Recreational drone rules for Nepal');
		expect(await meta('property="og:type"')).toBe('website');
		expect(await meta('name="twitter:card"')).toBe('summary');
	});
});

test.describe('reading width and headings', () => {
	test('keeps guide paragraphs to about 65 characters a line', async ({ page }) => {
		await page.goto('/countries/nepal/');
		const { widest, limit, container } = await page.locator('.prose p').first().evaluate((first) => {
			// Measure what 65ch is in this font, by laying out a box that wide next to the paragraphs.
			const ruler = document.createElement('div');
			ruler.style.cssText = 'width:65ch;height:0;overflow:hidden';
			first.parentElement!.append(ruler);
			const limit = ruler.getBoundingClientRect().width;
			ruler.remove();
			const widths = [...document.querySelectorAll('.prose p')].map((p) => p.getBoundingClientRect().width);
			return { widest: Math.max(...widths), limit, container: first.closest('.prose')!.getBoundingClientRect().width };
		});
		expect(widest).toBeLessThanOrEqual(limit + 1);
		// On a desktop the container is wider than 65 characters, so the cap is what holds the paragraphs in.
		if (container > limit + 64) expect(widest).toBeGreaterThan(limit - 100);
	});

	test('balances headings so one word is not left alone on the last line', async ({ page }) => {
		await page.goto('/countries/nepal/');
		expect(await page.locator('h1').evaluate((h) => getComputedStyle(h).getPropertyValue('text-wrap-style'))).toBe('balance');
	});
});

test.describe('countries list', () => {
	test('shows each guide with its authority and the date it was last verified', async ({ page }) => {
		await page.goto('/countries/');
		const nepal = page.locator('.countries li', { hasText: 'Nepal' });
		await expect(nepal).toContainText('Civil Aviation Authority of Nepal (CAAN)');
		await expect(nepal).toContainText('last verified 2026-10-17');
		await expect(page.locator('.countries li')).toHaveCount(31);
	});
});

test.describe('404 page', () => {
	test('answers an unknown address with a 404 and a way back', async ({ page }) => {
		const response = await page.goto('/this-page-does-not-exist/');
		expect(response?.status()).toBe(404);
		await expect(page.getByRole('heading', { level: 1 })).toHaveText('Page not found');
		await expect(page.getByRole('link', { name: 'Back to the map' })).toHaveAttribute('href', '/');
		await expect(page.getByRole('link', { name: 'browse the countries' })).toHaveAttribute('href', '/countries/');
		await expect(page.locator('footer')).toContainText('not legal advice');
	});

	test('does not mark any nav link as the current page', async ({ page }) => {
		await page.goto('/this-page-does-not-exist/');
		await expect(page.locator('nav a[aria-current]')).toHaveCount(0);
	});

	test('does not scroll sideways', async ({ page }) => {
		await page.goto('/this-page-does-not-exist/');
		const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
		expect(overflow).toBeLessThanOrEqual(0);
	});

	test('still serves real pages and map tiles, so only unknown addresses get the 404', async ({ page, request }) => {
		expect((await page.goto('/countries/nepal/'))?.status()).toBe(200);
		const tiles = await request.get('/tiles/basemap.pmtiles', { headers: { Range: 'bytes=0-6' } });
		expect(tiles.status()).toBe(206);
	});
});
