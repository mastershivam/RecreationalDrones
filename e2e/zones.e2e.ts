import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { activate, focusOn, openGlobe, pointAt, renderedCount } from './helpers';

const ZONE_LAYERS = ['zones-fill', 'zones-airport-line', 'zones-approval-line', 'zones-points'];
const ZOOM = 8; // close enough that a 5 km circle is about 18 px across, and the highest the map goes

// Where Tribhuvan International Airport is, from the data, so the test does not copy a position.
const airports = JSON.parse(readFileSync('data/zones/npl-airports.geojson', 'utf8')).features as { geometry: { coordinates: [number, number] }; properties: { id: string } }[];
const KATHMANDU = airports.find((f) => f.properties.id === 'ourairports:VNKT')!.geometry.coordinates;
const PATTAYA_FIELD: [number, number] = [100.93784, 12.90936]; // "Aereomodel strip", in the Thai model-fields file
const HYDE_PARK: [number, number] = [-0.1657, 51.5073];

async function openZones(page: Page) {
	await openGlobe(page);
	// Zones are fetched only once the map is close enough to draw them.
	await focusOn(page, KATHMANDU, 6);
	await expect(page.locator('#map[data-zones="ready"]')).toBeAttached({ timeout: 30_000 });
}

// The kinds of zone drawn in the current view, from what MapLibre actually rendered.
function kindsShown(page: Page) {
	return page.evaluate(
		(layers) => [...new Set((window as any).__map.queryRenderedFeatures(undefined, { layers }).map((f: any) => f.properties.kind))].sort(),
		ZONE_LAYERS,
	);
}

// The filter is a closed tab on a phone and open on a desktop; make sure it is open.
async function openPanel(page: Page) {
	const panel = page.locator('#layers');
	if (!(await panel.evaluate((d: HTMLDetailsElement) => d.open))) await panel.locator('summary').click();
}
const box = (page: Page, name: string) => page.getByRole('checkbox', { name });

test.describe('zones layer', () => {
	test('draws airport circles close in, from the zone files', async ({ page }) => {
		await openZones(page);
		await focusOn(page, KATHMANDU, ZOOM);
		expect(await kindsShown(page)).toContain('airport-buffer');
		expect(await renderedCount(page, ['zones-airport-line'])).toBeGreaterThan(0);
	});

	test('keeps zones off the world view, so they do not clutter the globe or catch taps meant for a country', async ({ page }) => {
		await openZones(page);
		await focusOn(page, KATHMANDU, 3);
		expect(await renderedCount(page, ZONE_LAYERS)).toBe(0);
	});

	test('draws the circle at the size of the rule: 5 km round Tribhuvan, in kilometres, not pixels', async ({ page }) => {
		await openZones(page);
		await focusOn(page, KATHMANDU, ZOOM);
		const kmEast = (km: number): [number, number] => [KATHMANDU[0] + km / (111.32 * Math.cos((KATHMANDU[1] * Math.PI) / 180)), KATHMANDU[1]];
		const fillAt = async (lngLat: [number, number]) => {
			const { x, y } = await page.evaluate((c) => (window as any).__map.project(c), lngLat);
			return page.evaluate(([px, py]) => (window as any).__map.queryRenderedFeatures([px, py], { layers: ['zones-fill'] }).length, [x, y]);
		};
		expect(await fillAt(kmEast(4.5))).toBeGreaterThan(0);
		expect(await fillAt(kmEast(5.6))).toBe(0);
	});

	test('draws an outline for a Royal Park that needs approval, and a ring for a model aircraft field', async ({ page }) => {
		await openZones(page);
		await focusOn(page, HYDE_PARK, ZOOM);
		expect(await kindsShown(page)).toContain('check-first');
		await focusOn(page, PATTAYA_FIELD, ZOOM);
		expect(await kindsShown(page)).toContain('flying-site');
	});
});

