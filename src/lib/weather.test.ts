import { describe, expect, it } from 'vitest';
import { conditionNotes, parseWeather, weatherBlockHtml, weatherErrorMessage, weatherHtml, weatherPath, weatherUrl, type Weather } from './weather';

const calm: Weather = { time: '2026-10-18T14:15', temperature: 13.8, wind: 17.6, gusts: 20, precipitation: 0, visibilityM: 21560 };
const response = { current: { time: '2026-10-18T14:15', temperature_2m: 13.8, wind_speed_10m: 17.6, wind_gusts_10m: 38.2, precipitation: 0, visibility: 21560 } };

describe('weatherUrl', () => {
	it('rounds the point to 2 decimals and asks for the five readings in km/h', () => {
		const url = new URL(weatherUrl(51.493491, -0.131729));
		expect(url.origin).toBe('https://api.open-meteo.com');
		expect(url.searchParams.get('latitude')).toBe('51.49');
		expect(url.searchParams.get('longitude')).toBe('-0.13');
		expect(url.searchParams.get('current')).toBe('temperature_2m,wind_speed_10m,wind_gusts_10m,precipitation,visibility');
		expect(url.searchParams.get('wind_speed_unit')).toBe('kmh');
		expect(url.searchParams.get('timezone')).toBe('auto');
	});
});

describe('weatherPath', () => {
	it("is this site's own address with the point rounded to 2 decimals, never Open-Meteo's", () => {
		expect(weatherPath(51.493491, -0.131729)).toBe('/weather?lat=51.49&lon=-0.13');
	});
});

describe('parseWeather', () => {
	it('reads the current block', () => {
		expect(parseWeather(response)).toEqual({ time: '2026-10-18T14:15', temperature: 13.8, wind: 17.6, gusts: 38.2, precipitation: 0, visibilityM: 21560 });
	});

	it.each([null, 'x', {}, { current: null }, { current: { ...response.current, wind_gusts_10m: '38' } }, { current: { ...response.current, visibility: undefined } }, { current: { ...response.current, time: 5 } }])(
		'throws on a response it does not recognise: %j',
		(bad) => {
			expect(() => parseWeather(bad)).toThrow();
		},
	);
});

describe('conditionNotes', () => {
	it('has nothing to say about calm, dry, clear weather', () => {
		expect(conditionNotes(calm)).toEqual([]);
	});

	it('flags wind and gusts at the 38 km/h wind resistance DJI lists, not below it', () => {
		expect(conditionNotes({ ...calm, wind: 37.9, gusts: 37.9 })).toEqual([]);
		expect(conditionNotes({ ...calm, wind: 38 })).toHaveLength(1);
		expect(conditionNotes({ ...calm, gusts: 38.2 })[0]).toMatch(/Gusts 38 km\/h/);
	});

	it('flags any rain or snow', () => {
		expect(conditionNotes({ ...calm, precipitation: 0.1 })[0]).toMatch(/waterproof/);
	});

	it('flags visibility under 5 km, not at it', () => {
		expect(conditionNotes({ ...calm, visibilityM: 5000 })).toEqual([]);
		expect(conditionNotes({ ...calm, visibilityM: 4999 })[0]).toMatch(/in sight/);
	});

	it('flags temperatures outside -10 to 40, not on the edge', () => {
		expect(conditionNotes({ ...calm, temperature: -10 })).toEqual([]);
		expect(conditionNotes({ ...calm, temperature: 40 })).toEqual([]);
		expect(conditionNotes({ ...calm, temperature: -10.1 })).toHaveLength(1);
		expect(conditionNotes({ ...calm, temperature: 40.1 })).toHaveLength(1);
	});

	it('never gives a verdict', () => {
		const worst: Weather = { ...calm, wind: 90, gusts: 120, precipitation: 9, visibilityM: 100, temperature: -30 };
		const text = [...conditionNotes(worst), weatherHtml(worst), weatherBlockHtml(1, 2), weatherErrorMessage()].join(' ');
		expect(text).not.toMatch(/you can fly|allowed to fly|safe to fly|not safe|unsafe|\bsafe\b/i);
	});
});

describe('weatherHtml', () => {
	it('shows each reading, the time there, the notes and the Open-Meteo credit', () => {
		const html = weatherHtml({ ...calm, gusts: 45 });
		expect(html).toContain('13.8 °C');
		expect(html).toContain('17.6 km/h');
		expect(html).toContain('45 km/h');
		expect(html).toContain('0 mm');
		expect(html).toContain('21.6 km');
		expect(html).toContain('2026-10-18 14:15');
		expect(html).toContain('local time there');
		expect(html).toContain('<a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Open-Meteo.com</a>');
		expect(html).toContain('Gusts 45 km/h');
	});

	it('escapes the time it was given', () => {
		expect(weatherHtml({ ...calm, time: '<script>' })).not.toContain('<script>');
	});
});

describe('weatherBlockHtml', () => {
	it('has a button carrying the rounded point, a notice that says what is sent, and an empty result region', () => {
		const html = weatherBlockHtml(51.493491, -0.131729);
		expect(html).toContain('data-weather');
		expect(html).toContain('data-lat="51.49"');
		expect(html).toContain('data-lon="-0.13"');
		expect(html).toContain('Show weather here');
		expect(html).toMatch(/rounded to about 1 km.*our server.*Open-Meteo never sees your address/);
		expect(html).toContain('role="status"');
	});
});
