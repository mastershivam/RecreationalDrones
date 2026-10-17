import { layers, namedFlavor, type Flavor } from '@protomaps/basemaps';
import type { ExpressionSpecification, FilterSpecification, GeoJSONSourceSpecification, LayerSpecification, StyleSpecification } from 'maplibre-gl';
import { nightGeoJSON } from './daynight';
import { GLOBE_PROJECTION, coveredCountriesFilter, type MapColors } from './map-config';
import { linkAttrsHtml } from './external-link';
import { levelColorExpression, type Level } from './restrictiveness';
import { TILE_PATH } from './tile-server';
import { ZONE_MIN_ZOOM, zoneLayerFilters } from './zones';

// The basemap is one .pmtiles file, read in small pieces with HTTP byte ranges. In production the Worker serves
// it from a private R2 bucket (src/worker.ts); the countries file is a plain static asset.
export const COUNTRIES_URL = '/data/countries.geojson';
// Zones are loaded by the page after the globe is up, so the source starts empty. See src/pages/data/zones.json.ts.
export const ZONES_URL = '/data/zones.json';

const ATTRIBUTION =
	`<a href="https://protomaps.com"${linkAttrsHtml('https://protomaps.com')}>Protomaps</a> © <a href="https://www.openstreetmap.org/copyright"${linkAttrsHtml('https://www.openstreetmap.org/copyright')}>OpenStreetMap</a>`;

// Protomaps' dark theme recolored to our palette: flat land, dark sea, readable labels.
export function basemapFlavor(c: MapColors): Flavor {
	const base = namedFlavor('dark');
	return {
		...base,
		background: c.ocean,
		earth: c.land,
		water: c.ocean,
		glacier: c.land,
		landcover: {
			barren: c.land,
			farmland: c.land,
			forest: c.land,
			glacier: c.land,
			grassland: c.land,
			scrub: c.land,
			urban_area: c.land,
		},
		boundaries: c.landBorder,
		city_label_halo: c.ocean,
		subplace_label_halo: c.ocean,
		state_label_halo: c.ocean,
		country_label: c.text,
		state_label: c.text,
		ocean_label: c.textMuted,
	};
}

// Some Protomaps layers draw icons from a sprite sheet, and we ship none. Road shields and points of interest are
// only useful with their icons, so they are dropped. City names are the point of zooming in, so that layer keeps
// its text and loses only the dot beside it.
const KEEP_WITHOUT_ICON = new Set(['places_locality']);
const ICON_PROPERTIES = ['icon-image', 'icon-size', 'icon-padding'];

export function basemapLayers(flavor: Flavor): LayerSpecification[] {
	return layers('protomaps', flavor, { lang: 'en' }).flatMap((layer) => {
		const layout = layer.layout as Record<string, unknown> | undefined;
		if (!layout?.['icon-image']) return [layer];
		if (!KEEP_WITHOUT_ICON.has(layer.id)) return [];
		const textOnly = Object.fromEntries(Object.entries(layout).filter(([key]) => !ICON_PROPERTIES.includes(key)));
		// English names only: Protomaps' default adds the local name beneath (Moscow in Cyrillic), which needs glyphs we do not ship.
		return [{ ...layer, layout: { ...textOnly, 'text-field': ['get', 'name:en'] } } as LayerSpecification];
	});
}

// Night shading and the glowing countries that have a guide, colored by how restrictive their rules are. These sit above land and borders but under labels.
function overlayLayers(c: MapColors, guides: Record<string, { level: Level }>): LayerSpecification[] {
	const covered = {
		source: 'countries',
		filter: coveredCountriesFilter(guides) as unknown as FilterSpecification,
	};
	const levelFill = levelColorExpression(guides, (level) => c[`level${level}`], c.accent) as ExpressionSpecification;
	return [
		{
			id: 'night-fill',
			type: 'fill',
			source: 'night',
			filter: ['==', ['get', 'kind'], 'night'],
			paint: { 'fill-color': c.night, 'fill-opacity': 0.4 },
		},
		// A wide blurred line softens the edge into a twilight gradient.
		{
			id: 'night-edge',
			type: 'line',
			source: 'night',
			filter: ['==', ['get', 'kind'], 'terminator'],
			paint: { 'line-color': c.night, 'line-width': 36, 'line-blur': 36, 'line-opacity': 0.3 },
		},
		{
			id: 'covered-countries',
			type: 'fill',
			...covered,
			// A country lifts when hovered, and pulses once when picked (feature state, set by the page).
			paint: { 'fill-color': levelFill, 'fill-opacity': ['case', ['boolean', ['feature-state', 'picked'], false], 0.95, ['boolean', ['feature-state', 'hover'], false], 0.75, 0.55], 'fill-opacity-transition': { duration: 300 } },
		},
		{ id: 'covered-countries-outline', type: 'line', ...covered, paint: { 'line-color': levelFill, 'line-width': 1.5 } },
		...zoneLayers(c),
	] as LayerSpecification[];
}

