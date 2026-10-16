const RAD = Math.PI / 180;

function normalizeLon(deg: number): number {
	return ((((deg + 180) % 360) + 360) % 360) - 180;
}

// Point on Earth where the sun is directly overhead, accurate to roughly a degree.
export function subsolarPoint(date: Date): { lat: number; lon: number } {
	const n = date.getTime() / 86400000 + 2440587.5 - 2451545.0; // days since J2000
	const meanLon = 280.46 + 0.9856474 * n;
	const anomaly = (357.528 + 0.9856003 * n) * RAD;
	const eclipticLon = (meanLon + 1.915 * Math.sin(anomaly) + 0.02 * Math.sin(2 * anomaly)) * RAD;
	const obliquity = (23.439 - 0.0000004 * n) * RAD;

	const dec = Math.asin(Math.sin(obliquity) * Math.sin(eclipticLon));
	const ra = Math.atan2(Math.cos(obliquity) * Math.sin(eclipticLon), Math.cos(eclipticLon));
	const gmst = 280.46061837 + 360.98564736629 * n;
	return { lat: dec / RAD, lon: normalizeLon(ra / RAD - gmst) };
}

type Position = [number, number];

// Night side of the Earth: a polygon bounded by the day/night line, plus the line itself.
export function nightGeoJSON(date: Date, stepDeg = 1) {
	const { lat: sunLat, lon: sunLon } = subsolarPoint(date);
	// tan(0) would divide by zero at the equinoxes.
	const dec = Math.abs(sunLat) < 1e-6 ? 1e-6 : sunLat * RAD;

	const line: Position[] = [];
	for (let lon = -180; lon <= 180; lon += stepDeg) {
		const hourAngle = (lon - sunLon) * RAD;
		line.push([lon, Math.atan(-Math.cos(hourAngle) / Math.tan(dec)) / RAD]);
	}

	// The pole that is in darkness closes the polygon.
	const pole = sunLat >= 0 ? -90 : 90;
	const ring: Position[] = [...line, [180, pole], [-180, pole], line[0]];

	return {
		type: 'FeatureCollection' as const,
		features: [
			{ type: 'Feature' as const, properties: { kind: 'night' }, geometry: { type: 'Polygon' as const, coordinates: [ring] } },
			{ type: 'Feature' as const, properties: { kind: 'terminator' }, geometry: { type: 'LineString' as const, coordinates: line } },
		],
	};
}
