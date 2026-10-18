// Turns an official UAS geographical zones file (EUROCAE ED-269 JSON, which EU member states publish under Article 15
// of Regulation (EU) 2019/947) into our zones. The outlines are the authority's; we only round and thin them out.
import type { Zone } from './zone-schema';

interface Ed269Geometry {
	uomDimensions?: string;
	lowerLimit?: number;
	lowerVerticalReference?: string;
	upperLimit?: number;
	upperVerticalReference?: string;
	horizontalProjection: { type: string; coordinates?: number[][][] };
}
export interface Ed269Zone {
	identifier: string;
	country?: string;
	name: string;
	restriction: string;
	reason?: string[];
	restrictionConditions?: string[];
	message?: string;
	applicability?: { endDateTime?: string; permanent?: string }[];
	geometry: Ed269Geometry[];
}

type Ring = number[][];

const round = (n: number) => Math.round(n * 1e5) / 1e5;

// Douglas-Peucker: drops points that lie within `tolerance` degrees of the line between the points kept. 0.0002
// degrees is about 20 m, which keeps the shape of a zone but not every wiggle of a nature reserve's boundary.
function simplifyLine(points: Ring, tolerance: number): Ring {
	const keep = new Array<boolean>(points.length).fill(false);
	keep[0] = keep[points.length - 1] = true;
	const stack: [number, number][] = [[0, points.length - 1]];
	while (stack.length) {
		const [first, last] = stack.pop()!;
		const [ax, ay] = points[first];
		const [bx, by] = points[last];
		const length = Math.hypot(bx - ax, by - ay);
		let far = -1;
		let farDistance = tolerance;
		for (let i = first + 1; i < last; i++) {
			const [x, y] = points[i];
			const d = length === 0 ? Math.hypot(x - ax, y - ay) : Math.abs((bx - ax) * (ay - y) - (ax - x) * (by - ay)) / length;
			if (d > farDistance) [far, farDistance] = [i, d];
		}
		if (far >= 0) {
			keep[far] = true;
			stack.push([first, far], [far, last]);
		}
	}
	return points.filter((_, i) => keep[i]);
}

// A closed ring, thinned out. A ring that would collapse to a line is only rounded, so a small zone never vanishes.
export function simplifyRing(ring: Ring, tolerance: number): Ring {
	const rounded = ring.map(([lon, lat]) => [round(lon), round(lat)]);
	const open = rounded.slice(0, -1);
	const thin = simplifyLine(open, tolerance);
	return thin.length >= 3 ? [...thin, thin[0]] : rounded;
}

// Metres above the ground, or undefined when the limit is above sea level or missing (it cannot be drawn as a height).
function aboveGround(value: number | undefined, reference: string | undefined, unit: string | undefined): number | undefined {
	if (value === undefined || reference !== 'AGL') return undefined;
	return Math.round(unit === 'FT' ? value * 0.3048 : value);
}

const CLASSES: Record<string, string> = {
	PROHIBITED: 'prohibited',
	REQ_AUTHORISATION: 'approval needed',
	CONDITIONAL: 'allowed only on conditions',
	NO_RESTRICTION: 'unrestricted',
};

// What the zone is. An airport's zone is an airport zone whatever its class; the class goes in the note.
function kindOf(z: Ed269Zone): Zone['properties']['kind'] | undefined {
	if (z.restriction === 'NO_RESTRICTION') return undefined;
	if (z.reason?.includes('AIR_TRAFFIC')) return 'airport-zone';
	return z.restriction === 'PROHIBITED' ? 'restricted' : 'check-first';
}

const expired = (z: Ed269Zone, now: Date) =>
	!!z.applicability?.length && z.applicability.every((a) => a.permanent !== 'YES' && !!a.endDateTime && new Date(a.endDateTime) < now);

export interface Ed269Options {
	iso3: string;
	tolerance?: number;
	now?: Date;
}

// One zone per height band: a feature that lists several geometries becomes several zones. Zones that are unrestricted
// or have ended are left out. A shape other than a polygon throws: better a failed build than a missing zone.
export function ed269Zones(zones: Ed269Zone[], { iso3, tolerance = 0.0002, now = new Date() }: Ed269Options): Zone[] {
	return zones
		.flatMap((z) => {
			const kind = kindOf(z);
			if (!kind || expired(z, now)) return [];
			const note = [`The authority classes this zone as ${CLASSES[z.restriction] ?? z.restriction}.`, ...(z.restrictionConditions ?? []), z.message]
				.filter(Boolean)
				.join(' ');
			return z.geometry.map((g, i): Zone => {
				const { type, coordinates } = g.horizontalProjection;
				if (type !== 'Polygon' || !coordinates) throw new Error(`${iso3} zone ${z.identifier}: unsupported shape "${type}"`);
				const floorMeters = aboveGround(g.lowerLimit, g.lowerVerticalReference, g.uomDimensions);
				const ceilingMeters = aboveGround(g.upperLimit, g.upperVerticalReference, g.uomDimensions);
				return {
					type: 'Feature',
					geometry: { type: 'Polygon', coordinates: coordinates.map((r) => simplifyRing(r, tolerance)) as never },
					properties: {
						id: `ed269:${iso3}:${z.identifier}${z.geometry.length > 1 ? `#${i + 1}` : ''}`,
						kind,
						name: z.name,
						status: 'active',
						note,
						...(floorMeters !== undefined && { floorMeters }),
						// A ceiling at or below the floor (or at 0) says nothing a map can draw.
						...(ceilingMeters && ceilingMeters > (floorMeters ?? 0) && { ceilingMeters }),
					},
				};
			});
		})
		.sort((a, b) => a.properties.id.localeCompare(b.properties.id));
}

// Many zones share one note ("approval needed ..."). The most common one moves to the file's meta, which every zone
// without a note of its own shows, so the file does not repeat it a thousand times.
export function shareCommonNote(zones: Zone[]): { zones: Zone[]; note?: string } {
	const counts = new Map<string, number>();
	for (const z of zones) if (z.properties.note) counts.set(z.properties.note, (counts.get(z.properties.note) ?? 0) + 1);
	const [common] = [...counts].sort((a, b) => b[1] - a[1])[0] ?? [];
	if (!common) return { zones };
	return { note: common, zones: zones.map((z) => (z.properties.note === common ? { ...z, properties: { ...z.properties, note: undefined } } : z)) };
}
