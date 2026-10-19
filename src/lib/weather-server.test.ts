import { describe, expect, it, vi } from 'vitest';
import { handleWeatherRequest } from './weather-server';

const upstreamBody = { current: { time: '2026-10-18T14:15', temperature_2m: 13.8, wind_speed_10m: 17.6, wind_gusts_10m: 38.2, precipitation: 0, visibility: 21560 }, latitude: 51.49, elevation: 1 };
const ok = () => vi.fn(async (_url: string, _init?: RequestInit) => Response.json(upstreamBody));
const get = (query: string, init?: RequestInit) => new Request(`https://example.com/weather${query}`, init);

describe('handleWeatherRequest', () => {
	it('asks Open-Meteo for the rounded point and returns just the readings', async () => {
		const fetchUpstream = ok();
		const response = await handleWeatherRequest(get('?lat=51.493491&lon=-0.131729'), fetchUpstream);
		const asked = new URL(fetchUpstream.mock.calls[0][0]);
		expect(asked.origin).toBe('https://api.open-meteo.com');
		expect(asked.searchParams.get('latitude')).toBe('51.49');
		expect(asked.searchParams.get('longitude')).toBe('-0.13');
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ time: '2026-10-18T14:15', temperature: 13.8, wind: 17.6, gusts: 38.2, precipitation: 0, visibilityM: 21560 });
	});

	it("passes nothing of the visitor's request on to Open-Meteo", async () => {
		const fetchUpstream = ok();
		await handleWeatherRequest(get('?lat=1&lon=2', { headers: { 'CF-Connecting-IP': '203.0.113.9', 'User-Agent': 'SecretBrowser', Cookie: 'a=b' } }), fetchUpstream);
		const [, init] = fetchUpstream.mock.calls[0];
		expect(init?.headers).toBeUndefined();
		expect(JSON.stringify(fetchUpstream.mock.calls)).not.toMatch(/203\.0\.113\.9|SecretBrowser|a=b/);
	});

	it.each(['', '?lat=1', '?lon=1', '?lat=x&lon=1', '?lat=&lon=1', '?lat=91&lon=0', '?lat=0&lon=181', '?lat=Infinity&lon=0'])('rejects %j without calling Open-Meteo', async (query) => {
		const fetchUpstream = ok();
		expect((await handleWeatherRequest(get(query), fetchUpstream)).status).toBe(400);
		expect(fetchUpstream).not.toHaveBeenCalled();
	});

	it('accepts the edges of the range', async () => {
		expect((await handleWeatherRequest(get('?lat=-90&lon=180'), ok())).status).toBe(200);
	});

	it('answers 502 when Open-Meteo fails, is down, or sends something unexpected', async () => {
		for (const fetchUpstream of [vi.fn(async () => new Response('no', { status: 500 })), vi.fn(async () => Promise.reject(new Error('down'))), vi.fn(async () => Response.json({ nope: 1 }))]) {
			expect((await handleWeatherRequest(get('?lat=1&lon=2'), fetchUpstream)).status).toBe(502);
		}
	});

	it('only answers GET at /weather', async () => {
		expect((await handleWeatherRequest(get('?lat=1&lon=2', { method: 'POST' }), ok())).status).toBe(405);
		expect((await handleWeatherRequest(new Request('https://example.com/other?lat=1&lon=2'), ok())).status).toBe(404);
	});
});
