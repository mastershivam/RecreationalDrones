type Ring = number[][];
interface Country {
	properties: { ADM0_A3?: string; NAME?: string };
	geometry: { type: 'Polygon'; coordinates: Ring[] } | { type: 'MultiPolygon'; coordinates: Ring[][] } | null;
}

// Ray casting: a point is inside a ring if a ray to the east crosses its edges an odd number of times.
function inRing(lon: number, lat: number, ring: Ring): boolean {
	let inside = false;
	for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
		const [xi, yi] = ring[i];
		const [xj, yj] = ring[j];
		if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
	}
	return inside;
}

// Inside the outer ring and outside every hole.
const inPolygon = (lon: number, lat: number, [outer, ...holes]: Ring[]) => inRing(lon, lat, outer) && !holes.some((h) => inRing(lon, lat, h));

// The country shape a position falls in, or undefined (at sea, or where the shapes are coarse).
// shortcut: ignores shapes that cross the antimeridian, and the coast is as coarse as the 50m shapes.
export function countryAt(lon: number, lat: number, countries: Country[]): { iso3: string; name: string } | undefined {
	for (const { properties, geometry } of countries) {
		if (!geometry || !properties.ADM0_A3) continue;
		const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
		if (polygons.some((p) => inPolygon(lon, lat, p))) return { iso3: properties.ADM0_A3, name: properties.NAME ?? properties.ADM0_A3 };
	}
	return undefined;
}

// What to tell someone whose position is not in a country we have a guide for.
export function locatedMessage(country: { name: string } | undefined, hasGuide: boolean): string {
	if (!country) return 'Your location is not inside any country shape we have. You may be at sea.';
	return hasGuide ? `You are in ${country.name}.` : `You are in ${country.name}. We have no guide for it yet.`;
}

// GeolocationPositionError codes: 1 denied, 2 unavailable, 3 timed out.
export function locateErrorMessage(code: number): string {
	if (code === 1) return 'Location permission was denied. You can still search for a country.';
	if (code === 3) return 'Finding your location took too long. Try again, or search for a country.';
	return 'Your location could not be found. You can still search for a country.';
}
