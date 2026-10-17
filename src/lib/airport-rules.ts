import type { AirportRules } from './airport-zones';

// Every country with a guide has a rule here: a circle round each airport, sized by the country's own rule, drawn
// on the map by the zones layer. A new guide fails zones-data.test.ts until it has an entry. If the authority gives
// no distance, write `{ none: 'why' }` rather than guess one. Run `npm run build:zones` after changing this.
export interface AirportRule extends AirportRules {
	// Where the rule comes from, for the file's attribution.
	authority: string;
	// Shown with every zone in the file. Say what the rule is and what it does not cover.
	note: string;
}

// EASA's common rules give no distance from an airport; each member state publishes its own geographical zones.
const EU_NONE = {
	none: "EASA's common rules set no distance from airports. Each member state publishes its own geographical zones, which we have not read.",
};

export const AIRPORT_RULES: Record<string, AirportRule | { none: string }> = {
	GBR: {
		iso2: 'GB',
		// 2 nautical miles, the CAA's radius for a flight restriction zone (FRZ) with no ATZ, and its smaller ATZ.
		radiusMeters: 2 * 1852,
		indicative: true,
		ruleUrl: 'https://www.caa.co.uk/drones/open-category/moving-on-to-more-advanced-flying/airspace/aerodromes-heliports-and-spaceports/',
		authority: 'CAA, "Aerodromes, heliports and spaceports"',
		note: "The CAA says most airports and airfields have a flight restriction zone (FRZ), where you need the site's permission to fly. This circle is 2 nautical miles (3.7 km), the CAA's size for an FRZ with no aerodrome traffic zone and for the smallest one. It is only a guide: real zones can be 2.5 nautical miles, add 1 km wide strips reaching 5 km from each runway end, and extend 1 km past the airfield boundary. Some unlicensed airfields have no FRZ but are still dangerous to fly near. Heliports are not shown. Check the UK AIP before you fly.",
	},
	NPL: {
		iso2: 'NP',
		radiusMeters: 5000,
		ruleUrl:
			'https://web.archive.org/web/20240228092223/https://caanepal.gov.np/storage/app/media/drone/sep%2024%202022/UAS%20Requirement%20final.pdf',
		authority: 'CAAN UAS Requirements 101.7 and 101.23',
		note: "CAAN's standard operating conditions say not to fly within 5 km of an aerodrome. Near a controlled aerodrome you need authorization from air traffic control; near an uncontrolled one, permission from the local air traffic unit or aerodrome service provider.",
	},
	THA: {
		iso2: 'TH',
		radiusMeters: 9000,
		ruleUrl: 'https://www.caat.or.th/wp-content/uploads/2025/09/Flying-a-drone-in-Thailand-ENG.pdf',
		authority: 'CAAT "Flying a drone in Thailand"',
		note: "CAAT's leaflet says not to fly within 9 km of an aerodrome.",
	},
	USA: {
		none: "The FAA sets no single distance. Controlled airspace round an airport (Class B, C, D and surface Class E) varies in shape and size and needs FAA authorization, so a fixed circle would mislead.",
	},
	AUT: EU_NONE,
	BEL: EU_NONE,
	BGR: EU_NONE,
	HRV: EU_NONE,
	CYP: EU_NONE,
	CZE: EU_NONE,
	DNK: EU_NONE,
	EST: EU_NONE,
	FIN: EU_NONE,
	FRA: EU_NONE,
	DEU: EU_NONE,
	GRC: EU_NONE,
	HUN: EU_NONE,
	IRL: EU_NONE,
	ITA: EU_NONE,
	LVA: EU_NONE,
	LTU: EU_NONE,
	LUX: EU_NONE,
	MLT: EU_NONE,
	NLD: EU_NONE,
	POL: EU_NONE,
	PRT: EU_NONE,
	ROU: EU_NONE,
	SVK: EU_NONE,
	SVN: EU_NONE,
	ESP: EU_NONE,
	SWE: EU_NONE,
};
