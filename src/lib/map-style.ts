import { layers, namedFlavor, type Flavor } from '@protomaps/basemaps';
import type { FilterSpecification, GeoJSONSourceSpecification, LayerSpecification, StyleSpecification } from 'maplibre-gl';
import { nightGeoJSON } from './daynight';
import { GLOBE_PROJECTION, coveredCountriesFilter, type MapColors } from './map-config';
import { TILE_PATH } from './tile-server';

// The basemap is one .pmtiles file, read in small pieces with HTTP byte ranges. In production the Worker serves
// it from a private R2 bucket (src/worker.ts); the countries file is a plain static asset.
export const COUNTRIES_URL = '/data/countries.geojson';

const ATTRIBUTION =
	'<a href="https://protomaps.com">Protomaps</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

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
		country_label: c.text,
		state_label: c.text,
		state_label_halo: c.land,
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
		return [{ ...layer, layout: textOnly } as LayerSpecification];
	});
}

// Night shading and the glowing "we have a guide" countries. These sit above land and borders but under labels.
function overlayLayers(c: MapColors, guides: Record<string, unknown>): LayerSpecification[] {
	const covered = {
		source: 'countries',
		filter: coveredCountriesFilter(guides) as unknown as FilterSpecification,
	};
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
		{ id: 'covered-countries', type: 'fill', ...covered, paint: { 'fill-color': c.accent, 'fill-opacity': 0.55 } },
		{ id: 'covered-countries-outline', type: 'line', ...covered, paint: { 'line-color': c.accent, 'line-width': 1.5 } },
	] as LayerSpecification[];
}

// `origin` is the site's origin, since MapLibre needs absolute URLs for tiles and fonts.
export function buildStyle(c: MapColors, guides: Record<string, unknown>, origin: string, now = new Date()): StyleSpecification {
	const base = basemapLayers(basemapFlavor(c));
	const firstLabel = base.findIndex((l) => l.type === 'symbol');
	return {
		version: 8,
		projection: GLOBE_PROJECTION,
		glyphs: `${origin}/fonts/{fontstack}/{range}.pbf`,
		sources: {
			protomaps: { type: 'vector', url: `pmtiles://${origin}${TILE_PATH}`, attribution: ATTRIBUTION },
			countries: { type: 'geojson', data: `${origin}${COUNTRIES_URL}` },
			night: { type: 'geojson', data: nightGeoJSON(now) as GeoJSONSourceSpecification['data'] },
		},
		layers: [...base.slice(0, firstLabel), ...overlayLayers(c, guides), ...base.slice(firstLabel)],
	};
}
