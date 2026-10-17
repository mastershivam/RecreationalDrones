import { expect, test, type Page } from '@playwright/test';
import { activate, focusOn, highlightedAt, openGlobe, pointAt } from './helpers';

// Each country: a point inside it, a neighbour with no guide, how far in to zoom, and what its guide says.
const COUNTRIES = [
	{ name: 'Canada', slug: 'canada', iso3: 'CAN', at: [-100, 55], neighbour: [-102, 24], zoom: 3, level: '3 of 4: Complex registration', fact: 'Foreign SFOC-RPAS' },
	{ name: 'Australia', slug: 'australia', iso3: 'AUS', at: [134, -25], neighbour: [114, -1], zoom: 3, level: '1 of 4: No registration', fact: 'There is no age limit' },
	{ name: 'Japan', slug: 'japan', iso3: 'JPN', at: [138.5, 36.5], neighbour: [128, 36.5], zoom: 5, level: '3 of 4: Complex registration', fact: '900 yen' },
] as const;

async function show(page: Page, c: (typeof COUNTRIES)[number]) {
	await openGlobe(page);
	await focusOn(page, [...c.at], c.zoom);
	await expect.poll(() => highlightedAt(page, [...c.at])).toContain(c.iso3);
}

for (const c of COUNTRIES) {
	test.describe(`${c.name} on the globe`, () => {
		test('is highlighted, and its neighbour with no guide is not', async ({ page }) => {
			await show(page, c);
			expect(await highlightedAt(page, [...c.at])).toEqual([c.iso3]);
			expect(await highlightedAt(page, [...c.neighbour])).toEqual([]);
		});

		test('opens its own summary on click or tap, with the level in words and a link to the full guide', async ({ page }) => {
			await show(page, c);
			await activate(page, await pointAt(page, [...c.at]));
			const dialog = page.locator('#country-dialog');
			await expect(dialog.getByRole('heading', { level: 1 })).toHaveText(`Drone rules in ${c.name}`);
			await expect(dialog).toContainText(c.level);
			await expect(dialog.getByRole('link', { name: 'Read the full guide' })).toHaveAttribute('href', `/countries/${c.slug}/`);
			await expect(dialog).not.toContainText('Flyer ID');
		});

		test('can be found by search', async ({ page }) => {
			await openGlobe(page);
			await page.getByRole('combobox', { name: 'Search for a country' }).fill(c.name.slice(0, 4));
			await page.getByRole('option', { name: c.name }).click();
			await expect(page.locator('#country-dialog').getByRole('heading', { level: 1 })).toHaveText(`Drone rules in ${c.name}`, { timeout: 15_000 });
		});
	});

	test.describe(`${c.name} guide page`, () => {
		test('shows its level, its facts, and what is not covered', async ({ page }) => {
			await page.goto(`/countries/${c.slug}/`);
			await expect(page.getByRole('heading', { level: 1 })).toHaveText(`Drone rules in ${c.name}`);
			await expect(page.locator('dd', { hasText: c.level })).toBeVisible();
			await expect(page.getByText(c.fact).first()).toBeVisible();
			await expect(page.getByRole('heading', { name: 'Not covered yet' })).toBeVisible();
		});

		test('does not scroll sideways', async ({ page }) => {
			await page.goto(`/countries/${c.slug}/`);
			expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
		});
	});
}

test('Australia is painted in a different color from Canada, because its level differs', async ({ page }) => {
	await openGlobe(page);
	const fill = (iso3: string) =>
		page.evaluate((code) => {
			const expr = (window as any).__map.getPaintProperty('covered-countries', 'fill-color') as unknown[];
			for (let i = 2; i < expr.length - 1; i += 2) if ((expr[i] as string[]).includes(code)) return expr[i + 1];
			return null;
		}, iso3);
	expect(await fill('AUS')).not.toBeNull();
	expect(await fill('AUS')).not.toBe(await fill('CAN'));
	expect(await fill('CAN')).toBe(await fill('JPN'));
});
