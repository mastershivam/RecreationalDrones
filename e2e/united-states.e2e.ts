import { expect, test } from '@playwright/test';
import { activate, focusOn, highlightedAt, openGlobe, pointAt } from './helpers';

// Kansas, in the middle of the lower 48. Zoomed in, so the country is large enough to hover or tap.
const USA: [number, number] = [-98, 39];
const GREENLAND: [number, number] = [-42, 72]; // no guide yet
const ZOOM = 3;

async function showUsa(page: import('@playwright/test').Page) {
	await openGlobe(page);
	await focusOn(page, USA, ZOOM);
	await expect.poll(() => highlightedAt(page, USA)).toContain('USA');
}

test.describe('United States on the globe', () => {
	test('is highlighted, and its neighbour with no guide is not', async ({ page }) => {
		await showUsa(page);
		expect(await highlightedAt(page, USA)).toEqual(['USA']);
		expect(await highlightedAt(page, GREENLAND)).toEqual([]);
	});

	test('shows a hover preview with the key facts', async ({ page }) => {
		test.skip(test.info().project.name === 'mobile', 'touch screens have no hover');
		await showUsa(page);
		const point = await pointAt(page, USA);
		await page.mouse.move(point.x, point.y);

		const preview = page.locator('.country-popup.preview');
		await expect(preview).toContainText('United States');
		await expect(preview).toContainText('250 g (0.55 lb) or more');
		await expect(preview).toContainText('$5, valid 3 years');
		await expect(preview.locator('.unverified')).toHaveCount(0);
	});

	test('opens the full guide on click or tap, and not another country', async ({ page }) => {
		await showUsa(page);
		await activate(page, await pointAt(page, USA));

		const dialog = page.locator('#country-dialog');
		await expect(dialog).toBeVisible();
		await expect(dialog.getByRole('heading', { level: 1 })).toHaveText('Drone rules in United States');
		await expect(dialog).toContainText('$5, valid 3 years');
		await expect(dialog.getByRole('link', { name: 'Read the full guide' })).toHaveAttribute('href', '/countries/united-states/');
		await expect(dialog).not.toContainText('Thailand');
		await expect(dialog).not.toContainText('Flyer ID');
		expect(new URL(page.url()).pathname).toBe('/');
	});
});

test.describe('United States guide page', () => {
	test('shows registration, recreational rules, Remote ID and visitor rules', async ({ page }) => {
		await page.goto('/countries/united-states/');
		await expect(page.getByRole('heading', { level: 1 })).toHaveText('Drone rules in United States');
		for (const name of ['Registration', 'Recreational flyers', 'Remote ID', 'Visitors from abroad', 'Not covered yet']) {
			await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
		}
	});

	test('links DroneZone and cites only US government pages', async ({ page }) => {
		await page.goto('/countries/united-states/');
		await expect(page.getByRole('link', { name: 'Register with Federal Aviation Administration (FAA)' })).toHaveAttribute('href', 'https://faadronezone-access.faa.gov/');
		const sources = page.locator('h2', { hasText: 'Sources' }).locator('xpath=following-sibling::ul[1]//a');
		expect(await sources.count()).toBeGreaterThanOrEqual(6);
		// FAA pages, plus the law they rest on (eCFR, GovInfo) and the National Park Service's own drone page.
		for (const link of await sources.all()) await expect(link).toHaveAttribute('href', /^https:\/\/www\.(faa|ecfr|govinfo|nps)\.gov\//);
	});

	test('does not scroll sideways', async ({ page }) => {
		await page.goto('/countries/united-states/');
		const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
		expect(overflow).toBeLessThanOrEqual(0);
	});
});
