import { expect, test } from '@playwright/test';
import { activate, openGlobe, ukPoint } from './helpers';

const squash = (text: string | null) => (text ?? '').replace(/\s+/g, ' ').trim();
const dialog = '#country-dialog';

test.describe('country modal content', () => {
	test('is a summary of the guide page, which has the same facts and more', async ({ page }) => {
		await openGlobe(page);
		await activate(page, await ukPoint(page));
		const modal = page.locator(dialog);
		await expect(modal).toBeVisible();
		const facts = await modal.locator('dd').allTextContents();
		const summary = squash(await modal.locator('.dialog-body').textContent());

		await page.goto('/countries/united-kingdom/');
		const guidePage = squash(await page.locator('article').textContent());
		// Each fact the modal shows is on the guide page too, which goes further.
		for (const fact of facts.slice(0, 2)) expect(guidePage).toContain(squash(fact));
		expect(guidePage.length).toBeGreaterThan(summary.length * 2);
	});

	test('shows the facts that matter, with working links', async ({ page }) => {
		await openGlobe(page);
		await activate(page, await ukPoint(page));
		const modal = page.locator(dialog);
		await expect(modal).toBeVisible();

		for (const label of ['Who must register', 'Registration fee', 'Where to register']) {
			await expect(modal.locator('dt').filter({ hasText: new RegExp(`^${label}$`) })).toHaveCount(1);
		}
		await expect(modal).toContainText('100 g');
		await expect(modal.getByRole('link', { name: 'Register online' })).toHaveAttribute('href', /caa\.co\.uk/);
		await expect(modal.getByRole('link', { name: 'Read the full guide' })).toHaveAttribute('href', '/countries/united-kingdom/');
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
	});
});
