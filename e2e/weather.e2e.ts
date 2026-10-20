import { expect, test, type Page } from '@playwright/test';
import { activate, openGlobe, ukPoint } from './helpers';

const dialog = (page: Page) => page.locator('#country-dialog');
const button = (page: Page) => page.getByRole('button', { name: 'Show weather here' });

// What the site's own /weather answers (the Worker has its own unit tests).
const REPLY = { time: '2026-10-18T14:15', temperature: 13.8, wind: 17.6, gusts: 45, precipitation: 0, visibilityM: 21560 };
const ENDPOINT = '**/weather?*';

// Answers /weather itself, so tests never depend on the Worker reaching the real service. Also records any
// request the browser makes straight to Open-Meteo, which must never happen.
async function mockWeather(page: Page, requests: string[], reply: 'ok' | 'fail' = 'ok') {
	page.on('request', (r) => expect(r.url(), 'the browser must not contact Open-Meteo').not.toMatch(/open-meteo\.com\/v1/));
	await page.route(ENDPOINT, (route) => {
		requests.push(route.request().url());
		return reply === 'ok' ? route.fulfill({ json: REPLY }) : route.fulfill({ status: 500, body: 'no' });
	});
}

async function openUkSummary(page: Page) {
	await activate(page, await ukPoint(page));
	await expect(dialog(page).getByRole('heading', { level: 1 })).toHaveText('Drone rules in United Kingdom', { timeout: 15_000 });
}

test.describe('weather at a clicked place', () => {
	test('sends nothing until the button is pressed, then shows the readings, the time and the credit', async ({ page }) => {
		const requests: string[] = [];
		await mockWeather(page, requests);
		await openGlobe(page);
		await openUkSummary(page);
		await expect(button(page)).toBeVisible();
		await expect(dialog(page)).toContainText('Nothing is sent until you press it');
		expect(requests).toEqual([]);

		await button(page).click();
		const result = dialog(page).locator('.weather-result');
		await expect(result.locator('.weather-place')).toHaveText(/^Weather at \d+\.\d+° N, \d+\.\d+° [EW], within about 1 km$/);
		await expect(result).toContainText('17.6 km/h');
		await expect(result).toContainText('45 km/h');
		await expect(result).toContainText('21.6 km');
		await expect(result).toContainText('13.8 °C');
		await expect(result).toContainText('2026-10-18 14:15');
		await expect(result.getByRole('link', { name: 'Open-Meteo.com' })).toHaveAttribute('href', 'https://open-meteo.com/');
		await expect(result).toContainText('Gusts 45 km/h');
		await expect(result).not.toContainText(/safe to fly|you can fly|allowed to fly/i);
		expect(requests).toHaveLength(1);
	});

	test('sends the clicked spot, rounded to 2 decimals, to this site and not to Open-Meteo', async ({ page }) => {
		const requests: string[] = [];
		await mockWeather(page, requests);
		await openGlobe(page);
		await openUkSummary(page);
		await button(page).click();
		await expect(dialog(page).locator('.weather-result')).toContainText('km/h');
		const url = new URL(requests[0]);
		expect(url.pathname).toBe('/weather');
		expect(url.origin).toBe(new URL(page.url()).origin);
		expect(url.searchParams.get('lat')).toMatch(/^-?\d+\.\d\d$/);
		expect(url.searchParams.get('lon')).toMatch(/^-?\d+\.\d\d$/);
		expect(Number(url.searchParams.get('lat'))).toBeGreaterThan(50);
		expect(Number(url.searchParams.get('lat'))).toBeLessThan(58);
	});

	test('says plainly when the weather cannot be loaded, and lets the visitor try again', async ({ page }) => {
		const requests: string[] = [];
		await mockWeather(page, requests, 'fail');
		await openGlobe(page);
		await openUkSummary(page);
		await button(page).click();
		await expect(dialog(page).locator('.weather-result')).toHaveText("Couldn't load the weather. Check your connection and try again.");
		await expect(button(page)).toBeEnabled();
		await page.unroute(ENDPOINT);
		await mockWeather(page, requests);
		await button(page).click();
		await expect(dialog(page).locator('.weather-result')).toContainText('17.6 km/h');
	});

	test('fits on the screen', async ({ page }) => {
		await mockWeather(page, []);
		await openGlobe(page);
		await openUkSummary(page);
		await button(page).click();
		await expect(dialog(page).locator('.weather-result')).toContainText('km/h');
		const panel = (await dialog(page).locator('.dialog-panel').boundingBox())!;
		expect(panel.x + panel.width).toBeLessThanOrEqual(page.viewportSize()!.width);
	});
});

test.describe('the /weather address', () => {
	test('is answered by the Worker, not served as a page, and rejects a bad point without calling Open-Meteo', async ({ request }) => {
		const bad = await request.get('/weather?lat=x&lon=1');
		expect(bad.status()).toBe(400);
		expect(await bad.text()).toContain('lat and lon');
		expect((await request.post('/weather?lat=1&lon=2')).status()).toBe(405);
	});
});

test.describe('weather from "Near me"', () => {
	test.use({ permissions: ['geolocation'], geolocation: { latitude: 35.6812, longitude: 139.6944 } });

	test('sends nothing when the position is found, and only the rounded position once the button is pressed', async ({ page }) => {
		const requests: string[] = [];
		await mockWeather(page, requests);
		await openGlobe(page);
		await page.getByRole('button', { name: 'Near me: use my location' }).click();
		await expect(dialog(page).getByRole('heading', { level: 1 })).toHaveText('Drone rules in Japan', { timeout: 15_000 });
		await expect(button(page)).toBeVisible();
		expect(requests).toEqual([]);
		await button(page).click();
		await expect(dialog(page).locator('.weather-place')).toHaveText('Weather at 35.68° N, 139.69° E, within about 1 km');
		expect(requests).toHaveLength(1);
		const url = new URL(requests[0]);
		expect(url.origin).toBe(new URL(page.url()).origin);
		expect([url.searchParams.get('lat'), url.searchParams.get('lon')]).toEqual(['35.68', '139.69']);
	});
});
