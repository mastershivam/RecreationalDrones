import { expect, test } from '@playwright/test';
import { activate, focusOn, highlightedAt, openGlobe, pointAt } from './helpers';

// Roughly the middle of Nepal. Zoomed in, so the country is large enough to hover or tap.
const NEPAL: [number, number] = [84.1, 28.3];
const ZOOM = 4;

async function showNepal(page: import('@playwright/test').Page) {
	await openGlobe(page);
	await focusOn(page, NEPAL, ZOOM);
	await expect.poll(() => highlightedAt(page, NEPAL)).toContain('NPL');
}

test.describe('Nepal on the globe', () => {
	test('is highlighted, and so is its neighbour with no guide not', async ({ page }) => {
		await showNepal(page);
		expect(await highlightedAt(page, NEPAL)).toEqual(['NPL']);
		expect(await highlightedAt(page, [96, 21])).toEqual([]); // Myanmar has no guide yet
	});

	test('shows a hover preview with the key facts', async ({ page }) => {
		test.skip(test.info().project.name === 'mobile', 'touch screens have no hover');
		await showNepal(page);
		const nepal = await pointAt(page, NEPAL);
		await page.mouse.move(nepal.x, nepal.y);

		const preview = page.locator('.country-popup.preview');
		await expect(preview).toContainText('Nepal');
		await expect(preview).toContainText('over 2 kg');
		await expect(preview).toContainText('USD 50 plus 13% VAT');
		await expect(preview.locator('.unverified')).toHaveCount(0);
	});

	test('opens the full guide on click or tap', async ({ page }) => {
		await showNepal(page);
		await activate(page, await pointAt(page, NEPAL));

		const dialog = page.locator('#country-dialog');
		await expect(dialog).toBeVisible();
		await expect(dialog.getByRole('heading', { level: 1 })).toHaveText('Drone rules in Nepal');
		await expect(dialog).toContainText('USD 50 plus 13% VAT');
		await expect(dialog.getByRole('link', { name: 'Read the full guide' })).toHaveAttribute('href', '/countries/nepal/');
		expect(new URL(page.url()).pathname).toBe('/');
	});

	test('opens Nepal, not the UK, when Nepal is the country tapped', async ({ page }) => {
		// Regression guard for adding a second country: each country must open its own guide.
		await showNepal(page);
		await activate(page, await pointAt(page, NEPAL));
		const dialog = page.locator('#country-dialog');
		await expect(dialog.getByRole('heading', { level: 1 })).toHaveCount(1);
		await expect(dialog).not.toContainText('United Kingdom');
		await expect(dialog).not.toContainText('Flyer ID');
	});
});

test.describe('Nepal guide page', () => {
	test('shows the registration steps for visitors and for Nepali citizens', async ({ page }) => {
		await page.goto('/countries/nepal/');
		await expect(page.getByRole('heading', { level: 1 })).toHaveText('Drone rules in Nepal');
		await expect(page.getByRole('heading', { name: 'Foreign visitors' })).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Nepali citizens and companies' })).toBeVisible();
		await expect(page.getByText('Sinamangal, Kathmandu').first()).toBeVisible(); // also named in the how-to-register steps
	});

	test('names CAAN as the authority and cites its documents', async ({ page }) => {
		await page.goto('/countries/nepal/');
		await expect(page.getByRole('link', { name: 'Civil Aviation Authority of Nepal (CAAN)' }).first()).toHaveAttribute('href', 'https://caanepal.gov.np/');
		await expect(page.locator('a[href*="caanepal.gov.np/storage"]')).toHaveCount(4);
		await expect(page.locator('a[href*="caanepal.gov.np/functions/general-aviation/drones"]')).toHaveCount(1);
	});

	test('explains permission to fly and the flying limits', async ({ page }) => {
		await page.goto('/countries/nepal/');
		await expect(page.getByRole('heading', { name: 'Permission to fly' })).toBeVisible();
		await expect(page.getByText('security clearance letter from the Ministry of Home Affairs').first()).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Where and how you can fly' })).toBeVisible();
		await expect(page.getByText('100 m (328 ft)')).toBeVisible();
		await expect(page.locator('dd').getByText('0 g', { exact: true })).toBeVisible();
	});

	test('says what is not covered yet and marks unchecked rules', async ({ page }) => {
		await page.goto('/countries/nepal/');
		await expect(page.getByRole('heading', { name: 'Not covered yet' })).toBeVisible();
		await expect(page.locator('.unverified')).not.toHaveCount(0);
	});

	test('is listed with the other countries', async ({ page }) => {
		await page.goto('/countries/');
		await expect(page.getByRole('link', { name: 'Nepal' })).toBeVisible();
		await expect(page.getByRole('link', { name: 'United Kingdom' })).toBeVisible();
		await page.getByRole('link', { name: 'Nepal' }).click();
		await expect(page).toHaveURL(/\/countries\/nepal\/$/);
	});

	test('does not scroll sideways', async ({ page }) => {
		await page.goto('/countries/nepal/');
		const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
		expect(overflow).toBeLessThanOrEqual(0);
	});
});
