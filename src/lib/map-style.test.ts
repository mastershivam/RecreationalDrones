import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { TILE_PATH } from './tile-server';
import { COUNTRIES_URL, basemapFlavor, basemapLayers, buildStyle } from './map-style';

const colors = {
	ocean: '#040b1c',
	land: '#3f5f94',
	landBorder: '#9bb3dd',
	text: '#eef1fa',
	textMuted: '#a4aecb',
	accent: '#ff9f1c',
	night: '#02040a',
};
const guides = { GBR: '/countries/united-kingdom/' };
const origin = 'https://example.org';
const publicDir = join(import.meta.dirname, '../../public');

const style = buildStyle(colors, guides, origin, new Date('2026-06-21T12:00:00Z'));
const ids = style.layers.map((l) => l.id);
const firstLabel = style.layers.findIndex((l) => l.type === 'symbol');

describe('basemapFlavor', () => {
	const flavor = basemapFlavor(colors);

	it('uses our palette for sea and land', () => {
		expect(flavor.background).toBe(colors.ocean);
		expect(flavor.water).toBe(colors.ocean);
		expect(flavor.earth).toBe(colors.land);
	});

	it('flattens land cover so every kind of land is one color', () => {
		expect(new Set(Object.values(flavor.landcover!))).toEqual(new Set([colors.land]));
	});

	it('draws borders and country labels in palette colors', () => {
		expect(flavor.boundaries).toBe(colors.landBorder);
		expect(flavor.country_label).toBe(colors.text);
	});
});

describe('basemapLayers', () => {
	it('has no layers that need an icon sprite, since none is shipped', () => {
		expect(basemapLayers(basemapFlavor(colors)).filter((l) => (l.layout as any)?.['icon-image'])).toEqual([]);
	});

	it('keeps city names without their dots, since the dots need an icon sprite', () => {
		const city = basemapLayers(basemapFlavor(colors)).find((l) => l.id === 'places_locality')!;
		expect(city).toBeDefined();
		expect((city.layout as Record<string, unknown>)['text-field']).toBeDefined();
		expect(Object.keys(city.layout as object).filter((k) => k.startsWith('icon-'))).toEqual([]);
	});

	it('drops the layers that are only icons, such as road shields and points of interest', () => {
		const have = basemapLayers(basemapFlavor(colors)).map((l) => l.id);
		expect(have).not.toContain('roads_shields');
		expect(have).not.toContain('pois');
	});

	it('still has land, water, borders and country labels', () => {
		const have = basemapLayers(basemapFlavor(colors)).map((l) => l.id);
		for (const id of ['earth', 'water', 'boundaries_country', 'places_country']) expect(have).toContain(id);
	});
});

describe('buildStyle', () => {
	it('is a globe', () => {
		expect(style.projection).toEqual({ type: 'globe' });
	});

	it('has unique layer ids', () => {
		expect(new Set(ids).size).toBe(ids.length);
	});

	it('only references sources that exist', () => {
		for (const layer of style.layers) {
			if ('source' in layer && layer.source) expect(Object.keys(style.sources)).toContain(layer.source);
		}
	});

	it('loads tiles, countries and fonts from this site', () => {
		expect(style.sources.protomaps).toMatchObject({ url: `pmtiles://${origin}${TILE_PATH}` });
		expect(style.sources.countries).toMatchObject({ data: `${origin}${COUNTRIES_URL}` });
		expect(style.glyphs).toBe(`${origin}/fonts/{fontstack}/{range}.pbf`);
	});

	it('reads the basemap from the one tile file the Worker serves from R2, by byte range', () => {
		// The file is at /tiles/basemap.pmtiles, which only the Worker answers (wrangler.toml: run_worker_first).
		const source = style.sources.protomaps as { url: string; tiles?: string[] };
		expect(source.url).toBe(`pmtiles://${origin}/tiles/basemap.pmtiles`);
		expect(source.tiles).toBeUndefined();
	});

	it('credits OpenStreetMap and Protomaps, as their licences require', () => {
		const attribution = (style.sources.protomaps as { attribution: string }).attribution;
		expect(attribution).toContain('OpenStreetMap');
		expect(attribution).toContain('Protomaps');
	});

	it('draws night, then covered countries, above land and borders but below every label', () => {
		const night = ids.indexOf('night-fill');
		const covered = ids.indexOf('covered-countries');
		expect(ids.indexOf('boundaries_country')).toBeLessThan(night);
		expect(night).toBeLessThan(covered);
		expect(ids.indexOf('covered-countries-outline')).toBeLessThan(firstLabel);
		expect(style.layers.slice(0, firstLabel).some((l) => l.type === 'symbol')).toBe(false);
	});

	it('highlights only countries that have a guide', () => {
		const covered = style.layers.find((l) => l.id === 'covered-countries') as any;
		expect(covered.filter).toEqual(['in', ['get', 'ADM0_A3'], ['literal', ['GBR']]]);
	});

	it('shades night from the time it is given', () => {
		const night = (style.sources.night as { data: { features: { properties: { kind: string } }[] } }).data;
		expect(night.features.map((f) => f.properties.kind)).toEqual(['night', 'terminator']);
	});
});

describe('shipped files', () => {
	it('has the basemap PMTiles source, which the build unpacks into tiles', () => {
		const file = join(publicDir, '../data/basemap.pmtiles');
		expect(existsSync(file)).toBe(true);
		expect(readFileSync(file).subarray(0, 7).toString()).toBe('PMTiles');
	});

	it('has the countries file, covering every guide', () => {
		const data = JSON.parse(readFileSync(join(publicDir, COUNTRIES_URL), 'utf8'));
		const codes = data.features.map((f: any) => f.properties.ADM0_A3);
		for (const iso3 of Object.keys(guides)) expect(codes).toContain(iso3);
	});

	it('ships the Latin, Greek and Cyrillic glyph ranges for every font the style uses', () => {
		// Regression: city names in Cyrillic asked for 1024-1279.pbf, which was not shipped, so those labels came
		// up blank and the browser logged a 404.
		const fonts = new Set<string>();
		for (const layer of style.layers) {
			const font = (layer.layout as Record<string, unknown> | undefined)?.['text-font'];
			for (const name of JSON.stringify(font ?? '').match(/Noto Sans [A-Za-z]+/g) ?? []) fonts.add(name);
		}
		expect(fonts.size).toBeGreaterThan(0);
		for (const font of fonts) {
			for (const range of ['0-255', '256-511', '512-767', '768-1023', '1024-1279', '1280-1535']) {
				expect(existsSync(join(publicDir, 'fonts', font, `${range}.pbf`)), `${font} ${range}`).toBe(true);
			}
		}
	});
});
