import { expect, test, type Page } from '@playwright/test';
import { activate, focusOn, highlightedAt, openGlobe, pointAt } from './helpers';

// Links to other sites open in a new tab, and links within the site stay in this one.
const NEPAL: [number, number] = [84.1, 28.3];
// Thailand has a registration link, so its summary has a link to another site.
const THAILAND: [number, number] = [101, 15.5];

interface Link {
	href: string;
	target: string | null;
	rel: string | null;
}

async function linksIn(scope: import('@playwright/test').Locator): Promise<Link[]> {
	return scope.locator('a[href]').evaluateAll((anchors) =>
		anchors.map((a) => ({ href: a.getAttribute('href')!, target: a.getAttribute('target'), rel: a.getAttribute('rel') })),
	);
}

// MapLibre's own "MapLibre" credit has a new-tab target but no rel; browsers imply noopener for it.
function expectNewTabRules(links: Link[], { rel = true } = {}) {
	expect(links.length).toBeGreaterThan(0);
	for (const link of links) {
		if (/^https?:\/\//.test(link.href)) {
			expect(link.target, link.href).toBe('_blank');
			if (rel) {
				expect(link.rel, link.href).toContain('noopener');
				expect(link.rel, link.href).toContain('noreferrer');
			}
		} else {
			expect(link.target, link.href).toBeNull();
		}
	}
	return links.filter((l) => /^https?:\/\//.test(l.href)).length;
}

test.describe('external links open in a new tab', () => {
	for (const path of ['/countries/nepal/', '/countries/thailand/', '/countries/united-states/', '/contact/', '/privacy/']) {
		test(`${path}: other sites open in a new tab, this site does not`, async ({ page }) => {
			await page.goto(path);
			const external = expectNewTabRules(await linksIn(page.locator('main')));
			expect(external).toBeGreaterThan(0);
		});
	}

	test('the guide register link and sources open in a new tab', async ({ page }) => {
		await page.goto('/countries/nepal/');
		// Nepal has no registration page yet, so its main button goes to the authority.
		await expect(page.getByRole('link', { name: 'Go to the official source' }).first()).toHaveAttribute('target', '_blank');
		await expect(page.getByRole('link', { name: 'Report a mistake in this guide' })).toHaveAttribute('target', '_blank');
	});

	test('the map attribution links open in a new tab', async ({ page }) => {
		await openGlobe(page);
		const links = await linksIn(page.locator('.maplibregl-ctrl-attrib'));
		expect(links.length).toBeGreaterThan(0);
		expectNewTabRules(links, { rel: false });
	});

	test('the summary opened from the map links out in a new tab, and to the full guide in this one', async ({ page }) => {
		await openGlobe(page);
		await focusOn(page, THAILAND, 4);
		await expect.poll(() => highlightedAt(page, THAILAND)).toContain('THA');
		await activate(page, await pointAt(page, THAILAND));
		const dialog = page.locator('#country-dialog');
		await expect(dialog).toBeVisible();
		await expect(dialog.getByRole('link', { name: 'Register online' })).toHaveAttribute('target', '_blank');
		expect(await dialog.getByRole('link', { name: 'Read the full guide' }).getAttribute('target')).toBeNull();
	});
});