test.describe('zone filter', () => {
	test('has a labelled box for each group, all on to start with', async ({ page }) => {
		await openZones(page);
		await openPanel(page);
		for (const name of ['Airport zones', 'Approval needed or restricted', 'Model aircraft fields']) await expect(box(page, name)).toBeChecked();
	});

	test('hides airport zones and brings them back', async ({ page }) => {
		await openZones(page);
		await focusOn(page, KATHMANDU, ZOOM);
		await openPanel(page);
		await box(page, 'Airport zones').uncheck();
		await expect.poll(() => renderedCount(page, ZONE_LAYERS)).toBe(0);
		await box(page, 'Airport zones').check();
		await expect.poll(() => kindsShown(page)).toContain('airport-buffer');
	});

	test('hides only the group that was switched off', async ({ page }) => {
		await openZones(page);
		await focusOn(page, PATTAYA_FIELD, ZOOM);
		await openPanel(page);
		await expect.poll(() => kindsShown(page)).toEqual(expect.arrayContaining(['flying-site']));
		await box(page, 'Model aircraft fields').uncheck();
		await expect.poll(() => kindsShown(page)).not.toContain('flying-site');
		expect(await kindsShown(page)).toContain('airport-buffer');
		await box(page, 'Model aircraft fields').check();
		await box(page, 'Airport zones').uncheck();
		await expect.poll(() => kindsShown(page)).toEqual(['flying-site']);
	});

	test('switches off the approval group on its own', async ({ page }) => {
		await openZones(page);
		await focusOn(page, HYDE_PARK, ZOOM);
		await openPanel(page);
		await expect.poll(() => kindsShown(page)).toContain('check-first');
		await box(page, 'Approval needed or restricted').uncheck();
		await expect.poll(() => kindsShown(page)).not.toContain('check-first');
		expect(await kindsShown(page)).toContain('airport-buffer');
	});

	test('can be used by keyboard', async ({ page }) => {
		test.skip(test.info().project.name === 'mobile', 'a phone has no keyboard');
		await openZones(page);
		await focusOn(page, KATHMANDU, ZOOM);
		await openPanel(page);
		await box(page, 'Airport zones').focus();
		await page.keyboard.press('Space');
		await expect(box(page, 'Airport zones')).not.toBeChecked();
		await expect.poll(() => renderedCount(page, ZONE_LAYERS)).toBe(0);
	});

	test('has finger-sized rows, and a key drawn in the same style as the map', async ({ page }) => {
		await openZones(page);
		await openPanel(page);
		for (const label of await page.locator('#layers label').all()) expect((await label.boundingBox())!.height).toBeGreaterThanOrEqual(44);
		await expect(page.locator('#layers .key.airport')).toHaveCSS('stroke-dasharray', /\d/);
		await expect(page.locator('#layers .key.approval')).not.toHaveCSS('stroke-dasharray', /\d/);
	});

	// Regression: on a phone, MapLibre's attribution bar wrapped across the bottom and sat over the Zones tab, so
	// a tap on the tab went to the attribution link instead and the filter could not be opened.
	test('is not covered by the map attribution, so the tab can be tapped', async ({ page }) => {
		await openZones(page);
		// Moving the map is what made the attribution bar open up and spread across the bottom.
		await focusOn(page, KATHMANDU, ZOOM);
		const tab = (await page.locator('#layers summary').boundingBox())!;
		const point = [tab.x + tab.width / 2, tab.y + tab.height / 2];
		const topmost = await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.closest('#layers') !== null, point);
		expect(topmost, 'what is on top of the Zones tab').toBe(true);
		// The whole bar, in whatever state, stays clear of the panel.
		const [panel, bar] = [await page.locator('#layers').boundingBox(), await page.locator('.maplibregl-ctrl-attrib-inner').boundingBox()];
		if (bar) expect(panel!.y + panel!.height <= bar.y || bar.y + bar.height <= panel!.y || panel!.x + panel!.width <= bar.x, JSON.stringify({ panel, bar })).toBe(true);
	});

	test('starts as a closed tab on a phone, so the globe stays clear', async ({ page }) => {
		test.skip(test.info().project.name !== 'mobile', 'only a phone starts closed');
		await openZones(page);
		expect(await page.locator('#layers').evaluate((d: HTMLDetailsElement) => d.open)).toBe(false);
		await expect(page.locator('#layers summary')).toBeVisible();
	});

	test('starts open on a desktop', async ({ page }) => {
		test.skip(test.info().project.name === 'mobile', 'a phone starts closed');
		await openZones(page);
		expect(await page.locator('#layers').evaluate((d: HTMLDetailsElement) => d.open)).toBe(true);
	});
});

