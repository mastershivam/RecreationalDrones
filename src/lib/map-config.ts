export const GLOBE_PROJECTION = { type: 'globe' } as const;

// Matches the countries layer features whose ADM0_A3 has a guide.
export function coveredCountriesFilter(guides: Record<string, string>) {
	return ['in', ['get', 'ADM0_A3'], ['literal', Object.keys(guides)]] as const;
}

// Guide URL for a clicked map feature, or undefined if the country has no guide.
export function guideForFeature(
	feature: { properties?: Record<string, unknown> } | undefined,
	guides: Record<string, string>,
): string | undefined {
	const iso3 = feature?.properties?.ADM0_A3;
	return typeof iso3 === 'string' ? guides[iso3] : undefined;
}

export interface MapColors {
	ocean: string;
	land: string;
	landBorder: string;
	text: string;
	textMuted: string;
	accent: string;
	night: string;
}

export const MAP_COLOR_TOKENS: Record<keyof MapColors, string> = {
	ocean: '--color-ocean',
	land: '--color-land',
	landBorder: '--color-land-border',
	text: '--color-text',
	textMuted: '--color-text-muted',
	accent: '--color-accent',
	night: '--color-night',
};

// Reads the map colors from CSS custom properties; `read` is getComputedStyle(...).getPropertyValue in the browser.
export function readMapColors(read: (name: string) => string): MapColors {
	const entries = Object.entries(MAP_COLOR_TOKENS).map(([key, name]) => {
		const value = read(name).trim();
		if (!value) throw new Error(`Design token ${name} is not defined`);
		return [key, value];
	});
	return Object.fromEntries(entries) as unknown as MapColors;
}

// Zoom at which the whole globe fits the smaller screen dimension, with a little margin.
// A globe is about 512 / pi pixels across at zoom 0, and doubles with each zoom level.
export function initialZoom(width: number, height: number): number {
	const fit = (0.9 * Math.min(width, height) * Math.PI) / 512;
	return Math.min(3, Math.max(0.5, Math.log2(fit)));
}

// Fingers are bigger than cursors, so taps look for countries within this many pixels.
export const TAP_RADIUS_PX = 14;

export function tapBox(point: { x: number; y: number }, radius = TAP_RADIUS_PX): [[number, number], [number, number]] {
	return [
		[point.x - radius, point.y - radius],
		[point.x + radius, point.y + radius],
	];
}
