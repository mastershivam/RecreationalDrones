import { expect, test } from '@playwright/test';

const PAGES = ['/', '/countries/', '/countries/united-kingdom/'];

test.describe('pages', () => {
	test('lists the countries that have guides', async ({ page }) => {
		await page.goto('/countries/');
		await expect(page.getByRole('heading', { level: 1 })).toHaveText('Drone rules by country');
		await page.getByRole('link', { name: 'United Kingdom' }).click();
		await expect(page).toHaveURL(/\/countries\/united-kingdom\/$/);
	});

	test('shows the key facts, the date checked and the sources on a guide', async ({ page }) => {
		await page.goto('/countries/united-kingdom/');
		await expect(page.getByText('Last verified')).toBeVisible();
		await expect(page.getByText('Civil Aviation Authority (CAA)').first()).toBeVisible();
		await expect(page.getByText('Flyer ID').first()).toBeVisible();
		await expect(page.locator('a[href*="caa.co.uk"]').first()).toBeVisible();
	});

	test('says so when a rule has not been checked, instead of leaving it blank', async ({ page }) => {
		await page.goto('/countries/australia/');
		await expect(page.locator('dl .unverified')).toHaveCount(3);
		await expect(page.locator('dl .unverified').first()).toHaveText(/Not yet verified/);
	});

	test('shows the UK Remote ID dates and insurance rule from the CAA, with nothing left unverified', async ({ page }) => {
		await page.goto('/countries/united-kingdom/');
		await expect(page.locator('dl .unverified')).toHaveCount(0);
		await expect(page.locator('main')).toContainText('1 January 2026');
		await expect(page.locator('main')).toContainText('1 January 2028');
		await expect(page.locator('main')).toContainText('Optional if you fly only for recreation');
		await expect(page.locator('a[href*="remote-id-rid"]').first()).toBeVisible();
		await expect(page.locator('a[href*="insurance-requirements"]').first()).toBeVisible();
	});

	for (const path of PAGES) {
		test(`${path} shows the not-legal-advice notice`, async ({ page }) => {
			await page.goto(path);
			await expect(page.locator('footer')).toContainText('not legal advice');
		});

		test(`${path} does not scroll sideways`, async ({ page }) => {
			await page.goto(path);
			const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
			expect(overflow).toBeLessThanOrEqual(0);
		});

	}

	test('navigation links work between the map and the country pages', async ({ page }) => {
		// Starts on a light page: the map page runs a software-rendered globe that slows clicks on a busy machine.
		await page.goto('/countries/united-kingdom/');
		await page.getByRole('link', { name: 'Countries' }).click();
		await expect(page).toHaveURL(/\/countries\/$/);
		await page.getByRole('link', { name: 'Map' }).click();
		await expect(page).toHaveURL(/\/$/);
		await expect(page.locator('#map')).toBeAttached();
	});
});
