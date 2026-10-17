// A country's outline as one SVG path, for the picture on its guide page. Flat (longitude scaled by cos latitude), so
// it is a recognisable silhouette, not a map. Far-flung territories (Hawaii, Guiana) are left out, as on the globe.
type Ring = number[][];
interface Feature {
	properties: { ADM0_A3?: string };
	geometry: { type: 'Polygon'; coordinates: Ring[] } | { type: 'MultiPolygon'; coordinates: Ring[][] } | null;
}

const box = (ring: Ring) => {
	const lons = ring.map((p) => p[0]);
	const lats = ring.map((p) => p[1]);
	return { w: Math.min(...lons), s: Math.min(...lats), e: Math.max(...lons), n: Math.max(...lats) };
};

export function outline(features: Feature[], iso3: string, width = 100): { d: string; width: number; height: number } | undefined {
	const geometry = features.find((f) => f.properties.ADM0_A3 === iso3)?.geometry;
	if (!geometry) return undefined;
	const outers = (geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates).map((p) => p[0]);
	const boxes = outers.map(box);
	const size = (b: ReturnType<typeof box>) => (b.e - b.w) * (b.n - b.s);
	const main = boxes.reduce((a, b) => (size(b) > size(a) ? b : a));
	// Keep the mainland and anything near it: whose middle is within half the mainland's size of its edge.
	const padX = (main.e - main.w) / 2;
	const padY = (main.n - main.s) / 2;
	const near = outers.filter((_, i) => {
		const b = boxes[i];
		const [cx, cy] = [(b.w + b.e) / 2, (b.s + b.n) / 2];
		return cx >= main.w - padX && cx <= main.e + padX && cy >= main.s - padY && cy <= main.n + padY;
	});
	const all = near.flat();
	const b = box(all);
	const k = Math.cos((((b.s + b.n) / 2) * Math.PI) / 180);
	const scale = width / ((b.e - b.w) * k);
	const height = (b.n - b.s) * scale;
	const d = near
		.map((ring) => 'M' + ring.map(([lon, lat]) => `${((lon - b.w) * k * scale).toFixed(1)} ${((b.n - lat) * scale).toFixed(1)}`).join('L') + 'Z')
		.join('');
	return { d, width, height: Number(height.toFixed(1)) };
}
