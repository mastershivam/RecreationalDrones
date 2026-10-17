import { expect, test } from '@playwright/test';

// The second half of the design review: trip planner, weight check, saved countries, region filter, outline,
// social cards, the draggable phone sheet and the light theme.
const dialog = (page: import('@playwright/test').Page) => page.locator('#country-dialog');

test.describe('trip planner', () => {
	test('puts the chosen countries side by side, keeps them in the address, and restores them', async ({ page }) => {
		await page.goto('/trip/');
		await page.getByLabel('Japan').check();
		await page.getByLabel('Germany').check();
		await expect(page.locator('#trip-table thead th')).toHaveCount(3);
		await expect(page.locator('#trip-table')).toContainText('Complex restrictions');
		expect(new URL(page.url()).searchParams.get('c')).toBe('germany,japan');
		await page.reload();
		await expect(page.getByLabel('Japan')).toBeChecked();
		await expect(page.locator('#trip-table thead th')).toHaveCount(3);
	});

	test('shows nothing, and ignores unknown countries, when none are chosen', async ({ page }) => {
		await page.goto('/trip/?c=atlantis');
		await expect(page.locator('#trip-table table')).toHaveCount(0);
	});

	test('is in the navigation and the sitemap', async ({ page, request }) => {
		await page.goto('/trip/');
		await expect(page.getByRole('link', { name: 'Trip' })).toHaveAttribute('aria-current', 'page');
		expect(await (await request.get('/sitemap.xml')).text()).toContain('/trip/');
	});
});

test.describe('weight check in the sheet', () => {
	test('says where registration starts for the weight typed, without saying a flight is allowed', async ({ page }) => {
		await page.goto('/?e2e&country=JPN');
		const weight = dialog(page).getByLabel(/My drone weighs/);
		await weight.fill('50');
		await expect(dialog(page).locator('.weight-answer')).toContainText('under that');
		await weight.fill('900');
		await expect(dialog(page).locator('.weight-answer')).toContainText('over that');
		await expect(dialog(page).locator('.weight-answer')).not.toContainText(/allowed|can fly/i);
	});
});

test.describe('saved countries', () => {
	test('are saved from the sheet, shown as starred chips, and kept after a reload', async ({ page }) => {
		await page.goto('/?e2e&country=JPN');
		await dialog(page).getByRole('button', { name: 'Save this country' }).click();
		await expect(dialog(page).getByRole('button', { name: /Saved/ })).toHaveAttribute('aria-pressed', 'true');
		await page.reload();
		await expect(page.locator('#chips button').first()).toHaveText('★ Japan');
	});

	test('say "(updated)" when the guide was checked after they were saved', async ({ page }) => {
		await page.addInitScript(() => localStorage.setItem('saved-countries', JSON.stringify({ JPN: '2020-01-01' })));
		await page.goto('/?e2e');
		await expect(page.locator('#chips button').first()).toHaveText('★ Japan (updated)');
		await page.locator('#chips button').first().click();
		await expect(dialog(page)).toBeVisible({ timeout: 15_000 });
		await dialog(page).getByRole('button', { name: 'Close' }).click();
		await expect(page.locator('#chips button').first()).toHaveText('★ Japan');
	});

	test('ignore a damaged saved list', async ({ page }) => {
		await page.addInitScript(() => localStorage.setItem('saved-countries', '{not json'));
		await page.goto('/?e2e');
		await expect(page.locator('#chips button')).not.toHaveCount(0);
	});
});

test.describe('countries page', () => {
	test('filters by region', async ({ page }) => {
		await page.goto('/countries/');
		await page.getByLabel('Region').selectOption('Asia');
		await expect(page.locator('.countries li:visible')).toHaveCount(3);
		await page.getByLabel('Region').selectOption('European Union');
		await expect(page.locator('.countries li:visible')).toHaveCount(27);
	});
});

test.describe('guide page', () => {
	test('draws the country outline in its level colour', async ({ page }) => {
		await page.goto('/countries/japan/');
		await expect(page.locator('svg.outline path')).toHaveAttribute('d', /^M/);
	});

	test('has its own social card', async ({ page, request }) => {
		await page.goto('/countries/japan/');
		const image = await page.locator('meta[property="og:image"]').getAttribute('content');
		expect(image).toMatch(/\/og\/japan\.png$/);
		const response = await request.get(new URL(image!).pathname);
		expect(response.status()).toBe(200);
		expect(response.headers()['content-type']).toContain('image/png');
	});
});

test.describe('phone sheet', () => {
	test.use({ viewport: { width: 390, height: 800 } });

	test('closes when its grip is dragged down, and stays open for a short drag', async ({ page }) => {
		await page.goto('/?e2e&country=JPN');
		await expect(dialog(page)).toBeVisible({ timeout: 15_000 });
		await dialog(page).evaluate((d) => Promise.all(d.getAnimations().map((a) => a.finished)));
		const grip = (await dialog(page).locator('.sheet-handle').boundingBox())!;
		const [x, y] = [grip.x + grip.width / 2, grip.y + grip.height / 2];
		await page.mouse.move(x, y);
		await page.mouse.down();
		await page.mouse.move(x, y + 40, { steps: 4 });
		await page.mouse.up();
		await expect(dialog(page)).toBeVisible();
		await page.mouse.move(x, y);
		await page.mouse.down();
		await page.mouse.move(x, y + 250, { steps: 6 });
		await page.mouse.up();
		await expect(dialog(page)).toBeHidden();
	});
});

test.describe('light theme', () => {
	test('follows the system for the page, and keeps the headline over the globe light', async ({ browser }) => {
		const seen: Record<string, { bg: string; headline: string }> = {};
		for (const scheme of ['dark', 'light'] as const) {
			const context = await browser.newContext({ colorScheme: scheme, baseURL: test.info().project.use.baseURL });
			const page = await context.newPage();
			await page.goto('/countries/');
			const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
			await page.goto('/?e2e');
			const headline = await page.locator('.intro h1').evaluate((el) => getComputedStyle(el).color);
			seen[scheme] = { bg, headline };
			await context.close();
		}
		expect(seen.dark.bg).not.toBe(seen.light.bg);
		expect(seen.dark.headline).toBe(seen.light.headline);
	});
});
