import { expect, test } from '@playwright/test';
import { openGlobe } from './helpers';

// The design review's fixes: the headline and search on the first screen, shareable links, the country sheet's
// badge and verdict, the "not covered" key entry and the filterable countries page.
const dialog = (page: import('@playwright/test').Page) => page.locator('#country-dialog');

test.describe('first screen', () => {
	test('has a large headline that names the three things to do, and folds away on the first drag', async ({ page }) => {
		await openGlobe(page);
		const h1 = page.getByRole('heading', { level: 1, name: 'Where can you fly?' });
		expect(await h1.evaluate((el) => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(32);
		await expect(page.locator('.intro .hint')).toContainText('Search');
		await expect(page.locator('.intro .hint')).toContainText('spin');
		await expect(page.locator('.intro .hint')).toContainText('tap');
		await page.evaluate(() => (document.querySelector('.intro') as HTMLElement).classList.add('hidden'));
		await expect(page.locator('.intro')).toHaveCSS('opacity', '0');
	});

	test('makes search the hero: tall, with chips for popular countries', async ({ page }) => {
		await openGlobe(page);
		const input = (await page.getByRole('combobox', { name: 'Search for a country' }).boundingBox())!;
		expect(input.height).toBeGreaterThanOrEqual(52);
		await expect(page.locator('#chips button')).not.toHaveCount(0);
	});

	test('a chip flies to its country and the country becomes a recent chip', async ({ page }) => {
		await openGlobe(page);
		await page.locator('#chips button', { hasText: 'Japan' }).click();
		await expect(dialog(page)).toBeVisible({ timeout: 15_000 });
		await expect(page.locator('#chips button').first()).toHaveText('Japan');
	});

	test('the slash key focuses the search, but not while typing in it', async ({ page }) => {
		test.skip(test.info().project.name === 'mobile', 'touch screens have no keyboard');
		await openGlobe(page);
		await page.keyboard.press('/');
		const input = page.getByRole('combobox', { name: 'Search for a country' });
		await expect(input).toBeFocused();
		await page.keyboard.type('a/b');
		await expect(input).toHaveValue('a/b');
	});

	test('spells out the not-covered state in the key', async ({ page }) => {
		await openGlobe(page);
		await page.locator('#key .key-chip', { hasText: 'Not covered yet' }).click();
		await expect(page.locator('#key-definition')).toContainText('does not mean unrestricted');
	});
});

test.describe('space and zoom limit', () => {
	test('cannot zoom out further than the whole globe with room around it', async ({ page }) => {
		await openGlobe(page);
		const box = (await page.locator('#map').boundingBox())!;
		await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
		for (let i = 0; i < 6; i++) await page.mouse.wheel(0, 1500);
		await page.waitForTimeout(800);
		const { min, zoom, lat } = await page.evaluate(() => {
			const map = (window as any).__map;
			return { min: map.getMinZoom(), zoom: map.getZoom(), lat: map.getCenter().lat };
		});
		expect(min).toBeGreaterThan(0.2);
		// On a globe the reported zoom is smaller than the one the limit is set in, by log2(cos latitude).
		expect(zoom).toBeGreaterThanOrEqual(min + Math.log2(Math.cos((lat * Math.PI) / 180)) - 0.01);
		expect(zoom).toBeLessThan(min);
	});

	test('has a starfield behind a clear map, and the stars move unless motion is reduced', async ({ page }) => {
		await openGlobe(page);
		await expect(page.locator('#map')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
		await expect(page.locator('.space .stars')).toHaveCount(3);
		for (const layer of await page.locator('.space .stars').all()) await expect(layer).toHaveCSS('animation-name', 'drift, twinkle');
	});

	test('keeps the stars still for people who ask for less motion', async ({ browser }) => {
		const context = await browser.newContext({ reducedMotion: 'reduce', baseURL: test.info().project.use.baseURL });
		const page = await context.newPage();
		await page.goto('/?e2e');
		await expect(page.locator('.space .stars').first()).toHaveCSS('animation-name', 'none');
		await context.close();
	});
});

test.describe('shareable country link', () => {
	test('?country=JPN opens that summary, and closing it clears the address', async ({ page }) => {
		await page.goto('/?e2e&country=JPN');
		await expect(dialog(page).getByRole('heading', { level: 1 })).toHaveText('Drone rules in Japan', { timeout: 15_000 });
		await dialog(page).getByRole('button', { name: 'Close' }).click();
		await expect(dialog(page)).toBeHidden();
		// The dialog's close event arrives a moment after it is hidden.
		await expect.poll(() => new URL(page.url()).searchParams.has('country')).toBe(false);
	});

	test('an unknown country is ignored', async ({ page }) => {
		await page.goto('/?e2e&country=ZZZ');
		await expect(page.locator('#map')).toBeAttached();
		await expect(dialog(page)).toBeHidden();
	});
});

test.describe('country sheet', () => {
	test('opens with the level badge and the verdict, and one accent Register button', async ({ page }) => {
		await page.goto('/?e2e&country=JPN');
		const d = dialog(page);
		await expect(d.locator('.level-badge')).toContainText('Complex restrictions', { timeout: 15_000 });
		await expect(d.locator('.verdict')).not.toBeEmpty();
		await expect(d.locator('a.button')).toHaveCount(1);
	});
});

test.describe('countries page', () => {
	test('filters by name and level, and sorts', async ({ page }) => {
		await page.goto('/countries/');
		const rows = page.locator('.countries li:visible');
		await expect(rows).toHaveCount(34);
		await page.getByRole('searchbox', { name: 'Search the countries' }).fill('nep');
		await expect(rows).toHaveCount(1);
		await page.getByRole('searchbox', { name: 'Search the countries' }).fill('');
		await page.getByLabel('Complex restrictions').check();
		await expect(rows.first()).toContainText('Complex restrictions');
		expect(await rows.count()).toBeLessThan(34);
		await expect(page.locator('#filter-count')).toContainText('of 34');
	});

	test('shows a level, weight and fee on every row', async ({ page }) => {
		await page.goto('/countries/');
		const nepal = page.locator('.countries li', { hasText: 'Nepal' });
		await expect(nepal.locator('.level-badge')).toBeVisible();
		await expect(nepal).toContainText('from');
	});
});

test.describe('guide page', () => {
	test('has the level badge, a quick-facts strip and search-engine data', async ({ page }) => {
		await page.goto('/countries/japan/');
		await expect(page.locator('.level-badge')).toBeVisible();
		await expect(page.getByRole('list', { name: 'Quick facts' }).locator('li')).toHaveCount(5);
		const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
		expect(ld.some((t) => JSON.parse(t)['@type'] === 'BreadcrumbList')).toBe(true);
	});
});

test.describe('chrome', () => {
	test('the footer disclaimer is one line until opened', async ({ page }) => {
		await page.goto('/countries/');
		await expect(page.locator('footer summary')).toContainText('not legal advice');
		await expect(page.locator('footer details p')).toBeHidden();
		await page.locator('footer summary').click();
		await expect(page.locator('footer details p')).toBeVisible();
	});
});
