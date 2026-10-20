import { escapeHtml } from './popup';
import { linkAttrsHtml } from './external-link';

export interface Weather {
	// Local time at the spot, as Open-Meteo gives it: 2026-10-18T14:15.
	time: string;
	temperature: number; // °C
	wind: number; // km/h
	gusts: number; // km/h
	precipitation: number; // mm
	visibilityM: number; // metres
}

// Typical limits, not rules. Sources and dates are in SOURCES.md ("Weather").
const WIND_LIMIT_KMH = 38; // DJI Mini 4 Pro flight manual 2.8: wind over 10.7 m/s prohibited; smaller or older drones are rated lower
const VISIBILITY_LIMIT_M = 5000; // SERA.5001 flight visibility for crewed VFR below 3050 m, a rough guide; drone rules only say keep it in sight
const TEMPERATURE_RANGE_C = [-10, 40]; // DJI Mini 4 Pro flight manual 2.8: flyable -10 to 40 °C

const OPEN_METEO = 'https://open-meteo.com/';
const round = (degrees: number) => degrees.toFixed(2);

// Two decimals is about 1 km: enough for the weather, and not an exact spot.
export function weatherUrl(lat: number, lon: number): string {
	const params = new URLSearchParams({
		latitude: round(lat),
		longitude: round(lon),
		current: 'temperature_2m,wind_speed_10m,wind_gusts_10m,precipitation,visibility',
		wind_speed_unit: 'kmh',
		timezone: 'auto',
	});
	return `https://api.open-meteo.com/v1/forecast?${params}`;
}

// Where the page asks for the weather: this site's own Worker, never Open-Meteo itself.
export const weatherPath = (lat: number, lon: number) => `/weather?lat=${round(lat)}&lon=${round(lon)}`;

export function parseWeather(json: unknown): Weather {
	const current = (json as { current?: Record<string, unknown> } | null)?.current;
	if (typeof current !== 'object' || current === null) throw new Error('No current weather in the response');
	const num = (key: string) => {
		const value = current[key];
		if (typeof value !== 'number') throw new Error(`Missing ${key}`);
		return value;
	};
	if (typeof current.time !== 'string') throw new Error('Missing time');
	return {
		time: current.time,
		temperature: num('temperature_2m'),
		wind: num('wind_speed_10m'),
		gusts: num('wind_gusts_10m'),
		precipitation: num('precipitation'),
		visibilityM: num('visibility'),
	};
}

// What the readings mean for a small drone, as notes. Never a verdict on whether to fly.
export function conditionNotes(w: Weather): string[] {
	const notes: string[] = [];
	if (w.wind >= WIND_LIMIT_KMH) notes.push(`Wind ${Math.round(w.wind)} km/h is at or above what many small drones are rated for (about ${WIND_LIMIT_KMH} km/h).`);
	if (w.gusts >= WIND_LIMIT_KMH) notes.push(`Gusts ${Math.round(w.gusts)} km/h are at or above what many small drones are rated for (about ${WIND_LIMIT_KMH} km/h).`);
	if (w.precipitation > 0) notes.push('Rain or snow is falling. Some makers, such as DJI for the Mini 4 Pro, list rain and snow as conditions not to fly in. Check your drone\'s manual.');
	if (w.visibilityM < VISIBILITY_LIMIT_M) notes.push('Visibility is under 5 km, the minimum crewed-aircraft pilots flying by sight use, so it may be harder to keep your drone in sight.');
	if (w.temperature < TEMPERATURE_RANGE_C[0] || w.temperature > TEMPERATURE_RANGE_C[1]) notes.push(`${w.temperature} °C is outside the ${TEMPERATURE_RANGE_C[0]} to ${TEMPERATURE_RANGE_C[1]} °C operating range many drones list.`);
	return notes;
}

// 51.49° N, 0.13° W: the point that was asked about, as rounded for the request.
export function formatPoint(lat: number, lon: number): string {
	return `${Math.abs(+round(lat)).toFixed(2)}° ${lat < 0 ? 'S' : 'N'}, ${Math.abs(+round(lon)).toFixed(2)}° ${lon < 0 ? 'W' : 'E'}`;
}

export function weatherHtml(w: Weather, lat: number, lon: number): string {
	const row = (label: string, value: string) => `<dt>${label}</dt><dd>${value}</dd>`;
	const notes = conditionNotes(w);
	return (
		`<p class="weather-place">Weather at ${formatPoint(lat, lon)}, within about 1 km</p>` +
		`<dl>${row('Wind', `${w.wind} km/h`)}${row('Gusts', `${w.gusts} km/h`)}${row('Rain', `${w.precipitation} mm`)}${row('Visibility', `${+(w.visibilityM / 1000).toFixed(1)} km`)}${row('Temperature', `${w.temperature} °C`)}</dl>` +
		(notes.length ? `<ul class="weather-notes">${notes.map((n) => `<li>${escapeHtml(n)}</li>`).join('')}</ul><p class="muted">Check your own drone's manual for its limits.</p>` : '') +
		`<p class="muted">At ${escapeHtml(w.time.replace('T', ' '))}, local time there. Weather data by <a href="${OPEN_METEO}"${linkAttrsHtml(OPEN_METEO)}>Open-Meteo.com</a>.</p>`
	);
}

export function weatherErrorMessage(): string {
	return "Couldn't load the weather. Check your connection and try again.";
}

// The opt-in: nothing is requested until the button is pressed.
export function weatherBlockHtml(lat: number, lon: number): string {
	return (
		`<div class="weather"><button type="button" class="weather-button" data-weather data-lat="${round(lat)}" data-lon="${round(lon)}">Show weather here</button>` +
		`<p class="muted weather-notice">Pressing this sends this spot, rounded to about 1 km, to our server, which asks Open-Meteo for the weather, so Open-Meteo never sees your address. Nothing is sent until you press it.</p>` +
		`<div class="weather-result" role="status"></div></div>`
	);
}
