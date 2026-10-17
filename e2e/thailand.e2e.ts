import { expect, test } from '@playwright/test';
import { activate, focusOn, highlightedAt, openGlobe, pointAt } from './helpers';

// Roughly the middle of Thailand. Zoomed in, so the country is large enough to hover or tap.
const THAILAND: [number, number] = [101, 15.5];
const MYANMAR: [number, number] = [96, 21];
const ZOOM = 4;

async function showThailand(page: import('@playwright/test').Page) {
	await openGlobe(page);
	await focusOn(page, THAILAND, ZOOM);
	await expect.poll(() => highlightedAt(page, THAILAND)).toContain('THA');
}

test.describe('Thailand on the globe', () => {
	test('is highlighted, and its neighbour with no guide is not', async ({ page }) => {
		await showThailand(page);
		expect(await highlightedAt(page, THAILAND)).toEqual(['THA']);
		expect(await highlightedAt(page, MYANMAR)).toEqual([]); // Myanmar has no guide yet
	});

	test('shows a hover preview with the key facts', async ({ page }) => {
		test.skip(test.info().project.name === 'mobile', 'touch screens have no hover');
		await showThailand(page);
		const thailand = await pointAt(page, THAILAND);
		await page.mouse.move(thailand.x, thailand.y);

		const preview = page.locator('.country-popup.preview');
		await expect(preview).toContainText('Thailand');
		await expect(preview).toContainText('without a camera that weigh more than 2 kg');
		// CAAT's pages give no fee, so it is marked as not yet verified, not left blank.
		await expect(preview.locator('.unverified')).toHaveCount(1);
		await expect(preview).toContainText('Registration fee');
	});

	test('opens the full guide on click or tap', async ({ page }) => {
		await showThailand(page);
		await activate(page, await pointAt(page, THAILAND));

		const dialog = page.locator('#country-dialog');
		await expect(dialog).toBeVisible();
		await expect(dialog.getByRole('heading', { level: 1 })).toHaveText('Drone rules in Thailand');
		await expect(dialog.getByRole('link', { name: 'Register online' })).toHaveAttribute('href', 'https://uasportal.caat.or.th/');
		await expect(dialog.locator('.unverified')).toHaveCount(1);
		expect(new URL(page.url()).pathname).toBe('/');
	});

	test('opens Thailand, not Nepal or the UK, when Thailand is the country tapped', async ({ page }) => {
		// Regression guard for adding another country: each country must open its own guide.
		await showThailand(page);
		await activate(page, await pointAt(page, THAILAND));
		const dialog = page.locator('#country-dialog');
		await expect(dialog.getByRole('heading', { level: 1 })).toHaveCount(1);
		await expect(dialog).not.toContainText('Nepal');
		await expect(dialog).not.toContainText('United Kingdom');
		await expect(dialog).not.toContainText('Flyer ID');
	});
});

test.describe('Thailand guide page', () => {
	test('shows how to register, the pilot certificate and the flying limits', async ({ page }) => {
		await page.goto('/countries/thailand/');
		await expect(page.getByRole('heading', { level: 1 })).toHaveText('Drone rules in Thailand');
		await expect(page.getByRole('heading', { name: 'Registration', exact: true })).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Pilot certificate' })).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Where and how you can fly' })).toBeVisible();
		await expect(page.getByText('Do not fly within 9 km of an aerodrome')).toBeVisible();
	});

	test('links the UAS Portal and names CAAT as the authority', async ({ page }) => {
		await page.goto('/countries/thailand/');
		await expect(page.getByRole('link', { name: 'Civil Aviation Authority of Thailand (CAAT)' }).first()).toHaveAttribute('href', 'https://www.caat.or.th/en/');
		await expect(page.getByRole('link', { name: 'Register with Civil Aviation Authority of Thailand (CAAT)' })).toHaveAttribute('href', 'https://uasportal.caat.or.th/');
	});

	test("cites CAAT's three pages as its sources", async ({ page }) => {
		await page.goto('/countries/thailand/');
		const sources = page.locator('h2', { hasText: 'Sources' }).locator('xpath=following-sibling::ul[1]//a');
		await expect(sources).toHaveCount(3);
		for (const link of await sources.all()) await expect(link).toHaveAttribute('href', /^https:\/\/www\.caat\.or\.th\//);
	});

	test('says what is not covered yet and marks unchecked rules', async ({ page }) => {
		await page.goto('/countries/thailand/');
		await expect(page.getByRole('heading', { name: 'Not covered yet' })).toBeVisible();
		await expect(page.locator('.unverified')).not.toHaveCount(0);
	});

	test('is listed with the other countries', async ({ page }) => {
		await page.goto('/countries/');
		await expect(page.getByRole('link', { name: 'Thailand' })).toBeVisible();
		await expect(page.getByRole('link', { name: 'Nepal' })).toBeVisible();
		await expect(page.getByRole('link', { name: 'United Kingdom' })).toBeVisible();
		await page.getByRole('link', { name: 'Thailand' }).click();
		await expect(page).toHaveURL(/\/countries\/thailand\/$/);
	});

	test('does not scroll sideways', async ({ page }) => {
		await page.goto('/countries/thailand/');
		const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
		expect(overflow).toBeLessThanOrEqual(0);
	});
});
