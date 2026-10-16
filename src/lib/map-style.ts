import { layers, namedFlavor, type Flavor } from '@protomaps/basemaps';
import type { FilterSpecification, GeoJSONSourceSpecification, LayerSpecification, StyleSpecification } from 'maplibre-gl';
import { nightGeoJSON } from './daynight';
import { GLOBE_PROJECTION, coveredCountriesFilter, type MapColors } from './map-config';

// Both files are served from this site (public/). To move the tiles to R2 later, change BASEMAP_URL.
export const BASEMAP_URL = '/tiles/basemap.pmtiles';
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

// Protomaps layers without the ones that need an icon sprite (road shields, points of interest, city dots).
export function basemapLayers(flavor: Flavor): LayerSpecification[] {
	return layers('protomaps', flavor, { lang: 'en' }).filter((l) => !(l.layout as Record<string, unknown> | undefined)?.['icon-image']);
}

// Night shading and the glowing "we have a guide" countries. These sit above land and borders but under labels.
function overlayLayers(c: MapColors, guides: Record<string, string>): LayerSpecification[] {
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
export function buildStyle(c: MapColors, guides: Record<string, string>, origin: string, now = new Date()): StyleSpecification {
	const base = basemapLayers(basemapFlavor(c));
	const firstLabel = base.findIndex((l) => l.type === 'symbol');
	return {
		version: 8,
		projection: GLOBE_PROJECTION,
		glyphs: `${origin}/fonts/{fontstack}/{range}.pbf`,
		sources: {
			protomaps: { type: 'vector', url: `pmtiles://${origin}${BASEMAP_URL}`, attribution: ATTRIBUTION },
			countries: { type: 'geojson', data: `${origin}${COUNTRIES_URL}` },
			night: { type: 'geojson', data: nightGeoJSON(now) as GeoJSONSourceSpecification['data'] },
		},
		layers: [...base.slice(0, firstLabel), ...overlayLayers(c, guides), ...base.slice(firstLabel)],
	};
}
