// Official UAS geographical zones files, one per country, that scripts/build-official-zones.ts turns into
// data/zones/<iso3>-official.geojson. Every feed needs its terms checked and written here (see SOURCES.md):
// a file with no stated terms is not copied.
export interface OfficialFeed {
	iso3: string;
	authority: string;
	// The ED-269 JSON file.
	dataUrl: string;
	// The authority's own page or map for these zones: what a popup links to.
	pageUrl: string;
	// The terms the data is published under, and the page that states them.
	licence: string;
	termsUrl: string;
	attribution: string;
}

export const OFFICIAL_FEEDS: OfficialFeed[] = [
	{
		iso3: 'CHE',
		authority: 'Federal Office of Civil Aviation FOCA',
		dataUrl: 'https://data.geo.admin.ch/ch.bazl.einschraenkungen-drohnen/einschraenkungen-drohnen/einschraenkungen-drohnen_4326.json',
		pageUrl: 'https://www.bazl.admin.ch/en/geographical-flight-restrictions',
		licence: 'opendata.swiss terms "BY": free use, including commercial, with the source named.',
		termsUrl: 'https://opendata.swiss/en/terms-of-use/#terms_by',
		attribution: 'Geographical UAS zones of Switzerland: Federal Office of Civil Aviation FOCA, via data.geo.admin.ch. Outlines simplified.',
	},
	{
		iso3: 'LUX',
		authority: "Direction de l'Aviation Civile",
		dataUrl: 'https://drones.geoportail.lu/zones',
		pageUrl: 'https://g-o.lu/uas',
		licence: 'Creative Commons Zero (CC0), as stated on data.public.lu.',
		termsUrl: 'https://data.public.lu/en/datasets/uas-geographical-zones-grand-duchy-of-luxembourg-zones-geographiques-uas-grand-duche-de-luxembourg/',
		attribution: "UAS geographical zones of Luxembourg: Direction de l'Aviation Civile, via data.public.lu (CC0). Outlines simplified.",
	},
];
