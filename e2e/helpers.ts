import { expect, type Page } from '@playwright/test';

// Fields of the MapLibre map that the tests use.
interface TestMap {
	project(lngLat: [number, number]): { x: number; y: number };
	queryRenderedFeatures(geometry?: unknown, options?: { layers: string[] }): unknown[];
	getLayer(id: string): unknown;
	getSource(id: string): unknown;
	jumpTo(options: { center: [number, number]; zoom: number }): void;
	once(event: 'idle', listener: () => void): void;
}

// Opens the home page and waits until the map has loaded every tile and drawn the highlighted countries.
export async function openGlobe(page: Page) {
	await page.goto('/?e2e');
	await expect(page.locator('#map[data-ready="true"]')).toBeAttached({ timeout: 30_000 });
	// The country shapes are parsed in the background, so they can appear a moment after the map is idle.
	await expect.poll(() => highlightedAt(page, [-2, 54])).toContain('GBR');
}

// Clicks with a mouse, or taps on a touch screen, so the same test runs on desktop and phone.
export async function activate(page: Page, point: { x: number; y: number }) {
	const touch = await page.evaluate(() => matchMedia('(hover: none)').matches);
	if (touch) await page.touchscreen.tap(point.x, point.y);
	else await page.mouse.click(point.x, point.y);
}

// Where the UK is on the page, in page coordinates (what mouse and touch actions need).
export async function ukPoint(page: Page) {
	const box = (await page.locator('#map').boundingBox())!;
	const point = await page.evaluate(() => {
		const map = (window as unknown as { __map: TestMap }).__map;
		return map.project([-2, 54]);
	});
	return { x: box.x + point.x, y: box.y + point.y };
}

// Moves the map to a place and waits until it has drawn it, so small countries are big enough to hover or tap.
export async function focusOn(page: Page, lngLat: [number, number], zoom: number) {
	await page.evaluate(
		([center, z]) =>
			new Promise<void>((resolve) => {
				const map = (window as unknown as { __map: TestMap }).__map;
				map.once('idle', () => resolve());
				map.jumpTo({ center: center as [number, number], zoom: z as number });
			}),
		[lngLat, zoom] as const,
	);
}

// Where a longitude/latitude is on the page, in page coordinates.
export async function pointAt(page: Page, lngLat: [number, number]) {
	const box = (await page.locator('#map').boundingBox())!;
	const point = await page.evaluate((coords) => (window as unknown as { __map: TestMap }).__map.project(coords), lngLat);
	return { x: box.x + point.x, y: box.y + point.y };
}

// ADM0_A3 codes of the highlighted countries drawn at a longitude/latitude.
export function highlightedAt(page: Page, lngLat: [number, number]) {
	return page.evaluate((coords) => {
		const map = (window as any).__map;
		const { x, y } = map.project(coords);
		return map
			.queryRenderedFeatures([x, y], { layers: ['covered-countries'] })
			.map((f: { properties: { ADM0_A3: string } }) => f.properties.ADM0_A3);
	}, lngLat);
}

// Counts features drawn right now in the given map layers.
export function renderedCount(page: Page, layers: string[]) {
	return page.evaluate(
		(ids) => (window as unknown as { __map: TestMap }).__map.queryRenderedFeatures(undefined, { layers: ids }).length,
		layers,
	);
}
