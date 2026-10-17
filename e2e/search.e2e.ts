import { expect, test } from '@playwright/test';
import { openGlobe } from './helpers';

const search = (page: import('@playwright/test').Page) => page.getByRole('combobox', { name: 'Search for a country' });
const dialog = (page: import('@playwright/test').Page) => page.locator('#country-dialog');
const center = (page: import('@playwright/test').Page) =>
	page.evaluate(() => {
		const c = (window as any).__map.getCenter();
		return { lng: c.lng, lat: c.lat };
	});

test.describe('country search', () => {
	test('lists matching countries as you type, ignoring case', async ({ page }) => {
		await openGlobe(page);
		await search(page).fill('UNI');
		await expect(page.getByRole('option')).toHaveText(['United Kingdom', 'United States']);
	});

	test('says so when no guide matches, instead of showing an empty box', async ({ page }) => {
		await openGlobe(page);
		await search(page).fill('Atlantis');
		await expect(page.getByRole('listbox')).toContainText('No guide for that country yet');
		await expect(page.getByRole('option')).toHaveCount(0);
	});

	test('spins the globe to the country, then opens its summary', async ({ page }) => {
		await openGlobe(page);
		await search(page).fill('nepal');
		await page.getByRole('option', { name: 'Nepal' }).click();

		// The modal opens only after the flight, so the camera is already over Nepal.
		await expect(dialog(page).getByRole('heading', { level: 1 })).toHaveText('Drone rules in Nepal', { timeout: 15_000 });
		const { lng, lat } = await center(page);
		expect(lng).toBeGreaterThan(80);
		expect(lng).toBeLessThan(89);
		expect(lat).toBeGreaterThan(26);
		expect(lat).toBeLessThan(31);
		await expect(dialog(page).getByRole('link', { name: 'Read the full guide' })).toHaveAttribute('href', '/countries/nepal/');
	});

	test('animates the flight rather than jumping', async ({ page }) => {
		await openGlobe(page);
		await search(page).fill('thailand');
		await page.getByRole('option', { name: 'Thailand' }).click();
		// Mid-flight the map is moving and no modal is open yet.
		await expect(dialog(page)).toBeHidden();
		await expect.poll(() => page.evaluate(() => (window as any).__map.isMoving())).toBe(true);
		await expect(dialog(page)).toBeVisible({ timeout: 15_000 });
	});

	test('works from the keyboard: arrow to a match, Enter to go', async ({ page }) => {
		test.skip(test.info().project.name === 'mobile', 'touch screens have no keyboard');
		await openGlobe(page);
		await search(page).fill('united');
		await search(page).press('ArrowDown');
		await search(page).press('ArrowDown');
		await search(page).press('Enter');
		await expect(dialog(page).getByRole('heading', { level: 1 })).toHaveText('Drone rules in United States', { timeout: 15_000 });
	});

	test('Enter picks the first match when none is highlighted', async ({ page }) => {
		test.skip(test.info().project.name === 'mobile', 'touch screens have no keyboard');
		await openGlobe(page);
		await search(page).fill('germ');
		await search(page).press('Enter');
		await expect(dialog(page).getByRole('heading', { level: 1 })).toHaveText('Drone rules in Germany', { timeout: 15_000 });
	});

	test('skips the flight for people who ask for less motion', async ({ page }) => {
		await page.emulateMedia({ reducedMotion: 'reduce' });
		await openGlobe(page);
		await search(page).fill('france');
		await page.getByRole('option', { name: 'France' }).click();
		await expect(dialog(page).getByRole('heading', { level: 1 })).toHaveText('Drone rules in France', { timeout: 5_000 });
	});

	test('can be used again after a search, for another country', async ({ page }) => {
		await openGlobe(page);
		await search(page).fill('nepal');
		await page.getByRole('option', { name: 'Nepal' }).click();
		await expect(dialog(page)).toBeVisible({ timeout: 15_000 });
		await dialog(page).getByRole('button', { name: 'Close' }).click();
		await search(page).fill('thai');
		await page.getByRole('option', { name: 'Thailand' }).click();
		await expect(dialog(page).getByRole('heading', { level: 1 })).toHaveText('Drone rules in Thailand', { timeout: 15_000 });
		await expect(dialog(page).getByRole('heading', { level: 1 })).toHaveCount(1);
	});

	test('fits on a phone without covering the whole globe', async ({ page }) => {
		await openGlobe(page);
		const box = (await search(page).boundingBox())!;
		const viewport = page.viewportSize()!;
		expect(box.x).toBeGreaterThanOrEqual(0);
		expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
		expect(box.height).toBeGreaterThanOrEqual(44);
	});
});
