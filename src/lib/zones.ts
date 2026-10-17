import type { FilterSpecification } from 'maplibre-gl';
import type { z } from 'astro/zod';
import { escapeHtml } from './popup';
import type { zoneCollectionSchema } from './zone-schema';

// What /data/zones.json holds: the zone files as written, so dates are still text.
export type ZoneFile = z.input<typeof zoneCollectionSchema>;

// The filter on the map groups kinds the way a person thinks about them, not one switch per kind.
export const ZONE_GROUPS = [
	{ id: 'airport', label: 'Airport zones', kinds: ['airport-buffer'] },
	{ id: 'approval', label: 'Approval needed or restricted', kinds: ['check-first', 'restricted'] },
	{ id: 'site', label: 'Model aircraft fields', kinds: ['flying-site'] },
];

// Says what a place is, never that you may fly there (DESIGN.md, Voice).
const KIND_LABELS: Record<string, string> = {
	'airport-buffer': 'Airport zone',
	'check-first': 'Check first: approval needed',
	restricted: 'Restricted area',
	'flying-site': 'Model aircraft field',
};

export const enabledKinds = (groupIds: string[]): string[] => ZONE_GROUPS.filter((g) => groupIds.includes(g.id)).flatMap((g) => g.kinds);

type Ring = [number, number][];

// A ring of `steps` points at `radiusMeters` from a position, on a spherical Earth (an error of well under 1%).
// shortcut: does not split a circle that crosses the antimeridian or covers a pole; no zone is near either yet.
export function circlePolygon(lon: number, lat: number, radiusMeters: number, steps = 48): Ring {
	const R = 6371008.8;
	const d = radiusMeters / R;
	const [φ, λ] = [(lat * Math.PI) / 180, (lon * Math.PI) / 180];
	const ring: Ring = [];
	for (let i = 0; i < steps; i++) {
		const θ = (2 * Math.PI * i) / steps;
		const φ2 = Math.asin(Math.sin(φ) * Math.cos(d) + Math.cos(φ) * Math.sin(d) * Math.cos(θ));
		const λ2 = λ + Math.atan2(Math.sin(θ) * Math.sin(d) * Math.cos(φ), Math.cos(d) - Math.sin(φ) * Math.sin(φ2));
		ring.push([Math.round(((λ2 * 180) / Math.PI) * 1e5) / 1e5, Math.round(((φ2 * 180) / Math.PI) * 1e5) / 1e5]);
	}
	return [...ring, ring[0]];
}

export interface ZoneProps {
	id: string;
	kind: string;
	name: string;
	note: string;
	source: string;
	asOf: string;
	indicative: boolean;
	// An outline or circle is drawn as an area; a field is a dot, and so is the middle of an airport circle.
	shape: 'area' | 'point';
}

// The features the map draws. Zones that have left their source (`removed`) are not drawn.
export function zoneFeatures(files: ZoneFile[]) {
	const features = files.flatMap(({ meta, features }) =>
		features
			.filter((z) => z.properties.status === 'active')
			.flatMap((z) => {
				const p = z.properties;
				const props = {
					id: p.id,
					kind: p.kind,
					name: p.name,
					note: p.note ?? meta.note ?? '',
					source: p.ruleUrl ?? meta.sourceUrl,
					asOf: String(meta.verifiedOn ?? meta.fetchedAt).slice(0, 10),
					indicative: p.indicative === true,
				};
				const feature = (shape: ZoneProps['shape'], geometry: unknown) => ({ type: 'Feature' as const, properties: { ...props, shape }, geometry });
				if (z.geometry.type !== 'Point') return [feature('area', z.geometry)];
				const [lon, lat] = z.geometry.coordinates;
				const dot = feature('point', z.geometry);
				if (!p.radiusMeters) return [dot];
				return [feature('area', { type: 'Polygon', coordinates: [circlePolygon(lon, lat, p.radiusMeters)] }), dot];
			}),
	);
	return { type: 'FeatureCollection' as const, features };
}

// Not shown from afar. A 5 km circle is only a few pixels across before zoom 6, and a world of dots is noise that
// would also catch taps meant for a country (Pokhara's dot is a few pixels from the middle of Nepal at zoom 4).
export const ZONE_MIN_ZOOM = 6;

// Which kinds each zone layer draws, so switching a group off hides exactly its layers' features.
const LAYERS: Record<string, { shape: ZoneProps['shape']; kinds: string[] }> = {
	'zones-fill': { shape: 'area', kinds: ['airport-buffer', 'check-first', 'restricted'] },
	'zones-airport-line': { shape: 'area', kinds: ['airport-buffer'] },
	'zones-approval-line': { shape: 'area', kinds: ['check-first', 'restricted'] },
	'zones-points': { shape: 'point', kinds: ['airport-buffer', 'flying-site'] },
};
export const ZONE_LAYER_IDS = Object.keys(LAYERS);

export function zoneLayerFilters(enabled: string[]): Record<string, FilterSpecification> {
	return Object.fromEntries(
		Object.entries(LAYERS).map(([id, { shape, kinds }]) => [
			id,
			['all', ['==', ['get', 'shape'], shape], ['in', ['get', 'kind'], ['literal', kinds.filter((k) => enabled.includes(k))]]] as FilterSpecification,
		]),
	);
}

// Only web links are made into links, whatever a data file says.
const webUrl = (url: string): string | undefined => {
	try {
		return ['https:', 'http:'].includes(new URL(url).protocol) ? url : undefined;
	} catch {
		return undefined;
	}
};

// The popup for one zone. The hover preview has no links (DESIGN.md); the click or tap popup has the source link.
export function zonePopupHtml(p: ZoneProps, { link }: { link: boolean }): string {
	const url = webUrl(p.source);
	const host = url ? new URL(url).hostname : 'unknown';
	const kind = KIND_LABELS[p.kind] ?? p.kind;
	const source = link && url ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(host)}</a>` : escapeHtml(host);
	return (
		`<h2 class="popup-title">${escapeHtml(p.name)}</h2>` +
		`<p class="zone-kind">${escapeHtml(kind)}${p.indicative ? ' (indicative)' : ''}</p>` +
		(p.note ? `<p>${escapeHtml(p.note)}</p>` : '') +
		`<p class="popup-meta">Source: ${source} · as of ${escapeHtml(p.asOf)}${link ? '' : ' · click or tap for the link'}</p>`
	);
}

// Zones overlap (two airports near each other), so a popup lists each one under the pointer, up to a few.
export function zonesPopupHtml(zones: ZoneProps[], options: { link: boolean }, max = 3): string {
	const unique = [...new Map(zones.map((z) => [z.id, z])).values()];
	const more = unique.length - max;
	return unique.slice(0, max).map((z) => `<section class="zone">${zonePopupHtml(z, options)}</section>`).join('') + (more > 0 ? `<p class="popup-meta">and ${more} more here</p>` : '');
}
