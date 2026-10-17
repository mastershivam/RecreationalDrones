import { expect, test, type Page } from '@playwright/test';
import { ZONE_GROUPS } from '../src/lib/zones';
import { focusOn, openGlobe } from './helpers';

// The key (what the colors mean) is a row of chips, and the zone filter (what to show) is a separate panel.
// The key is what people read to understand the map, so nothing the filter does may resize or move it.

const key = (page: Page) => page.locator('#key');
const chips = (page: Page) => page.locator('#key .key-chip');
const zones = (page: Page) => page.locator('#layers');
const KATHMANDU: [number, number] = [85.36, 27.7];
const GROUP_LABELS = ZONE_GROUPS.map((g) => g.label);

// Opens the filter if it is a closed tab (it is, on a phone).
async function openZones(page: Page) {
	if (!(await zones(page).evaluate((d: HTMLDetailsElement) => d.open))) await zones(page).locator('summary').click();
}

// Where a panel is and how big it is, to the pixel.
const boxOf = async (page: Page, id: string) => (await page.locator(id).boundingBox())!;

test.describe('key and zone filters are two separate things', () => {
	test('the key is a row of chips: the four levels and "Not covered yet", with no checkboxes', async ({ page }) => {
		await openGlobe(page);
		await expect(chips(page)).toHaveText(['No restrictions', 'Basic restrictions', 'Complex restrictions', 'Fully restricted', 'Not covered yet']);
		await expect(key(page).locator('input')).toHaveCount(0);
	});

	test('the zone filter holds the checkboxes and none of the levels', async ({ page }) => {
		await openGlobe(page);
		await openZones(page);
		await expect(zones(page).locator('summary')).toHaveText('Zones');
		await expect(zones(page).locator('input[name="zone-group"]')).toHaveCount(GROUP_LABELS.length);
		await expect(zones(page).locator('.key-chip')).toHaveCount(0);
	});

	test('neither is inside the other', async ({ page }) => {
		await openGlobe(page);
		await expect(page.locator('#key #layers')).toHaveCount(0);
		await expect(page.locator('#layers #key')).toHaveCount(0);
	});

	test('the filter starts open on a desktop and as a closed tab on a phone', async ({ page }) => {
		await openGlobe(page);
		expect(await zones(page).evaluate((d: HTMLDetailsElement) => d.open)).toBe(test.info().project.name !== 'mobile');
	});
});

test.describe('the key chips', () => {
	test('say what a level means when tapped, and put the words away when tapped again', async ({ page }) => {
		await openGlobe(page);
		const words = page.locator('#key-definition');
		await expect(words).toBeHidden();
		await chips(page).nth(2).click();
		await expect(words).toContainText('Complex restrictions');
		await expect(words).toContainText('in-person step');
		await expect(chips(page).nth(2)).toHaveAttribute('aria-pressed', 'true');
		await chips(page).nth(2).click();
		await expect(words).toBeHidden();
	});

	test('show one definition at a time', async ({ page }) => {
		await openGlobe(page);
		await chips(page).nth(0).click();
		await chips(page).nth(4).click();
		await expect(page.locator('#key-definition')).toContainText('does not mean unrestricted');
		await expect(chips(page).nth(0)).toHaveAttribute('aria-pressed', 'false');
	});

	test('are finger-sized', async ({ page }) => {
		await openGlobe(page);
		for (const chip of await chips(page).all()) expect((await chip.boundingBox())!.height).toBeGreaterThanOrEqual(44);
	});
});

test.describe('the key does not resize or move', () => {
	test('when the zone filter is opened and closed', async ({ page }) => {
		await openGlobe(page);
		await zones(page).evaluate((d: HTMLDetailsElement) => (d.open = false));
		const before = await boxOf(page, '#key');
		await zones(page).evaluate((d: HTMLDetailsElement) => (d.open = true));
		expect(await boxOf(page, '#key')).toEqual(before);
		await zones(page).evaluate((d: HTMLDetailsElement) => (d.open = false));
		expect(await boxOf(page, '#key')).toEqual(before);
	});

	test('when zone groups are switched off and on', async ({ page }) => {
		await openGlobe(page);
		await openZones(page);
		const before = await boxOf(page, '#key');
		for (const name of GROUP_LABELS) {
			await page.getByRole('checkbox', { name }).uncheck();
			expect(await boxOf(page, '#key')).toEqual(before);
		}
		for (const name of GROUP_LABELS) await page.getByRole('checkbox', { name }).check();
		expect(await boxOf(page, '#key')).toEqual(before);
	});

	test('when a message appears in the zone filter', async ({ page }) => {
		// Regression: the message used to sit in the same panel as the key, so it made the key taller.
		await openGlobe(page);
		await openZones(page);
		const before = await boxOf(page, '#key');
		await page.locator('#zones-status').evaluate((el) => (el.textContent = 'Zones could not be loaded. The map still works. '.repeat(3)));
		expect(await boxOf(page, '#key')).toEqual(before);
	});

	test('when a chip is tapped and its definition shows', async ({ page }) => {
		await openGlobe(page);
		const before = await boxOf(page, '#key');
		await chips(page).nth(1).click();
		expect(await boxOf(page, '#key')).toEqual(before);
	});

	test('when the map is moved and zoomed to where zones show', async ({ page }) => {
		await openGlobe(page);
		const before = await boxOf(page, '#key');
		await focusOn(page, KATHMANDU, 8);
		expect(await boxOf(page, '#key')).toEqual(before);
	});
});

