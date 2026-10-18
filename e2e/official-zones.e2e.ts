import { expect, test, type Page } from '@playwright/test';
import { focusOn, openGlobe } from './helpers';

// Zones drawn from an authority's own zones file (data/zones/*-official.geojson), not circles we drew.
const ZONE_LAYERS = ['zones-fill', 'zones-airport-line', 'zones-approval-line', 'zones-points'];
const ZURICH_AIRPORT: [number, number] = [8.5492, 47.4582];

function kindsShown(page: Page) {
	return page.evaluate(
		(layers) => [...new Set((window as any).__map.queryRenderedFeatures(undefined, { layers }).map((f: any) => f.properties.kind))].sort(),
		ZONE_LAYERS,
	);
}

test.describe('official zone outlines', () => {
	test('Switzerland: draws the authority\'s airport outline round Zurich, with no radius of ours', async ({ page }) => {
		await openGlobe(page);
		await focusOn(page, ZURICH_AIRPORT, 6);
		await expect(page.locator('#map[data-zones="ready"]')).toBeAttached({ timeout: 30_000 });
		await focusOn(page, ZURICH_AIRPORT, 8);
		await expect.poll(() => kindsShown(page)).toContain('airport-zone');
		const zone = await page.evaluate(
			(layers) => (window as any).__map.queryRenderedFeatures(undefined, { layers }).find((f: any) => f.properties.kind === 'airport-zone')?.properties,
			ZONE_LAYERS,
		);
		expect(zone.iso3).toBe('CHE');
		expect(zone.shape).toBeDefined();
	});

	test('the "Airport zones" box switches the official outlines off and on with the circles', async ({ page }) => {
		await openGlobe(page);
		await focusOn(page, ZURICH_AIRPORT, 6);
		await expect(page.locator('#map[data-zones="ready"]')).toBeAttached({ timeout: 30_000 });
		await focusOn(page, ZURICH_AIRPORT, 8);
		await expect.poll(() => kindsShown(page)).toContain('airport-zone');
		const panel = page.locator('#layers');
		if (!(await panel.evaluate((d: HTMLDetailsElement) => d.open))) await panel.locator('summary').click();
		await page.getByRole('checkbox', { name: 'Airport zones' }).uncheck();
		await expect.poll(() => kindsShown(page)).not.toContain('airport-zone');
		await page.getByRole('checkbox', { name: 'Airport zones' }).check();
		await expect.poll(() => kindsShown(page)).toContain('airport-zone');
	});
});