// Airport circles (dashed), outlines of places that need approval (solid) and dots for airports and fields. Colors
// carry the kind and line style and symbol repeat it, so no one has to tell colors apart. Zones are never amber.
function zoneLayers(c: MapColors): LayerSpecification[] {
	const filters = zoneLayerFilters(['airport-buffer', 'check-first', 'restricted', 'flying-site']);
	const common = { source: 'zones', minzoom: ZONE_MIN_ZOOM };
	const byKind = (airport: string, approval: string, site: string) => ['match', ['get', 'kind'], 'airport-buffer', airport, 'flying-site', site, approval];
	return [
		{ id: 'zones-fill', type: 'fill', ...common, filter: filters['zones-fill'], paint: { 'fill-color': byKind(c.zoneAirport, c.zoneApproval, c.text), 'fill-opacity': 0.18 } },
		{ id: 'zones-airport-line', type: 'line', ...common, filter: filters['zones-airport-line'], paint: { 'line-color': c.zoneAirport, 'line-width': 1.5, 'line-dasharray': [2, 2] } },
		{ id: 'zones-approval-line', type: 'line', ...common, filter: filters['zones-approval-line'], paint: { 'line-color': c.zoneApproval, 'line-width': 2 } },
		{
			id: 'zones-points',
			type: 'circle',
			...common,
			filter: filters['zones-points'],
			paint: {
				'circle-radius': ['match', ['get', 'kind'], 'flying-site', 6, 3],
				// A field is a hollow ring in body-text color, so it is never mistaken for an airport dot.
				'circle-color': byKind(c.zoneAirport, c.zoneApproval, c.ocean),
				'circle-stroke-color': byKind(c.zoneAirport, c.zoneApproval, c.text),
				'circle-stroke-width': ['match', ['get', 'kind'], 'flying-site', 2, 0],
			},
		},
	] as LayerSpecification[];
}

// `origin` is the site's origin, since MapLibre needs absolute URLs for tiles and fonts.
export function buildStyle(c: MapColors, guides: Record<string, { level: Level }>, origin: string, now = new Date()): StyleSpecification {
	const base = basemapLayers(basemapFlavor(c));
	const firstLabel = base.findIndex((l) => l.type === 'symbol');
	// Countries with no guide yet are quieter than land that has one, so the gap reads as "not covered", never "no
	// rules". They go under the borders, which must stay visible.
	const firstBorder = base.findIndex((l) => l.id.startsWith('boundaries'));
	const uncovered = {
		id: 'uncovered-countries',
		type: 'fill',
		source: 'countries',
		filter: ['!', coveredCountriesFilter(guides)],
		paint: { 'fill-color': c.uncovered, 'fill-opacity': 0.9 },
	} as unknown as LayerSpecification;
	return {
		version: 8,
		projection: GLOBE_PROJECTION,
		glyphs: `${origin}/fonts/{fontstack}/{range}.pbf`,
		sources: {
			protomaps: { type: 'vector', url: `pmtiles://${origin}${TILE_PATH}`, attribution: ATTRIBUTION },
			countries: { type: 'geojson', data: `${origin}${COUNTRIES_URL}`, promoteId: 'ADM0_A3' },
			night: { type: 'geojson', data: nightGeoJSON(now) as GeoJSONSourceSpecification['data'] },
			zones: { type: 'geojson', data: { type: 'FeatureCollection', features: [] }, attribution: `Airports: <a href="https://ourairports.com"${linkAttrsHtml('https://ourairports.com')}>OurAirports</a>` },
		},
		layers: [...base.slice(0, firstBorder), uncovered, ...base.slice(firstBorder, firstLabel), ...overlayLayers(c, guides), ...base.slice(firstLabel)],
	};
}
