import { expect, test } from '@playwright/test';
import { activate, focusOn, highlightedAt, openGlobe, pointAt, GUIDE_COUNT } from './helpers';

// Germany is the sample member state; Ukraine, to its east, is not in the EU and has no guide.
const GERMANY: [number, number] = [10.5, 51];
const UKRAINE: [number, number] = [31, 49];
const ZOOM = 4;

async function showGermany(page: import('@playwright/test').Page) {
	await openGlobe(page);
	await focusOn(page, GERMANY, ZOOM);
	await expect.poll(() => highlightedAt(page, GERMANY)).toContain('DEU');
}

test.describe('EU member states on the globe', () => {
	test('highlights a member state, and not a non-member neighbour', async ({ page }) => {
		await showGermany(page);
		expect(await highlightedAt(page, GERMANY)).toEqual(['DEU']);
		expect(await highlightedAt(page, UKRAINE)).toEqual([]);
	});

	test('shows a hover preview with the shared EASA registration rule', async ({ page }) => {
		test.skip(test.info().project.name === 'mobile', 'touch screens have no hover');
		await showGermany(page);
		const point = await pointAt(page, GERMANY);
		await page.mouse.move(point.x, point.y);

		const preview = page.locator('.country-popup.preview');
		await expect(preview).toContainText('Germany');
		await expect(preview).toContainText('250 g');
		// The fee is national, so EASA's pages give none.
		await expect(preview.locator('.unverified')).toHaveCount(1);
	});

	test("opens Germany's guide, with the EASA rules and its own authority", async ({ page }) => {
		await showGermany(page);
		await activate(page, await pointAt(page, GERMANY));

		const dialog = page.locator('#country-dialog');
		await expect(dialog.getByRole('heading', { level: 1 })).toHaveText('Drone rules in Germany');
		await expect(dialog.getByRole('link', { name: 'Register online' })).toHaveAttribute('href', /uas-operations\.de/);
		await expect(dialog.getByRole('link', { name: 'Read the full guide' })).toHaveAttribute('href', '/countries/germany/');
		await expect(dialog).not.toContainText('Flyer ID');
	});
});

test.describe('EU guide pages', () => {
	test('shows the shared EASA rules and the national links', async ({ page }) => {
		await page.goto('/countries/germany/');
		await expect(page.getByRole('heading', { level: 1 })).toHaveText('Drone rules in Germany');
		for (const name of ['The EU rules', 'Registration', 'Pilot training', 'Remote ID', 'In Germany', 'Not covered yet']) {
			await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
		}
		await expect(page.getByRole('link', { name: /map of geographical zones/ })).toHaveAttribute('href', 'https://dipul.de/homepage/en/information/geographical-zones/');
		await expect(page.getByRole('cell', { name: 'C2, under 4 kg' })).toBeVisible();
	});

	test('a state with no registration page we could reach says so instead of linking one', async ({ page }) => {
		await page.goto('/countries/slovakia/');
		await expect(page.getByText('did not load when we checked')).toBeVisible();
		await expect(page.getByRole('link', { name: /^Register with/ })).toHaveCount(0);
	});

	test('lists all 27 member states with the other countries', async ({ page }) => {
		await page.goto('/countries/');
		for (const name of ['Austria', 'France', 'Sweden', 'Germany']) await expect(page.getByRole('link', { name, exact: true })).toBeVisible();
		// 27 EU + the UK, Switzerland, Norway, Iceland, Liechtenstein, Nepal, Thailand, the US, Canada, Australia and Japan.
		await expect(page.locator('.countries li a')).toHaveCount(GUIDE_COUNT);
	});

	test('does not scroll sideways, even with the rules table', async ({ page }) => {
		await page.goto('/countries/germany/');
		const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
		expect(overflow).toBeLessThanOrEqual(0);
	});
});
