export type Bounds = [west: number, south: number, east: number, north: number];

type Ring = number[][];
interface Feature {
	properties: { ADM0_A3?: string };
	geometry: { type: 'Polygon'; coordinates: Ring[] } | { type: 'MultiPolygon'; coordinates: Ring[][] } | null;
}

const boundsOf = (outer: Ring): Bounds => {
	const lons = outer.map((p) => p[0]);
	const lats = outer.map((p) => p[1]);
	return [Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats)];
};
const area = ([w, s, e, n]: Bounds) => (e - w) * (n - s);

// The bounding box of each country's largest polygon, by iso3. Using the largest one keeps the camera on the mainland
// for countries with far-flung territories (the US with Hawaii, France with Guiana).
export function mainlandBounds(features: Feature[], iso3s: string[]): Record<string, Bounds> {
	const wanted = new Set(iso3s);
	const out: Record<string, Bounds> = {};
	for (const { properties, geometry } of features) {
		const iso3 = properties.ADM0_A3;
		if (!iso3 || !wanted.has(iso3) || !geometry) continue;
		const outers = geometry.type === 'Polygon' ? [geometry.coordinates[0]] : geometry.coordinates.map((p) => p[0]);
		out[iso3] = outers.map(boundsOf).reduce((a, b) => (area(b) > area(a) ? b : a));
	}
	return out;
}