test.describe('where the key and the filter sit', () => {
	test('stay inside the screen and clear of the map attribution', async ({ page }) => {
		await openGlobe(page);
		await openZones(page);
		const viewport = page.viewportSize()!;
		const bar = await page.locator('.maplibregl-ctrl-attrib-inner').boundingBox();
		for (const id of ['#key', '#layers']) {
			const b = await boxOf(page, id);
			expect(b.x, id).toBeGreaterThanOrEqual(0);
			expect(b.x + b.width, id).toBeLessThanOrEqual(viewport.width);
			expect(b.y, id).toBeGreaterThanOrEqual(0);
			if (bar) expect(b.y + b.height <= bar.y || bar.y + bar.height <= b.y || b.x + b.width <= bar.x || bar.x + bar.width <= b.x, id).toBe(true);
		}
	});

	test('do not overlap each other', async ({ page }) => {
		await openGlobe(page);
		await openZones(page);
		const [k, z] = [await boxOf(page, '#key'), await boxOf(page, '#layers')];
		const apart = k.x + k.width <= z.x || z.x + z.width <= k.x || k.y + k.height <= z.y || z.y + z.height <= k.y;
		expect(apart, JSON.stringify({ k, z })).toBe(true);
	});

	test('keep their controls tappable: nothing else sits on top', async ({ page }) => {
		await openGlobe(page);
		const points = [await chips(page).first().boundingBox(), await zones(page).locator('summary').boundingBox()];
		for (const [i, box] of points.entries()) {
			const onTop = await page.evaluate(([x, y, panel]) => document.elementFromPoint(x as number, y as number)?.closest(panel as string) !== null, [box!.x + box!.width / 2, box!.y + box!.height / 2, i === 0 ? '#key' : '#layers']);
			expect(onTop, String(i)).toBe(true);
		}
	});

	test('leave the middle of the globe free to drag', async ({ page }) => {
		await openGlobe(page);
		// On a phone the filter starts as a closed tab; opened on purpose, it does cover part of the globe.
		if (test.info().project.name !== 'mobile') await openZones(page);
		const map = (await page.locator('#map').boundingBox())!;
		const centre = [map.x + map.width / 2, map.y + map.height / 2];
		const topmost = await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.closest('.layers, .key-bar, .panels') ?? null, centre);
		expect(topmost).toBeNull();
	});

	test('stay clear of the headline and search at the top', async ({ page }) => {
		test.skip(test.info().project.name === 'mobile', 'on a phone the open filter does cover part of the globe');
		await openGlobe(page);
		await openZones(page);
		const top = (await page.locator('.top').boundingBox())!;
		for (const id of ['#key', '#layers']) {
			const b = await boxOf(page, id);
			const apart = b.x + b.width <= top.x || top.x + top.width <= b.x || b.y + b.height <= top.y || top.y + top.height <= b.y;
			expect(apart, `${id} vs the top block: ${JSON.stringify({ b, top })}`).toBe(true);
		}
	});

	test('keep every part on screen when the filter is open with a long message, and the key keeps its size', async ({ page }) => {
		await openGlobe(page);
		const keyAlone = await boxOf(page, '#key');
		await openZones(page);
		await page.locator('#zones-status').evaluate((el) => (el.textContent = 'Zones could not be loaded. The map still works. '.repeat(4)));
		const stage = (await page.locator('.stage').boundingBox())!;
		for (const id of ['#key', '#layers']) {
			const b = await boxOf(page, id);
			expect(b.y, `${id} top`).toBeGreaterThanOrEqual(stage.y);
			expect(b.y + b.height, `${id} bottom`).toBeLessThanOrEqual(stage.y + stage.height);
		}
		expect(await boxOf(page, '#key')).toEqual(keyAlone);
		await expect(page.locator('#layers summary')).toBeInViewport({ ratio: 1 });
	});
});
