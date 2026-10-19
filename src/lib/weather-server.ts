import { parseWeather, weatherUrl } from './weather';

export const WEATHER_PATH = '/weather';

type Fetcher = (url: string, init?: RequestInit) => Promise<Response>;

// Asks Open-Meteo for the weather at ?lat=&lon= on the visitor's behalf, so the visitor's address and browser
// details never reach Open-Meteo: only this Worker's request does, with the point rounded to about 1 km.
export async function handleWeatherRequest(request: Request, fetchUpstream: Fetcher = fetch): Promise<Response> {
	const url = new URL(request.url);
	if (url.pathname !== WEATHER_PATH) return new Response('Not found', { status: 404 });
	if (request.method !== 'GET') return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET' } });

	const coordinate = (name: string, limit: number) => {
		const text = url.searchParams.get(name);
		const value = text === null || text.trim() === '' ? NaN : Number(text);
		return Math.abs(value) <= limit ? value : null;
	};
	const lat = coordinate('lat', 90);
	const lon = coordinate('lon', 180);
	if (lat === null || lon === null) return new Response('Need lat and lon, as numbers in range', { status: 400 });

	try {
		// shortcut: Cloudflare keeps each rounded point for 10 minutes; a shared limit on Open-Meteo's side would need a real cache.
		const upstream = await fetchUpstream(weatherUrl(lat, lon), { cf: { cacheEverything: true, cacheTtl: 600 } } as RequestInit);
		if (!upstream.ok) throw new Error(String(upstream.status));
		return Response.json(parseWeather(await upstream.json()), { headers: { 'Cache-Control': 'public, max-age=300' } });
	} catch {
		return new Response('Weather unavailable', { status: 502 });
	}
}