test.describe('zone popups', () => {
	test('shows a read-only preview on hover with what it is, its note, source and date', async ({ page }) => {
		test.skip(test.info().project.name === 'mobile', 'touch screens have no hover');
		await openZones(page);
		await focusOn(page, KATHMANDU, ZOOM);
		const point = await pointAt(page, KATHMANDU);
		await page.mouse.move(point.x, point.y);
		const preview = page.locator('.country-popup.preview');
		await expect(preview).toContainText('Tribhuvan International Airport');
		await expect(preview).toContainText('Airport zone');
		await expect(preview).toContainText('5 km');
		await expect(preview).toContainText('as of 2026-10-17');
		await expect(preview.locator('a')).toHaveCount(0);
	});

	test('opens a popup on click or tap, with a link to the source, and not the country guide', async ({ page }) => {
		await openZones(page);
		await focusOn(page, KATHMANDU, ZOOM);
		await activate(page, await pointAt(page, KATHMANDU));
		const popup = page.locator('.country-popup:not(.preview)');
		await expect(popup).toContainText('Tribhuvan International Airport');
		const link = popup.getByRole('link');
		await expect(link).toHaveAttribute('href', /^https:\/\//);
		await expect(link).toHaveAttribute('target', '_blank');
		await expect(link).toHaveAttribute('rel', /noopener/);
		await expect(page.locator('#country-dialog')).not.toBeVisible();
	});

	test('opens the country’s summary from a zone popup, instead of leaving the user stranded in it', async ({ page }) => {
		// The zone popup wins over the country guide under a tap, so it needs its own way in.
		await openZones(page);
		await focusOn(page, KATHMANDU, ZOOM);
		await activate(page, await pointAt(page, KATHMANDU));
		const popup = page.locator('.country-popup:not(.preview)');
		await popup.getByRole('button', { name: "See this country's rules" }).click();
		const dialog = page.locator('#country-dialog');
		await expect(dialog.getByRole('heading', { level: 1 })).toHaveText('Drone rules in Nepal');
		await expect(popup).toHaveCount(0);
	});

	test('gives the hover preview no button, since it cannot be clicked into', async ({ page }) => {
		test.skip(test.info().project.name === 'mobile', 'touch screens have no hover');
		await openZones(page);
		await focusOn(page, KATHMANDU, ZOOM);
		const point = await pointAt(page, KATHMANDU);
		await page.mouse.move(point.x, point.y);
		await expect(page.locator('.country-popup.preview')).toContainText('Tribhuvan');
		await expect(page.locator('.country-popup.preview button')).toHaveCount(0);
	});

	test('puts a dot in the middle of a Royal Park outline, so it can be seen and tapped from a distance', async ({ page }) => {
		await openZones(page);
		await focusOn(page, HYDE_PARK, ZOOM);
		const dots = await page.evaluate(
			() => (window as any).__map.queryRenderedFeatures(undefined, { layers: ['zones-points'] }).filter((f: any) => f.properties.kind === 'check-first').length,
		);
		expect(dots).toBeGreaterThan(0);
	});

	test('lists every zone under a tap, and scrolls the popup if the list is long', async ({ page }) => {
		await openZones(page);
		const heathrow: [number, number] = [-0.4614, 51.4706];
		await focusOn(page, heathrow, ZOOM);
		await activate(page, await pointAt(page, heathrow));
		const popup = page.locator('.country-popup:not(.preview)');
		await expect(popup.locator('section.zone').first()).toBeVisible();
		await expect(popup).not.toContainText('more here');
		const box = (await popup.locator('.maplibregl-popup-content').boundingBox())!;
		expect(box.y + box.height).toBeLessThanOrEqual(page.viewportSize()!.height);
	});

	test('marks the UK circles as indicative, and says what the circle leaves out', async ({ page }) => {
		await openZones(page);
		const heathrow: [number, number] = [-0.4614, 51.4706];
		await focusOn(page, heathrow, ZOOM);
		await activate(page, await pointAt(page, heathrow));
		const popup = page.locator('.country-popup:not(.preview)');
		await expect(popup).toContainText('Airport zone (indicative)');
		await expect(popup).toContainText('only a guide');
		await expect(popup).toContainText('caa.co.uk');
	});

	test('says a model aircraft field is a field, and is not an approval to fly', async ({ page }) => {
		await openZones(page);
		await focusOn(page, PATTAYA_FIELD, ZOOM);
		await activate(page, await pointAt(page, PATTAYA_FIELD));
		const popup = page.locator('.country-popup:not(.preview)');
		await expect(popup).toContainText('Model aircraft field');
		await expect(popup).toContainText('not an approval to fly a drone');
		await expect(popup).toContainText('download.geofabrik.de');
	});

	test('can be closed with the close button, which is finger-sized', async ({ page }) => {
		await openZones(page);
		await focusOn(page, KATHMANDU, ZOOM);
		await activate(page, await pointAt(page, KATHMANDU));
		const close = page.locator('.country-popup:not(.preview) .maplibregl-popup-close-button');
		expect((await close.boundingBox())!.height).toBeGreaterThanOrEqual(44);
		await close.click();
		await expect(page.locator('.country-popup:not(.preview)')).toHaveCount(0);
	});

	test('still opens the country guide when the tap is away from every zone', async ({ page }) => {
		await openZones(page);
		const remote: [number, number] = [84.1, 28.3]; // the middle of Nepal, about 15 km from the nearest airport
		await focusOn(page, remote, ZOOM);
		await activate(page, await pointAt(page, remote));
		await expect(page.locator('#country-dialog')).toBeVisible();
		await expect(page.locator('.country-popup:not(.preview)')).toHaveCount(0);
	});
});

test.describe('zones are fetched lazily', () => {
	test('not at all while the globe is zoomed out, and once it is close enough to draw them', async ({ page }) => {
		// Regression: the 1.7 MB zones file used to download on every visit, even for people who never zoomed in.
		const requests: string[] = [];
		page.on('request', (r) => r.url().includes('/data/zones.json') && requests.push(r.url()));
		await openGlobe(page);
		await page.waitForTimeout(500);
		expect(requests).toHaveLength(0);
		await focusOn(page, KATHMANDU, 6);
		await expect(page.locator('#map[data-zones="ready"]')).toBeAttached({ timeout: 30_000 });
		expect(requests).toHaveLength(1);
	});
});

test.describe('when zones cannot be loaded', () => {
	test('says so plainly, and the map still works', async ({ page }) => {
		await page.route('**/data/zones.json', (route) => route.fulfill({ status: 500, body: 'no' }));
		await openGlobe(page);
		await focusOn(page, KATHMANDU, 6);
		await expect(page.locator('#zones-status')).toHaveText('Zones could not be loaded. The map still works.');
		await expect(page.locator('#map[data-zones="failed"]')).toBeAttached();
		await expect(page.locator('#map[data-ready="true"]')).toBeAttached();
	});
});

test.describe('zones data file', () => {
	test('is built from every zone file, with the zones and their sources', async ({ request }) => {
		const response = await request.get('/data/zones.json');
		expect(response.status()).toBe(200);
		expect(response.headers()['content-type']).toContain('application/json');
		const files = (await response.json()) as { meta: { iso3: string; sourceUrl: string }; features: unknown[] }[];
		expect(files.map((f) => f.meta.iso3).sort()).toEqual(['AUS', 'CAN', 'CHE', 'GBR', 'GBR', 'GBR', 'GBR', 'LUX', 'NPL', 'NPL', 'THA', 'THA']);
		for (const file of files) expect(file.meta.sourceUrl).toMatch(/^https:\/\//);
		expect(files.reduce((n, f) => n + f.features.length, 0)).toBeGreaterThan(1000);
	});
});
