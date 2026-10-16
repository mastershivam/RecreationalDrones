import { expect, test } from '@playwright/test';
import { activate, openGlobe, ukPoint } from './helpers';

const squash = (text: string | null) => (text ?? '').replace(/\s+/g, ' ').trim();
const dialog = '#country-dialog';

test.describe('country modal content', () => {
	test('contains everything the full guide page contains', async ({ page }) => {
		// The modal saves a trip to the guide page, so nothing on that page may be missing from it.
		await page.goto('/countries/united-kingdom/');
		const guidePage = squash(await page.locator('article').textContent());
		expect(guidePage.length).toBeGreaterThan(300);

		await openGlobe(page);
		await activate(page, await ukPoint(page));
		await expect(page.locator(dialog)).toBeVisible();
		expect(squash(await page.locator(`${dialog} .dialog-body`).textContent())).toBe(guidePage);
	});

	test('shows every fact the guide records, with working links', async ({ page }) => {
		await openGlobe(page);
		await activate(page, await ukPoint(page));
		const modal = page.locator(dialog);
		await expect(modal).toBeVisible();

		for (const label of ['Authority', 'Who must register', 'Registration', 'Lowest registration weight', 'Minimum operator age', 'Remote ID', 'Insurance']) {
			await expect(modal.locator('dt').filter({ hasText: new RegExp(`^${label}$`) })).toHaveCount(1);
		}
		await expect(modal).toContainText('100 g');
		await expect(modal.getByRole('link', { name: /Register with/ })).toHaveAttribute('href', /caa\.co\.uk/);
		await expect(modal.locator('a[href*="registering-to-fly"]')).toBeAttached();
	});

	test('moves keyboard focus into the modal', async ({ page }) => {
		await openGlobe(page);
		await activate(page, await ukPoint(page));
		await expect(page.locator(dialog)).toBeVisible();
		const inside = await page.evaluate(() => document.getElementById('country-dialog')!.contains(document.activeElement));
		expect(inside).toBe(true);
	});

	test('does not close when the guide text inside it is clicked', async ({ page }) => {
		await openGlobe(page);
		await activate(page, await ukPoint(page));
		await page.locator(dialog).getByText('Who must register', { exact: true }).click();
		await expect(page.locator(dialog)).toBeVisible();
	});

	test('is larger than the hover preview', async ({ page }) => {
		test.skip(test.info().project.name === 'mobile', 'touch screens have no hover');
		await openGlobe(page);
		const uk = await ukPoint(page);
		await page.mouse.move(uk.x, uk.y);
		const preview = (await page.locator('.country-popup.preview').boundingBox())!;
		await page.mouse.click(uk.x, uk.y);
		const panel = (await page.locator(`${dialog} .dialog-panel`).boundingBox())!;
		expect(panel.width).toBeGreaterThan(preview.width * 1.5);
		expect(panel.height).toBeGreaterThan(preview.height);
	});
});
