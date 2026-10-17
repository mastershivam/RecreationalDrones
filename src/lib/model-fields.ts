import type { Zone } from './zone-schema';

// One position per OpenStreetMap object tagged sport=model_aerodrome, as written by scripts/osm-model-fields.py.
export interface FieldRow {
	id: string; // "node/123" or "way/456"
	lon: number;
	lat: number;
	name?: string;
	access?: string;
}

const round = (n: number) => Math.round(n * 1e5) / 1e5;

// OpenStreetMap objects that carry the model-aerodrome tag by mistake. Each needs a reason, and a person must have
// looked. Remove an entry if the mapper fixes it. shortcut: a hand-kept list; report the error in OpenStreetMap too.
export const KNOWN_MISTAGS: Record<string, string> = {
	'node/5392235753': 'Named "Saurya Airlines", a passenger airline, and has no other tags; not a flying field (Nepal).',
};

// A zone per mapped model aircraft field. OpenStreetMap says a place is used for model aircraft; it does not say
// drones may fly there, and many fields belong to clubs, so the note says both.
export function modelFieldZones(rows: FieldRow[]): Zone[] {
	return rows
		.filter((r) => !(r.id in KNOWN_MISTAGS))
		.map((r): Zone => ({
			type: 'Feature',
			geometry: { type: 'Point', coordinates: [round(r.lon), round(r.lat)] },
			properties: {
				id: `osm:${r.id}`,
				kind: 'flying-site',
				name: r.name?.trim() || 'Model aircraft field (unnamed)',
				status: 'active',
				osm: r.id as `${'node' | 'way'}/${number}`,
				note: `Mapped in OpenStreetMap as a model aircraft field. This is not an approval to fly a drone there.${
					r.access ? ` Access, as mapped: ${r.access}.` : ''
				} Ask the landowner or club.`,
			},
		}))
		.sort((a, b) => a.properties.id.localeCompare(b.properties.id));
}
