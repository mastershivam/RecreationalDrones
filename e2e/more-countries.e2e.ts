import { expect, test, type Page } from '@playwright/test';
import { activate, focusOn, highlightedAt, openGlobe, pointAt } from './helpers';

// Each country: a point inside it, a neighbour with no guide, how far in to zoom, and what its guide says.
const COUNTRIES = [
	{ name: 'Canada', slug: 'canada', iso3: 'CAN', at: [-100, 55], neighbour: [-102, 24], zoom: 3, level: 'Complex restrictions', fact: 'Foreign SFOC-RPAS' },
	{ name: 'Australia', slug: 'australia', iso3: 'AUS', at: [134, -25], neighbour: [144, -6], zoom: 3, level: 'No restrictions', fact: 'There is no age limit' },
	// Zoom 5, below where zones show (ZONE_MIN_ZOOM): Switzerland's official zones now cover most of it, and a zone under a tap wins over the country.
	// Every country around it has a guide, so the "no guide" point is Bosnia and Herzegovina, further off.
	{ name: 'Switzerland', slug: 'switzerland', iso3: 'CHE', at: [8.2, 46.8], neighbour: [17.8, 44.2], zoom: 5, level: 'Basic restrictions', fact: 'CHF 10' },
	// Zoom 4, below where zones show (ZONE_MIN_ZOOM), so Norway's airport circles do not sit under the tap. Russia has no guide.
	{ name: 'Norway', slug: 'norway', iso3: 'NOR', at: [9.5, 61.5], neighbour: [34, 66], zoom: 4, level: 'Complex restrictions', fact: 'NOK 230' },
	// Greenland, to the north-west, has no guide.
	{ name: 'Iceland', slug: 'iceland', iso3: 'ISL', at: [-19.5, 64.8], neighbour: [-40, 72], zoom: 5, level: 'Basic restrictions', fact: 'ISK 5,863' },
	// Iran, to the north across the Gulf, has no guide (Saudi Arabia and Oman now do).
	{ name: 'United Arab Emirates', slug: 'united-arab-emirates', iso3: 'ARE', at: [54.2, 23.9], neighbour: [54, 29.5], zoom: 5, level: 'Complex restrictions', fact: 'AED 200' },
	// Zoom 4, below where zones show (ZONE_MIN_ZOOM). Fiji, to the north, has no guide.
	{ name: 'New Zealand', slug: 'new-zealand', iso3: 'NZL', at: [172, -43.5], neighbour: [178, -17.8], zoom: 4, level: 'No restrictions', fact: 'Part 101' },
	// Bolivia, to the west, has no guide (Argentina, to the south-west, now does).
	{ name: 'Brazil', slug: 'brazil', iso3: 'BRA', at: [-53, -10], neighbour: [-64.5, -17], zoom: 3, level: 'Complex restrictions', fact: 'SARPAS' },
	// Mozambique, to the north-east, has no guide (Namibia, to the north-west, now does).
	{ name: 'South Africa', slug: 'south-africa', iso3: 'ZAF', at: [24.5, -29.5], neighbour: [35, -17.5], zoom: 4, level: 'Complex restrictions', fact: 'rpasInbox' },
	// Pakistan, to the north-west, has no guide.
	{ name: 'India', slug: 'india', iso3: 'IND', at: [78, 22], neighbour: [69.5, 29], zoom: 3, level: 'Complex restrictions', fact: 'INR 100' },
	// North Korea, to the north, has no guide.
	{ name: 'South Korea', slug: 'south-korea', iso3: 'KOR', at: [127.8, 36.3], neighbour: [127, 40.3], zoom: 5, level: 'Complex restrictions', fact: '9.3 km' },
	// China, to the west, has no guide (South Korea, closer, now does).
	{ name: 'Japan', slug: 'japan', iso3: 'JPN', at: [138.5, 36.5], neighbour: [118, 34], zoom: 5, level: 'Complex restrictions', fact: '900 yen' },
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

// Liechtenstein is about 25 km across, too small to tap on the globe, so it is tested by its page and by search.
test.describe('Liechtenstein', () => {
	test('guide page shows its level, the insurance fact and what is not covered, and does not scroll sideways', async ({ page }) => {
		await page.goto('/countries/liechtenstein/');
		await expect(page.getByRole('heading', { level: 1 })).toHaveText('Drone rules in Liechtenstein');
		await expect(page.locator('dd', { hasText: 'Basic restrictions' })).toBeVisible();
		await expect(page.getByText('CHF 1 million').first()).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Not covered yet' })).toBeVisible();
		expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
	});

	test('can be found by search', async ({ page }) => {
		await openGlobe(page);
		await page.getByRole('combobox', { name: 'Search for a country' }).fill('liecht');
		await page.getByRole('option', { name: 'Liechtenstein' }).click();
		await expect(page.locator('#country-dialog').getByRole('heading', { level: 1 })).toHaveText('Drone rules in Liechtenstein', { timeout: 15_000 });
	});
});

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
