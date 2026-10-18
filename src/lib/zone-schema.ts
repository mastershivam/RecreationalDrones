import { z } from 'astro/zod';

// One file of zones per country and source, as a GeoJSON FeatureCollection with a `meta` block saying where it
// came from. `kind` says what a zone is, never whether flying is allowed there (see DESIGN.md, Voice).
// `airport-buffer` is our circle round an airport, from a stated radius. `airport-zone` is the authority's own outline
// of an airport zone, loaded from its zones file; it is an area, never a circle we drew.
export const zoneKinds = ['airport-buffer', 'airport-zone', 'restricted', 'flying-site', 'check-first'] as const;

const position = z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]);
const ring = z.array(position).min(4);
const point = z.object({ type: z.literal('Point'), coordinates: position });
const polygon = z.object({ type: z.literal('Polygon'), coordinates: z.array(ring).min(1) });
const multiPolygon = z.object({ type: z.literal('MultiPolygon'), coordinates: z.array(z.array(ring).min(1)).min(1) });

const zone = z.object({
	type: z.literal('Feature'),
	geometry: z.discriminatedUnion('type', [point, polygon, multiPolygon]),
	properties: z
		.object({
			id: z.string().min(1),
			kind: z.enum(zoneKinds),
			name: z.string().min(1),
			// A refresh marks a zone that has disappeared from its source `removed` instead of deleting it, so the diff shows it.
			status: z.enum(['active', 'superseded', 'removed']),
			// A point zone is a place; an airport buffer is a point plus this radius.
			radiusMeters: z.number().positive().optional(),
			// The OpenStreetMap object the position or outline comes from, so it can be fetched again.
			osm: z.string().regex(/^(node|way|relation)\/\d+$/).optional(),
			// The official rule that gives the radius, or the policy that names the area.
			ruleUrl: z.url().optional(),
			note: z.string().optional(),
			// The circle is an approximation of the real zone, which has another shape or a larger extent.
			indicative: z.boolean().optional(),
			// The part of the sky the zone covers, in metres above the ground, as the authority gives it. Left out when
			// the authority gives no limit, or gives it above sea level (which cannot be drawn as a height above ground).
			floorMeters: z.number().min(0).optional(),
			ceilingMeters: z.number().positive().optional(),
			validFrom: z.coerce.date().optional(),
			validUntil: z.coerce.date().optional(),
		})
		.refine((p) => p.kind !== 'airport-buffer' || p.radiusMeters !== undefined, 'an airport buffer needs radiusMeters')
		.refine((p) => p.floorMeters === undefined || p.ceilingMeters === undefined || p.floorMeters < p.ceilingMeters, 'floorMeters must be below ceilingMeters'),
}).refine((f) => f.properties.kind !== 'airport-zone' || f.geometry.type !== 'Point', {
	message: 'an airport zone is an outline, not a point',
});

export const zoneCollectionSchema = z
	.object({
		type: z.literal('FeatureCollection'),
		meta: z
			.object({
				// ISO 3166-1 alpha-3, as in the country guides.
				iso3: z.string().regex(/^[A-Z]{3}$/),
				// Where a person can read about the data: the authority's page. Bulk files also give `dataUrl`, the file itself.
				sourceUrl: z.url(),
				dataUrl: z.url().optional(),
				// Bulk data: when it was downloaded, and a SHA-256 of what was downloaded, to see that a source changed.
				fetchedAt: z.coerce.date().optional(),
				sourceHash: z.string().regex(/^[0-9a-f]{64}$/).optional(),
				// Hand-curated data: when a person last checked the source.
				verifiedOn: z.coerce.date().optional(),
				licence: z.string().min(1),
				attribution: z.string().min(1),
				// Shown for every zone in the file that has no note of its own, so a thousand airports do not repeat it.
				note: z.string().min(1).optional(),
			})
			.refine((m) => m.fetchedAt || m.verifiedOn, 'meta needs fetchedAt (bulk data) or verifiedOn (curated data)'),
		// May be empty: a file saying "checked on this date, found none" is information a refresh needs.
		features: z.array(zone),
	})
	.superRefine((c, ctx) => {
		const seen = new Set<string>();
		for (const f of c.features) {
			if (seen.has(f.properties.id)) ctx.addIssue({ code: 'custom', message: `duplicate zone id ${f.properties.id}` });
			seen.add(f.properties.id);
		}
	});

// Every [lon, lat] in a zone's geometry, whatever its type.
export function positions(geometry: Zone['geometry']): [number, number][] {
	if (geometry.type === 'Point') return [geometry.coordinates];
	if (geometry.type === 'Polygon') return geometry.coordinates.flat();
	return geometry.coordinates.flat(2);
}

export type ZoneCollection = z.infer<typeof zoneCollectionSchema>;
export type Zone = ZoneCollection['features'][number];
