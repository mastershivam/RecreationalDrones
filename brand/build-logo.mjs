// Generates the logo files in brand/ from the Natural Earth country shapes the site already uses.
// Needs d3-geo, which the project does not depend on, so install it without saving:
//   npm i --no-save d3-geo && node brand/build-logo.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { geoOrthographic, geoPath } from 'd3-geo';

const root = new URL('../', import.meta.url);
const countries = JSON.parse(readFileSync(new URL('public/data/countries.geojson', root), 'utf8'));

const C = { ocean: '#040b1c', land: '#3f5f94', mist: '#9bb3dd', night: '#02040a', beacon: '#ff9f1c', tile: '#0a0e1a', text: '#eef1fa' };
// The globe is centred over Europe and Africa: lots of recognisable land, and the drone sits over the day side.
const CENTRE = { lon: 12, lat: 28 };

// Douglas-Peucker: drops points that lie within `tolerance` degrees of the line between their neighbours.
function simplify(points, tolerance) {
	if (points.length < 3) return points;
	const [a, b] = [points[0], points[points.length - 1]];
	let far = -1, max = 0;
	for (let i = 1; i < points.length - 1; i++) {
		const [x, y] = points[i];
		const dx = b[0] - a[0], dy = b[1] - a[1];
		const len = dx * dx + dy * dy;
		const t = len === 0 ? 0 : Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / len));
		const d = Math.hypot(x - (a[0] + t * dx), y - (a[1] + t * dy));
		if (d > max) { max = d; far = i; }
	}
	if (max <= tolerance) return [a, b];
	return [...simplify(points.slice(0, far + 1), tolerance).slice(0, -1), ...simplify(points.slice(far), tolerance)];
}

// Land only: simplified outer rings, and no islands smaller than minArea square degrees.
function land({ tolerance, minArea }) {
	const features = [];
	for (const { geometry } of countries.features) {
		const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
		const kept = [];
		for (const [outer] of polygons) {
			const xs = outer.map((p) => p[0]), ys = outer.map((p) => p[1]);
			if ((Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys)) < minArea) continue;
			const ring = simplify(outer, tolerance);
			if (ring.length >= 4) kept.push([ring]);
		}
		if (kept.length) features.push({ type: 'Feature', geometry: { type: 'MultiPolygon', coordinates: kept } });
	}
	return { type: 'FeatureCollection', features };
}

function landPath(cx, cy, r, options) {
	const projection = geoOrthographic().rotate([-CENTRE.lon, -CENTRE.lat]).scale(r).translate([cx, cy]).clipAngle(90);
	return geoPath(projection).digits(1)(land(options));
}

// A drone seen from above: X frame, four rotors, a body and a camera nub at the front.
// It is tilted so the camera points up and to the right, as if it is flying away over the world.
function drone({ x, y, arm, rotor, frame, body, tilt, fill, separator }) {
	// The nub sits on the front edge of the body and is drawn after it, so the two merge into one shape.
	const n = (v) => +v.toFixed(2);
	const nub = `<rect x="${n(-body * 0.45)}" y="${n(-body - body * 0.85)}" width="${n(body * 0.9)}" height="${n(body * 1.3)}" rx="${n(body * 0.3)}" stroke="none"/>`;
	return [
		`<g transform="translate(${x} ${y}) rotate(${tilt})" fill="${fill}" stroke="${fill}">`,
		`<path d="M${-arm} ${-arm} L${arm} ${arm} M${arm} ${-arm} L${-arm} ${arm}" stroke-width="${frame}" stroke-linecap="round"/>`,
		`<g stroke="none">${[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sy]) => `<circle cx="${sx * arm}" cy="${sy * arm}" r="${rotor}"/>`).join('')}</g>`,
		`<circle r="${body}" stroke="${separator}" stroke-width="0.9"/>${nub}`,
		`</g>`,
	].join('');
}

// The globe: sea, land, a night crescent on the left, a rim, and the drone.
function globe({ cx, cy, r, bulge, rim, options, borders, droneOptions, mono }) {
	const d = landPath(cx, cy, r, options);
	const top = cy - r, bottom = cy + r;
	const night = `M${cx} ${top} A${r} ${r} 0 0 0 ${cx} ${bottom} A${bulge} ${r} 0 0 1 ${cx} ${top} Z`;
	const ink = mono ? 'currentColor' : C.mist;
	return [
		mono ? '' : `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${C.ocean}"/>`,
		`<path d="${d}" fill="${mono ? 'currentColor' : C.land}"${mono ? ' opacity="0.45"' : ''}${borders ? ` stroke="${C.mist}" stroke-width="0.25" stroke-opacity="0.55" stroke-linejoin="round"` : mono ? '' : ` stroke="${C.land}" stroke-width="0.8" stroke-linejoin="round"`}/>`,
		mono ? '' : `<path d="${night}" fill="${C.night}" opacity="0.55"/>`,
		`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${ink}" stroke-width="${rim}"/>`,
		drone({ ...droneOptions, fill: mono ? 'currentColor' : C.beacon, separator: mono ? 'none' : C.ocean }),
	].join('\n  ');
}

const MARK = { cx: 32, cy: 32, r: 26, bulge: 10, rim: 2.5, options: { tolerance: 1.3, minArea: 12 }, borders: true,
	droneOptions: { x: 18.5, y: 25, arm: 4.8, rotor: 2.4, frame: 1.5, body: 2.2, tilt: 18 } };
const FAVICON = { cx: 32, cy: 32, r: 22, bulge: 9, rim: 3.5, options: { tolerance: 3, minArea: 50 }, borders: false,
	droneOptions: { x: 21.5, y: 26, arm: 5.4, rotor: 3.1, frame: 2, body: 2.6, tilt: 18 } };

const svg = (viewBox, label, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" role="img" aria-label="${label}">\n  ${body}\n</svg>\n`;
const out = (name, text) => writeFileSync(new URL(`brand/${name}`, root), text);

out('logo-mark.svg', svg('0 0 64 64', 'Flyable logo: the world seen over Europe and Africa, split by the day and night line, with a small amber drone over the day side', globe(MARK)));
out('favicon.svg', svg('0 0 64 64', 'Flyable', `<rect width="64" height="64" rx="14" fill="${C.tile}"/>\n  ${globe(FAVICON)}`));
out('logo-mark-mono.svg', svg('0 0 64 64', 'Flyable logo, one colour', globe({ ...MARK, borders: false, mono: true })));
out('logo-lockup.svg', svg('0 0 250 64', 'Flyable', `<g>\n  ${globe(MARK)}\n  </g>\n  <text x="74" y="43" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-size="34" font-weight="700" letter-spacing="0.5" fill="${C.text}">Flyable</text>`));
console.log('written');
