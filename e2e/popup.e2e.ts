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
		await expect(preview).toContainText('Minimum age');
		await expect(preview).toContainText('click for the full guide');
	});

	test('is read-only, with no links to chase', async ({ page }) => {
		await openGlobe(page);
		const uk = await ukPoint(page);
		await page.mouse.move(uk.x, uk.y);
		await expect(page.locator('.country-popup.preview')).toBeVisible();
		await expect(page.locator('.country-popup.preview a')).toHaveCount(0);
	});

	test('marks unchecked facts as not yet verified', async ({ page }) => {
		await openGlobe(page);
		const uk = await ukPoint(page);
		await page.mouse.move(uk.x, uk.y);
		await expect(page.locator('.country-popup.preview .unverified')).toHaveCount(2); // Remote ID and insurance
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
	test('opens on click or tap, with the whole guide in it', async ({ page }) => {
		await openUk(page);
		await expect(dialog(page).getByRole('heading', { level: 1 })).toHaveText('Drone rules in United Kingdom');
		await expect(dialog(page)).toContainText('Flyer ID');
		await expect(dialog(page)).toContainText('Last verified');
		await expect(dialog(page).getByRole('link', { name: /Civil Aviation Authority/ }).first()).toHaveAttribute('href', /caa\.co\.uk/);
		await expect(dialog(page).getByRole('heading', { name: 'Sources' })).toBeAttached();
	});

	test('stays on the map instead of opening a new page', async ({ page }) => {
		// Regression: clicking a country used to navigate straight to its guide page.
		await openUk(page);
		expect(new URL(page.url()).pathname).toBe('/');
	});

	test('says so when a rule has not been checked, instead of leaving it blank', async ({ page }) => {
		await openUk(page);
		await expect(dialog(page).locator('.unverified')).toHaveCount(2);
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

	test('scrolls inside itself so every part of the guide can be read', async ({ page }) => {
		// Regression: on a phone a tall popup was cut off, hiding the end of it.
		await openUk(page);
		const sources = dialog(page).getByRole('heading', { name: 'Sources' });
		await sources.scrollIntoViewIfNeeded();
		await expect(sources).toBeInViewport();
		await expect(dialog(page).getByRole('button', { name: 'Close' })).toBeInViewport({ ratio: 1 });
	});

	test('starts at the top each time it is opened', async ({ page }) => {
		await openUk(page);
		await dialog(page).getByRole('heading', { name: 'Sources' }).scrollIntoViewIfNeeded();
		await dialog(page).getByRole('button', { name: 'Close' }).click();
		await reopenUk(page);
		await expect(dialog(page).getByRole('heading', { level: 1 })).toBeInViewport();
	});
});
