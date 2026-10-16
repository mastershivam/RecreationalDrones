type Position = number[];
type Geometry =
	| { type: 'Polygon'; coordinates: Position[][] }
	| { type: 'MultiPolygon'; coordinates: Position[][][] };

interface Feature {
	type: 'Feature';
	properties: Record<string, unknown>;
	geometry: Geometry | null;
}

interface FeatureCollection {
	type: 'FeatureCollection';
	features: Feature[];
}

function roundTo(value: number, decimals: number): number {
	const factor = 10 ** decimals;
	return Math.round(value * factor) / factor;
}

// Rounds a ring and drops points that become identical to their neighbour.
// Returns null if fewer than 4 points (the minimum for a closed ring) survive.
function simplifyRing(ring: Position[], decimals: number): Position[] | null {
	const out: Position[] = [];
	for (const [lon, lat] of ring) {
		const point = [roundTo(lon, decimals), roundTo(lat, decimals)];
		const last = out[out.length - 1];
		if (!last || last[0] !== point[0] || last[1] !== point[1]) out.push(point);
	}
	return out.length >= 4 ? out : null;
}

function simplifyPolygon(rings: Position[][], decimals: number): Position[][] | null {
	const [outer, ...holes] = rings.map((r) => simplifyRing(r, decimals));
	if (!outer) return null; // A polygon without an outer ring has no area left.
	return [outer, ...holes.filter((h): h is Position[] => h !== null)];
}

// Keeps only what the map needs from a Natural Earth countries file:
// ADM0_A3 (the code guides are keyed on) and NAME, with coordinates rounded to `decimals` places.
export function trimCountries(input: FeatureCollection, decimals = 2): FeatureCollection {
	const features: Feature[] = [];
	for (const { properties, geometry } of input.features) {
		if (!geometry) continue;
		const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
		const kept = polygons.map((p) => simplifyPolygon(p, decimals)).filter((p): p is Position[][] => p !== null);
		if (kept.length === 0) continue;
		features.push({
			type: 'Feature',
			properties: { ADM0_A3: properties.ADM0_A3, NAME: properties.NAME },
			geometry: { type: 'MultiPolygon', coordinates: kept },
		});
	}
	return { type: 'FeatureCollection', features };
}
