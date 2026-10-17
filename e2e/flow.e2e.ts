import { expect, test, type Page } from '@playwright/test';
import { focusOn, openGlobe, pointAt, ukPoint } from './helpers';

const flow = (page: Page) => page.locator('canvas.flow');
// How many pixels the canvas has drawn on (not fully transparent).
const drawn = (page: Page, selector: string) =>
	page.evaluate((sel) => {
		const c = document.querySelector<HTMLCanvasElement>(sel)!;
		const data = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;
		let n = 0;
		for (let i = 3; i < data.length; i += 4) if (data[i] > 0) n++;
		return n;
	}, selector);

test.describe('flow field over the globe', () => {
	test('is a decorative canvas inside the map, that cannot be tapped or read out', async ({ page }) => {
		await openGlobe(page);
		await expect(flow(page)).toHaveCount(1);
		await expect(flow(page)).toHaveAttribute('aria-hidden', 'true');
		await expect(flow(page)).toHaveCSS('pointer-events', 'none');
		await expect(flow(page)).toHaveAttribute('data-flow', 'moving');
		expect(await page.evaluate(() => !!document.querySelector('.maplibregl-canvas-container canvas.flow'))).toBe(true);
	});

	test('draws lines', async ({ page }) => {
		await openGlobe(page);
		await expect.poll(() => drawn(page, 'canvas.flow'), { timeout: 10_000 }).toBeGreaterThan(500);
	});

	test('sits above the map and below its popups, so a popup stays readable', async ({ page }) => {
		test.skip(test.info().project.name === 'mobile', 'touch screens have no hover');
		await openGlobe(page);
		const uk = await ukPoint(page);
		await page.mouse.move(uk.x, uk.y);
		const popup = page.locator('.country-popup.preview');
		await expect(popup).toBeVisible();
		const order = await page.evaluate(() => {
			const canvas = document.querySelector('canvas.maplibregl-canvas')!;
			const flow = document.querySelector('canvas.flow')!;
			const popup = document.querySelector('.country-popup')!;
			const follows = (a: Element, b: Element) => !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
			return { flowAfterMap: follows(canvas, flow), popupAfterFlow: follows(flow, popup) };
		});
		expect(order).toEqual({ flowAfterMap: true, popupAfterFlow: true });
		const box = (await popup.boundingBox())!;
		const top = await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.closest('.country-popup') !== null, [box.x + box.width / 2, box.y + box.height / 2]);
		expect(top).toBe(true);
	});

	test('thins out as you zoom in, and is gone at the zoom where zones appear', async ({ page }) => {
		await openGlobe(page);
		await expect.poll(() => flow(page).evaluate((el) => Number(el.style.opacity))).toBeGreaterThan(0.6);
		await focusOn(page, [-0.12, 51.5], 7);
		await expect.poll(() => flow(page).evaluate((el) => Number(el.style.opacity))).toBe(0);
	});

	test('does not get in the way of tapping a country', async ({ page }) => {
		await openGlobe(page);
		const uk = await pointAt(page, [-2, 54]);
		const hit = await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.className ?? '', [uk.x, uk.y]);
		expect(hit).not.toContain('flow');
	});
});

test.describe('flow field, with reduced motion', () => {
	test.use({ reducedMotion: 'reduce' });

	test('draws one still picture and does not animate', async ({ page }) => {
		await openGlobe(page);
		await expect(flow(page)).toHaveAttribute('data-flow', 'still');
		const first = await drawn(page, 'canvas.flow');
		expect(first).toBeGreaterThan(500);
		await page.waitForTimeout(800);
		expect(await drawn(page, 'canvas.flow')).toBe(first);
	});

	// Regression: the still picture once replayed 300 frames of fading trails, which took about 12 seconds on a large
	// screen and stalled the map's first load.
	test('draws its still picture in well under a second', async ({ page }) => {
		await openGlobe(page);
		const ms = Number(await flow(page).getAttribute('data-flow-ms'));
		expect(ms).toBeLessThan(400);
	});

	test('the page backdrop is still too', async ({ page }) => {
		await page.goto('/countries/');
		await expect(page.locator('canvas.flow-page')).toHaveAttribute('data-flow', 'still');
	});
});

test.describe('flow field behind the pages', () => {
	test('is behind the content, covers the screen, and cannot be tapped', async ({ page }) => {
		await page.goto('/countries/');
		const canvas = page.locator('canvas.flow-page');
		await expect(canvas).toHaveAttribute('aria-hidden', 'true');
		await expect(canvas).toHaveCSS('position', 'fixed');
		await expect(canvas).toHaveCSS('pointer-events', 'none');
		await expect(canvas).toHaveAttribute('data-flow', 'moving');
		await expect.poll(() => drawn(page, 'canvas.flow-page'), { timeout: 10_000 }).toBeGreaterThan(300);
	});

	test('is on every page but the map, which draws its own', async ({ page }) => {
		for (const path of ['/countries/', '/countries/japan/', '/does-not-exist/']) {
			await page.goto(path);
			await expect(page.locator('canvas.flow-page'), path).toHaveCount(1);
		}
		await openGlobe(page);
		await expect(page.locator('canvas.flow-page')).toHaveCount(0);
	});

	test('leaves links clickable and text selectable-over, so it never blocks reading', async ({ page }) => {
		await page.goto('/countries/');
		await page.getByRole('link', { name: 'Japan', exact: true }).click();
		await expect(page).toHaveURL(/\/countries\/japan\/$/);
	});

	test('keeps page titles large and tight', async ({ page }) => {
		await page.goto('/countries/japan/');
		const size = await page.locator('h1').evaluate((h) => parseFloat(getComputedStyle(h).fontSize));
		expect(size).toBeGreaterThanOrEqual(36);
	});

	test('does not scroll sideways', async ({ page }) => {
		await page.goto('/countries/japan/');
		expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
	});
});
