import { expect, test } from '@playwright/test';
import { isOutsideRequest, openGlobe } from './helpers';

const locate = (page: import('@playwright/test').Page) => page.getByRole('button', { name: 'Use my location' });
const status = (page: import('@playwright/test').Page) => page.locator('#locate-status');
const dialog = (page: import('@playwright/test').Page) => page.locator('#country-dialog');

test.describe('use my location, in a country with a guide', () => {
	test.use({ permissions: ['geolocation'], geolocation: { latitude: 35.68, longitude: 139.69 } }); // Tokyo

	test('spins the globe to you and opens that country’s summary', async ({ page }) => {
		await openGlobe(page);
		await locate(page).click();
		await expect(status(page)).toHaveText('You are in Japan.');
		await expect(dialog(page).getByRole('heading', { level: 1 })).toHaveText('Drone rules in Japan', { timeout: 15_000 });
		const center = await page.evaluate(() => (window as any).__map.getCenter());
		expect(center.lng).toBeCloseTo(139.69, 0);
		expect(center.lat).toBeCloseTo(35.68, 0);
	});

	test('marks where you are on the map', async ({ page }) => {
		await openGlobe(page);
		await locate(page).click();
		await expect(page.locator('.you-are-here')).toHaveCount(1);
		await expect(dialog(page)).toBeVisible({ timeout: 15_000 });
	});

	test('never sends the position anywhere', async ({ page }) => {
		// Privacy regression: the position is used in the page to find the country, and no request may carry it.
		const urls: string[] = [];
		page.on('request', (r) => urls.push(r.url() + (r.postData() ?? '')));
		await openGlobe(page);
		urls.length = 0;
		await locate(page).click();
		await expect(dialog(page)).toBeVisible({ timeout: 15_000 });
		for (const url of urls) {
			expect(url, url).not.toMatch(/35\.6|139\.6/);
			expect(isOutsideRequest(url, new URL(page.url()).origin), url).toBe(false);
		}
	});

	test('can be used again after a search, and shows one marker', async ({ page }) => {
		await openGlobe(page);
		await locate(page).click();
		await expect(dialog(page)).toBeVisible({ timeout: 15_000 });
		await dialog(page).getByRole('button', { name: 'Close' }).click();
		await page.waitForTimeout(1500);
		await locate(page).click();
		await expect(dialog(page)).toBeVisible({ timeout: 15_000 });
		await expect(page.locator('.you-are-here')).toHaveCount(1);
	});
});

test.describe('use my location, with reduced motion', () => {
	test.use({ permissions: ['geolocation'], geolocation: { latitude: 35.68, longitude: 139.69 }, reducedMotion: 'reduce' });

	test('jumps there without the flight', async ({ page }) => {
		await openGlobe(page);
		await locate(page).click();
		await expect(dialog(page)).toBeVisible({ timeout: 4_000 });
	});
});

test.describe('use my location, in a country with no guide', () => {
	test.use({ permissions: ['geolocation'], geolocation: { latitude: -15.8, longitude: -47.9 } }); // Brasília

	test('says where you are and that there is no guide yet, without opening a popup', async ({ page }) => {
		await openGlobe(page);
		await locate(page).click();
		await expect(status(page)).toHaveText('You are in Brazil. We have no guide for it yet.');
		await expect.poll(() => page.evaluate(() => (window as any).__map.isMoving()), { timeout: 15_000 }).toBe(false);
		await expect(dialog(page)).toBeHidden();
	});
});

test.describe('use my location, away from land', () => {
	test.use({ permissions: ['geolocation'], geolocation: { latitude: 30, longitude: -30 } }); // mid-Atlantic

	test('says it could not place you in a country', async ({ page }) => {
		await openGlobe(page);
		await locate(page).click();
		await expect(status(page)).toContainText('at sea');
		await expect(dialog(page)).toBeHidden();
	});
});

test.describe('use my location, when permission is refused', () => {
	test.use({ permissions: [] });

	test('says so plainly, and search still works', async ({ page }) => {
		await openGlobe(page);
		await locate(page).click();
		await expect(status(page)).toContainText('permission was denied');
		await expect(locate(page)).toBeEnabled();
		await page.getByRole('combobox', { name: 'Search for a country' }).fill('nepal');
		await page.getByRole('option', { name: 'Nepal' }).click();
		await expect(dialog(page)).toBeVisible({ timeout: 15_000 });
	});
});

test.describe('the location button', () => {
	test('is a finger-sized, named button inside the screen, and does not hide the search box', async ({ page }) => {
		await openGlobe(page);
		const button = (await locate(page).boundingBox())!;
		const input = (await page.getByRole('combobox', { name: 'Search for a country' }).boundingBox())!;
		const viewport = page.viewportSize()!;
		expect(button.width).toBeGreaterThanOrEqual(44);
		expect(button.height).toBeGreaterThanOrEqual(44);
		expect(button.x + button.width).toBeLessThanOrEqual(viewport.width);
		expect(button.x).toBeGreaterThanOrEqual(input.x);
		await expect(locate(page)).toHaveAttribute('title', /never sent anywhere/);
	});

	test('can be reached by keyboard', async ({ page }) => {
		test.skip(test.info().project.name === 'mobile', 'touch screens have no keyboard');
		await openGlobe(page);
		await page.getByRole('combobox', { name: 'Search for a country' }).focus();
		await page.keyboard.press('Tab');
		await expect(locate(page)).toBeFocused();
	});
});
