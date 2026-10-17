import { expect, test } from '@playwright/test';

test.describe('how to register, on the guide page', () => {
	test('lists what to have ready and numbered steps, then cost, how long it lasts and what to do next', async ({ page }) => {
		await page.goto('/countries/united-kingdom/');
		await expect(page.getByRole('heading', { name: 'How to register', exact: true })).toBeVisible();
		const section = page.locator('section.how-to');
		await expect(section.getByRole('heading', { name: 'Have ready' })).toBeVisible();
		await expect(section.locator('ul li').first()).toContainText('email address');
		await expect(section.locator('ol li')).toHaveCount(5);
		await expect(section.locator('dt')).toHaveText(['Cost', 'Lasts', 'Afterwards']);
		await expect(section.locator('dd').nth(0)).toContainText('£12.34 a year');
		await expect(section.locator('dd').nth(1)).toContainText('Flyer ID: 5 years');
	});

	test('numbers the steps, so they are read in order', async ({ page }) => {
		await page.goto('/countries/united-states/');
		const list = page.locator('section.how-to ol');
		expect(await list.evaluate((el) => getComputedStyle(el).listStyleType)).toBe('decimal');
	});

	test('marks a missing fee as not yet verified, not blank', async ({ page }) => {
		await page.goto('/countries/thailand/');
		await expect(page.locator('section.how-to dd').first().locator('.unverified')).toBeVisible();
		await expect(page.locator('section.how-to ol li')).toHaveCount(5);
	});

	test('tells a visitor to Nepal to go in person, and a visitor to Canada to apply for an SFOC', async ({ page }) => {
		await page.goto('/countries/nepal/');
		await expect(page.locator('section.how-to ol')).toContainText('in person');
		await page.goto('/countries/canada/');
		await expect(page.locator('section.how-to ol')).toContainText('cannot register a drone');
	});

	test('is on every EU guide, with the shared steps and an honest note about national lists', async ({ page }) => {
		for (const slug of ['germany', 'slovakia', 'malta']) {
			await page.goto(`/countries/${slug}/`);
			await expect(page.locator('section.how-to ol li')).toHaveCount(4);
			await expect(page.locator('section.how-to ul')).toContainText('We have not read the list');
		}
	});

	test('is left out of the map summary, which stays short', async ({ page }) => {
		await page.goto('/?e2e');
		await page.getByRole('combobox', { name: 'Search for a country' }).fill('japan');
		await page.getByRole('option', { name: 'Japan' }).click();
		const dialog = page.locator('#country-dialog');
		await expect(dialog.getByRole('heading', { level: 1 })).toHaveText('Drone rules in Japan', { timeout: 15_000 });
		await expect(dialog).not.toContainText('Have ready');
		await expect(dialog.getByRole('link', { name: 'Read the full guide' })).toBeVisible();
	});

	test('does not scroll sideways on a phone', async ({ page }) => {
		await page.goto('/countries/nepal/');
		expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
	});
});
