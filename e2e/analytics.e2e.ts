import { expect, test } from '@playwright/test';
import { ANALYTICS_HOSTS, ANALYTICS_TOKEN } from '../src/lib/site';

const BEACON = 'https://static.cloudflareinsights.com/beacon.min.js';

test.describe('Cloudflare Web Analytics', () => {
	for (const path of ['/', '/countries/', '/countries/japan/', '/privacy/', '/contact/']) {
		test(`${path} carries the beacon with this site's token, once`, async ({ page }) => {
			await page.goto(path);
			const beacon = page.locator('script[data-cf-beacon]');
			await expect(beacon).toHaveCount(1);
			await expect(beacon).toHaveAttribute('src', BEACON);
			const config = JSON.parse((await beacon.getAttribute('data-cf-beacon'))!);
			expect(config).toEqual({ token: ANALYTICS_TOKEN });
		});
	}

	test('asks for the beacon script from Cloudflare', async ({ page }) => {
		const asked = page.waitForRequest((r) => r.url() === BEACON);
		await page.goto('/privacy/');
		expect((await asked).url()).toBe(BEACON);
	});

	test('only contacts Cloudflare analytics addresses outside this site', async ({ page }) => {
		const hosts = new Set<string>();
		const site = new URL(test.info().project.use.baseURL!).origin;
		page.on('request', (r) => {
			const url = new URL(r.url());
			if (url.protocol.startsWith('http') && url.origin !== site) hosts.add(url.hostname);
		});
		await page.goto('/privacy/');
		await page.waitForLoadState('load');
		for (const host of hosts) expect(ANALYTICS_HOSTS).toContain(host);
	});

	test('is not set in a way that stores anything in the browser', async ({ page, context }) => {
		// The privacy page promises no cookies and nothing saved in the browser, with the real beacon running.
		await page.goto('/privacy/');
		await page.waitForTimeout(1500);
		expect(await context.cookies()).toEqual([]);
		expect(await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length }))).toEqual({ local: 0, session: 0 });
	});

	test('is explained on the privacy page', async ({ page }) => {
		await page.goto('/privacy/');
		await expect(page.getByText('Cloudflare Web Analytics').first()).toBeVisible();
		await expect(page.getByRole('link', { name: /how Cloudflare Web Analytics works/ })).toHaveAttribute('href', /developers\.cloudflare\.com\/web-analytics/);
		await expect(page.getByText('does not track individual visitors')).toBeVisible();
		await expect(page.getByText('no analytics')).toHaveCount(0);
	});
});
