import { expect, test, type Page } from '@playwright/test';
import { openGlobe } from './helpers';

const token = (page: Page, name: string) => page.evaluate((n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim(), name);
// The color the map paints a country in: the fill expression is a `match` from country codes to colors.
const fillOf = (page: Page, iso3: string) =>
	page.evaluate((code) => {
		const expr = (window as any).__map.getPaintProperty('covered-countries', 'fill-color') as unknown[];
		for (let i = 2; i < expr.length - 1; i += 2) if ((expr[i] as string[]).includes(code)) return expr[i + 1] as string;
		return null;
	}, iso3);

test.describe('rules levels on the map', () => {
	test('paints each country in the color of its level', async ({ page }) => {
		await openGlobe(page);
		expect(await fillOf(page, 'GBR')).toBe(await token(page, '--color-level-2'));
		expect(await fillOf(page, 'DEU')).toBe(await token(page, '--color-level-2'));
		expect(await fillOf(page, 'NPL')).toBe(await token(page, '--color-level-3'));
		expect(await fillOf(page, 'THA')).toBe(await token(page, '--color-level-3'));
		// Two levels in use, so two different colors on the globe.
		expect(await token(page, '--color-level-2')).not.toBe(await token(page, '--color-level-3'));
	});

	test('has a key that names all four levels in words, not just colors', async ({ page }) => {
		await openGlobe(page);
		const chips = page.locator('#key .key-chip');
		for (const [i, label] of ['No restrictions', 'Basic restrictions', 'Complex restrictions', 'Fully restricted'].entries()) {
			await expect(chips.nth(i)).toContainText(label);
		}
		await chips.nth(2).click();
		await expect(page.locator('#key-definition')).toContainText('in-person step');
	});

	test('says the level in words in the hover preview and the summary', async ({ page }) => {
		await openGlobe(page);
		await page.getByRole('combobox', { name: 'Search for a country' }).fill('nepal');
		await page.getByRole('option', { name: 'Nepal' }).click();
		const dialog = page.locator('#country-dialog');
		await expect(dialog).toContainText('Complex restrictions', { timeout: 15_000 });
	});
});

test.describe('rules levels on the pages', () => {
	test('a guide page gives its level and the reason for it', async ({ page }) => {
		await page.goto('/countries/nepal/');
		await expect(page.locator('dd', { hasText: 'Complex restrictions' })).toContainText('in person in Kathmandu');
	});

	test('the countries page explains the four levels and shows each country’s', async ({ page }) => {
		await page.goto('/countries/');
		await expect(page.getByRole('heading', { name: 'How we rate the rules' })).toBeVisible();
		await expect(page.locator('ol.levels li')).toHaveCount(4);
		await expect(page.locator('.countries li', { hasText: 'Thailand' })).toContainText('Complex restrictions');
		await expect(page.locator('.countries li', { hasText: 'Germany' })).toContainText('Basic restrictions');
	});

	test('does not scroll sideways', async ({ page }) => {
		await page.goto('/countries/');
		expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
	});
});
