import { expect, test, type Page } from '@playwright/test';
import { openGlobe, ukPoint } from './helpers';

const isMobile = () => test.info().project.name === 'mobile';
const dialog = (page: Page) => page.locator('#country-dialog');

// Clicks with a mouse, or taps on a touch screen.
async function activate(page: Page, point: { x: number; y: number }) {
	if (isMobile()) await page.touchscreen.tap(point.x, point.y);
	else await page.mouse.click(point.x, point.y);
}

// Taps the UK again after the modal was closed. MapLibre reads two taps on the same spot within about a second
// as a double-tap zoom (it never sees the tap on the Close button, which lands on the modal), and the zoom
// swallows the click. Nobody re-taps that fast, so pause like a person would.
async function reopenUk(page: Page) {
	await page.waitForTimeout(1500);
	await activate(page, await ukPoint(page));
}

async function openUk(page: Page) {
	await openGlobe(page);
	await activate(page, await ukPoint(page));
	await expect(dialog(page)).toBeVisible();
}

test.describe('hover preview', () => {
	test.skip(() => isMobile(), 'touch screens have no hover');

	test('shows the key facts when hovering a country', async ({ page }) => {
		await openGlobe(page);
		const uk = await ukPoint(page);
		await page.mouse.move(uk.x, uk.y);

		const preview = page.locator('.country-popup.preview');
		await expect(preview).toContainText('United Kingdom');
		await expect(preview).toContainText('Who must register');
		await expect(preview).toContainText('Registration fee');
		await expect(preview).toContainText('£12.34 a year');
		await expect(preview).toContainText('click for the summary');
	});

	test('is read-only, with no links to chase', async ({ page }) => {
		await openGlobe(page);
		const uk = await ukPoint(page);
		await page.mouse.move(uk.x, uk.y);
		await expect(page.locator('.country-popup.preview')).toBeVisible();
		await expect(page.locator('.country-popup.preview a')).toHaveCount(0);
	});

	test('is short: no Remote ID, insurance or minimum age', async ({ page }) => {
		// The hover preview is for a 10-second look; the rest lives on the guide page.
		await openGlobe(page);
		const uk = await ukPoint(page);
		await page.mouse.move(uk.x, uk.y);
		const preview = page.locator('.country-popup.preview');
		await expect(preview).toBeVisible();
		await expect(preview).not.toContainText('Remote ID');
		await expect(preview).not.toContainText('Insurance');
		await expect(preview).not.toContainText('Minimum age');
	});

	test('goes away when the pointer leaves the country', async ({ page }) => {
		await openGlobe(page);
		const uk = await ukPoint(page);
		await page.mouse.move(uk.x, uk.y);
		await expect(page.locator('.country-popup.preview')).toBeVisible();
		await page.mouse.move(uk.x - 200, uk.y + 100); // open sea
		await expect(page.locator('.country-popup.preview')).toHaveCount(0);
	});

	test('is replaced by the guide when the country is clicked', async ({ page }) => {
		await openGlobe(page);
		const uk = await ukPoint(page);
		await page.mouse.move(uk.x, uk.y);
		await expect(page.locator('.country-popup.preview')).toBeVisible();
		await page.mouse.click(uk.x, uk.y);
		await expect(dialog(page)).toBeVisible();
		await expect(page.locator('.country-popup.preview')).toHaveCount(0);
	});
});

test.describe('full guide popup', () => {
	test('opens on click or tap, with the summary and a link to the full guide', async ({ page }) => {
		await openUk(page);
		await expect(dialog(page).getByRole('heading', { level: 1 })).toHaveText('Drone rules in United Kingdom');
		await expect(dialog(page)).toContainText('Flyer ID');
		await expect(dialog(page)).toContainText('Last verified');
		await expect(dialog(page)).toContainText('£12.34 a year');
		await expect(dialog(page).getByRole('link', { name: 'Register online' })).toHaveAttribute('href', /caa\.co\.uk/);
		await expect(dialog(page).getByRole('link', { name: 'Read the full guide' })).toHaveAttribute('href', '/countries/united-kingdom/');
	});

	test('stays on the map instead of opening a new page', async ({ page }) => {
		// Regression: clicking a country used to navigate straight to its guide page.
		await openUk(page);
		expect(new URL(page.url()).pathname).toBe('/');
	});

	test('leaves the details to the guide page, so it can be read in a few seconds', async ({ page }) => {
		await openUk(page);
		await expect(dialog(page).locator('dt')).toHaveText(['Rules', 'Who must register', 'Registration fee', 'Where to register']);
		await dialog(page).getByRole('link', { name: 'Read the full guide' }).click();
		await expect(page).toHaveURL(/\/countries\/united-kingdom\/$/);
		await expect(page.getByRole('heading', { name: 'Sources' })).toBeVisible();
	});

	test('closes with the close button', async ({ page }) => {
		await openUk(page);
		await dialog(page).getByRole('button', { name: 'Close' }).click();
		await expect(dialog(page)).toBeHidden();
	});

	test('closes when the dimmed area around it is clicked', async ({ page }) => {
		await openUk(page);
		await page.mouse.click(4, 4);
		await expect(dialog(page)).toBeHidden();
	});

	test('closes with the Escape key', async ({ page }) => {
		test.skip(isMobile(), 'touch screens have no Escape key');
		await openUk(page);
		await page.keyboard.press('Escape');
		await expect(dialog(page)).toBeHidden();
	});

	test('can be opened again after closing, with one guide in it, not two', async ({ page }) => {
		await openUk(page);
		await dialog(page).getByRole('button', { name: 'Close' }).click();
		await expect(dialog(page)).toBeHidden();
		await reopenUk(page);
		await expect(dialog(page)).toBeVisible();
		await expect(dialog(page).getByRole('heading', { level: 1 })).toHaveCount(1);
	});

	test('fits inside the screen, with its close button reachable', async ({ page }) => {
		await openUk(page);
		const viewport = page.viewportSize()!;
		const box = (await dialog(page).locator('.dialog-panel').boundingBox())!;
		expect(box.x).toBeGreaterThanOrEqual(0);
		expect(box.y).toBeGreaterThanOrEqual(0);
		expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
		expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
		await expect(dialog(page).getByRole('button', { name: 'Close' })).toBeInViewport({ ratio: 1 });
	});

	test('keeps its last line, the link to the full guide, reachable', async ({ page }) => {
		// Regression: on a phone a tall popup was cut off, hiding the end of it.
		await openUk(page);
		const link = dialog(page).getByRole('link', { name: 'Read the full guide' });
		await link.scrollIntoViewIfNeeded();
		await expect(link).toBeInViewport();
		await expect(dialog(page).getByRole('button', { name: 'Close' })).toBeInViewport({ ratio: 1 });
	});

	test('starts at the top each time it is opened', async ({ page }) => {
		await openUk(page);
		await dialog(page).getByRole('link', { name: 'Read the full guide' }).scrollIntoViewIfNeeded();
		await dialog(page).getByRole('button', { name: 'Close' }).click();
		await reopenUk(page);
		await expect(dialog(page).getByRole('heading', { level: 1 })).toBeInViewport();
	});
});
