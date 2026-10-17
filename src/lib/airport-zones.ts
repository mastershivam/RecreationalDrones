import type { Zone } from './zone-schema';

export interface AirportRules {
	iso2: string;
	radiusMeters: number;
	// The official rule that gives the radius.
	ruleUrl: string;
	// The circle only approximates the real zone (the UK's, for example, is not a circle).
	indicative?: boolean;
}

// shortcut: only airports (large, medium, small); heliports, seaplane bases and closed fields are left out, as
// the rules we cite say "aerodrome" without saying whether those count. Revisit when a source says so.
const AIRPORT_TYPES = new Set(['large_airport', 'medium_airport', 'small_airport']);

const round = (n: number) => Math.round(n * 1e5) / 1e5;

// One buffer zone per airport row of OurAirports' airports.csv, sorted by id so a refresh gives a stable diff.
export function airportZones(rows: Record<string, string>[], { iso2, radiusMeters, ruleUrl, indicative }: AirportRules): Zone[] {
	return rows
		.filter((r) => r.iso_country === iso2 && AIRPORT_TYPES.has(r.type))
		.map((r): Zone => ({
			type: 'Feature',
			geometry: { type: 'Point', coordinates: [round(Number(r.longitude_deg)), round(Number(r.latitude_deg))] },
			properties: {
				id: `ourairports:${r.ident}`,
				kind: 'airport-buffer',
				name: r.name,
				status: 'active',
				radiusMeters,
				ruleUrl,
				...(indicative && { indicative }),
			},
		}))
		.sort((a, b) => a.properties.id.localeCompare(b.properties.id));
}

// A refresh keeps a zone that has gone from the source, marked `removed`, so a person sees it in the diff.
export function mergeZones(previous: Zone[], current: Zone[]): Zone[] {
	const now = new Set(current.map((z) => z.properties.id));
	const gone = previous.filter((z) => !now.has(z.properties.id)).map((z) => ({ ...z, properties: { ...z.properties, status: 'removed' as const } }));
	return [...current, ...gone].sort((a, b) => a.properties.id.localeCompare(b.properties.id));
}
