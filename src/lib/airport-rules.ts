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
	CHE: {
		none: "FOCA gives no fixed distance from airports on the pages we read. It publishes the zones themselves instead, as an open data file, and the map draws those outlines (see data/zones/che-official.geojson).",
	},
	NOR: {
		iso2: 'NO',
		radiusMeters: 5000,
		indicative: true,
		ruleUrl: 'https://www.luftfartstilsynet.no/en/drones/no-drone-zones/',
		authority: 'Luftfartstilsynet, "No drone zones"',
		note: 'Luftfartstilsynet says not to fly within 5 km of an airport without permission from the airport tower, and that this will probably change to a ban inside the airport control zone (CTR) without a permit. This circle is drawn at every airport in the open data, so it shows more places than the rule covers. Use dronesoner.no for the real zones.',
	},
	ISL: {
		none: "Samgöngustofa bans flying at airports and in the no-fly zones round scheduled airports without the operator's permission, but the pages we read give no radius. A fixed circle would mislead.",
	},
	LIE: {
		none: "The Landespolizei names no-fly zones (Vaduz government area, parts of Balzers near a heliport and the Bad Ragaz aerodrome) and points to FOCA's drone map, but gives no fixed distance from airports.",
	},
	NZL: {
		iso2: 'NZ',
		radiusMeters: 4000,
		indicative: true,
		ruleUrl: 'https://www.aviation.govt.nz/drones/flying-your-drone-safely/',
		authority: 'CAA New Zealand, "Flying your drone safely" and CATI 101-1',
		note: 'CATI 101-1 says not to fly on or within 4 km of the boundary of any aerodrome without a pilot qualification, plus air traffic control authorisation at a controlled aerodrome and the operator\'s agreement at an uncontrolled one. This circle is 4 km from the airport\'s centre, not its boundary, and is drawn at every airport in the open data, so it is only a guide. Use the CAA and AirShare maps for the real airspace.',
	},
	BRA: {
		none: "DECEA says every flight needs an authorisation requested in SARPAS and that flights in prohibited controlled-airspace areas (EAC P) are banned, but the pages we read give no general distance from airports. A fixed circle would mislead.",
	},
	ZAF: {
		iso2: 'ZA',
		radiusMeters: 10000,
		indicative: true,
		ruleUrl: 'https://www.caa.co.za/industry-information/uas/',
		authority: 'SACAA, "Unmanned aircraft systems"',
		note: 'SACAA says not to fly 10 km or closer to an aerodrome (airport, helipad or airfield) unless it approves. This circle is drawn at every airport in the open data, so it shows more places than the rule covers. SACAA\'s own maps and the AIP show the real airspace.',
	},
	IND: {
		none: "The Drone Rules, 2021 put an 8 to 12 km band round an operational airport in the yellow zone above 200 ft and leave the zones themselves to the Digital Sky airspace map, which we could not open. A fixed circle would mislead.",
	},
	KOR: {
		iso2: 'KR',
		radiusMeters: 9300,
		indicative: true,
		ruleUrl: 'https://drone.onestop.go.kr/introduce/systemintro1',
		// Ulleung Airport (KR-1113) is at 116.1 E, 42.5 N in OurAirports, in China; the island is at about 130.9 E, 37.5 N.
		exclude: ['KR-1113'],
		authority: 'Drone One-Stop portal, "Drone flight approval"',
		note: 'The portal says flying in the control zone round an airfield (radius 9.3 km) needs prior approval whatever the drone weighs, and that a flight within 3 km of an airfield centre needs coordination. Only airports with a control zone have one, but this circle is drawn at every airport in the open data, so it shows more places than the rule covers. The prohibited zones (P-73 and others) are not drawn.',
	},
	SGP: {
		iso2: 'SG',
		radiusMeters: 5000,
		indicative: true,
		ruleUrl: 'https://www.caas.gov.sg/unmanned-aircraft/operator-and-activity-permits/',
		authority: 'CAAS, "Operator and activity permits"',
		note: 'CAAS says a Class 2 Activity Permit is needed to fly within 5 km of an airport or military airbase. This circle is 5 km from the centre of every airport in the open data, and military airbases are not shown, so it is only a guide. Use CAAS\'s no-fly zone map for the real areas.',
	},
	ARG: {
		iso2: 'AR',
		radiusMeters: 5000,
		indicative: true,
		ruleUrl: 'https://www.argentina.gob.ar/anac/nuevo-marco-normativo-para-la-operacion-de-drones',
		authority: 'ANAC, "Nuevo marco normativo para la operación de drones" (Resolution 550/2025)',
		note: 'ANAC says that without prior authorisation you may fly only up to 43 m within 5 km of a runway threshold, and not in a runway approach or climb path. This circle is 5 km from the centre of every airport in the open data, so it is only a guide, and it marks where the 43 m limit applies, not a ban. Control zones are also closed to the open category; the AIP shows the real airspace.',
	},
	COL: {
		none: "Aerocivil points to its UAS geographic viewer for restricted airspace and gives no distance from airports on the pages we read (RAC 100, which may, would not load). A fixed circle would mislead.",
	},
	MYS: {
		none: "CAAM asks for an Authorisation to Fly before any flight and gives no distance from airports on the pages we saw. A fixed circle would mislead.",
	},
	TUR: {
		iso2: 'TR',
		radiusMeters: 9260,
		indicative: true,
		ruleUrl: 'https://web.shgm.gov.tr/',
		authority: 'SHGM, SHT-İHA Rev.04, art. 18(1)(a)',
		note: 'SHT-İHA Rev.04 (2020, read from an archive copy) says permission is needed to fly within 5 nautical miles of the nearest runway edge. This circle is 5 nautical miles from the centre of every airport in the open data, so it shows a little more than the rule covers. The 2026 instruction was not read. Use the İHA Takip zone map.',
	},
	ISR: {
		none: "The CAAI's study material, as far as we could read it, gives no fixed distance from airports (gov.il refused our requests). A fixed circle would mislead.",
	},
	PHL: {
		iso2: 'PH',
		radiusMeters: 10000,
		indicative: true,
		ruleUrl: 'https://www.caap.gov.ph/types-of-operations/',
		authority: 'CAAP, "Types of operations"',
		note: 'CAAP says a special flight permit is needed to operate within 10 km of an aerodrome (its table says "ARP"). This circle is 10 km from the centre of every airport in the open data, so it is only a guide. Ask CAAP for the real airspace.',
	},
	CHL: {
		none: "The DGAC documents, as far as we could read them (search excerpts), give no fixed distance from airports. A fixed circle would mislead.",
	},
	PER: {
		none: "The MTC pages, as far as we could read them (search excerpts), give no fixed distance from airports. A fixed circle would mislead.",
	},
	SAU: {
		iso2: 'SA',
		radiusMeters: 8000,
		indicative: true,
		ruleUrl: 'https://www.gaca.gov.sa/',
		authority: 'GACA, GACAR Part 101 s.101.85(a)(4)',
		note: 'GACAR Part 101 (read from an archive copy) asks for notice before flying within 8 km of an aerodrome. It is a notice, not a ban. This circle is 8 km from the centre of every airport in the open data, so it is only a guide. Check GACA for the real airspace.',
	},
	KEN: {
		none: "The KCAA's regulations, as far as we could read them (search excerpts), give no fixed distance from airports. A fixed circle would mislead.",
	},
	IDN: {
		none: "The Ministry's pages, as far as we could read them (search excerpts), give no fixed distance from airports. A fixed circle would mislead.",
	},
	TZA: {
		none: "The TCAA's pages, as far as we could read them (search excerpts), give no fixed distance from airports. A fixed circle would mislead.",
	},
	LKA: {
		none: "The CAASL's pages, as far as we could read them (search excerpts), give no fixed distance from airports. A fixed circle would mislead.",
	},
	SRB: {
		none: "The CAD's pages, as far as we could read them (search excerpts), give no fixed distance from airports. A fixed circle would mislead.",
	},
	QAT: {
		none: "The CAA's pages, as far as we could read them (search excerpts), give no fixed distance from airports. A fixed circle would mislead.",
	},
	NGA: {
		iso2: 'NG',
		radiusMeters: 10000,
		indicative: true,
		ruleUrl: 'https://ncaa.gov.ng/',
		authority: 'NCAA, Nig.CARs Part 21, rule 21.1.1.5',
		note: 'Part 21 sets 10 km from aerodromes, helipads and heliports. This circle is 10 km from the centre of every airport in the open data and shows no helipads or heliports, so it is only a guide.',
	},
	GHA: {
		iso2: 'GH',
		radiusMeters: 10000,
		indicative: true,
		ruleUrl: 'https://www.gcaa.com.gh/web/wp-content/uploads/2023/RPAS/RPAS%20FAQs.pdf',
		authority: 'GCAA RPAS FAQs',
		note: 'The GCAA\'s FAQ sets a 10 km restriction round airports or helipads with published instrument procedures, and 5 km where none are published, and says the GCAA can allow a flight inside it. This circle is 10 km from the centre of every airport in the open data, so it shows more places than the rule covers. Ask the GCAA for the real airspace.',
	},
	UGA: {
		iso2: 'UG',
		radiusMeters: 4000,
		indicative: true,
		ruleUrl: 'https://caa.go.ug/Download/81/unmanned-aircraft-systems-drones/5508/caa-unmanned-aircraft-systems-regulations-2022',
		authority: 'UCAA, Unmanned Aircraft Systems Regulations 2022, reg. 52(a)',
		note: 'Regulation 52 needs permission within 4 km of an aerodrome reference point. This circle is 4 km from the centre of every airport in the open data, so it is only a guide.',
	},
	OMN: {
		iso2: 'OM',
		radiusMeters: 5000,
		indicative: true,
		ruleUrl: 'https://www.caa.gov.om/files/publications/regulation-governing-unmanned-aircraft-systems-drones.pdf',
		authority: 'CAA Oman, Regulation Decision 1412/2023 (drones), art. 17(1)',
		note: 'The regulation bars flying within 5 km of airports, seaports and protected places. This circle is 5 km from the centre of every airport in the open data, so it is only a guide; it does not show seaports or protected places. Ask the CAA for the real airspace.',
	},
	JOR: {
		none: "The CARC's documents, as far as we could read them (search excerpts), give no fixed distance from airports. A fixed circle would mislead.",
	},
	BGD: {
		iso2: 'BD',
		radiusMeters: 18520,
		indicative: true,
		ruleUrl: 'https://new.caab.gov.bd/corporate/rpas.pdf',
		authority: 'CAAB, circular CAC-5 (Issue 01, 2019)',
		note: 'CAC-5 (read from an archive copy) sets 10 nautical miles from an aerodrome. A 2021 draft order is marked draft and we could not tell which text is in force. This circle is 10 nautical miles from the centre of every airport in the open data, so it is only a guide.',
	},
	NAM: {
		none: "The NCAA's documents, as far as we could read them (search excerpts), give no fixed distance from airports. A fixed circle would mislead.",
	},
	BWA: {
		none: "The CAAB's documents, as far as we could read them (search excerpts), give no fixed distance from airports. A fixed circle would mislead.",
	},
	MUS: {
		none: "The DCA's documents, as far as we could read them (search excerpts), give no fixed distance from airports. A fixed circle would mislead.",
	},
	KAZ: {
		none: "The Aviation Administration's documents, as far as we could read them (search excerpts), give no fixed distance from airports. A fixed circle would mislead.",
	},
	GEO: {
		none: "The GCAA's documents, as far as we could read them (search excerpts), give no fixed distance from airports. A fixed circle would mislead.",
	},
	MNE: {
		none: "The CAA's documents, as far as we could read them (search excerpts), give no fixed distance from airports. A fixed circle would mislead.",
	},
	ALB: {
		none: "The AAC's documents, as far as we could read them (search excerpts), give no fixed distance from airports. A fixed circle would mislead.",
	},
	MKD: {
		iso2: 'MK',
		radiusMeters: 8000,
		indicative: true,
		ruleUrl: 'https://www.caa.gov.mk/en/20706-2/',
		authority: 'CAA North Macedonia, guidance on aircraft without crew',
		note: 'An older, undated CAA guidance page says drones should stay at least 8 km (5 miles) from commercial airports. We did not confirm it against the 2025 Regulation on unmanned aircraft. This circle is 8 km from the centre of every airport in the open data, so it is only a guide. Check the CAA for the real zones.',
	},
	MNG: {
		iso2: 'MN',
		radiusMeters: 4000,
		indicative: true,
		ruleUrl: 'https://backend-api.mcaa.gov.mn/storage/filemanager/f8b4b814-cf21-4014-aa17-ca221e3bf048.pdf',
		authority: 'MCAA, AC102-1 (summary of Part 101)',
		note: 'AC102-1 gives 4 km from an aerodrome unless conditions allow flying closer. We did not read Part 101 itself. This circle is 4 km from the centre of every airport in the open data, so it is only a guide.',
	},
	RWA: {
		none: "The RCAA's documents, as far as we could read them (search excerpts), give no fixed distance from airports. A fixed circle would mislead.",
	},
	CRI: {
		none: "The DGAC's documents, as far as we could read them (search excerpts), give no fixed distance from airports. A fixed circle would mislead.",
	},
	URY: {
		none: "The DINACIA's documents, as far as we could read them (search excerpts), give no fixed distance from airports. A fixed circle would mislead.",
	},
	ZWE: {
		iso2: 'ZW',
		radiusMeters: 5500,
		indicative: true,
		ruleUrl: 'https://www.caaz.co.zw/drone-safety/',
		authority: 'CAAZ, drone safety',
		note: 'CAAZ\'s pages, as summarised by a search, say drones are prohibited within 5.5 km (3 nautical miles) of any airport or airfield. This circle is 5.5 km from the centre of every airport in the open data, so it is only a guide. Ask CAAZ for the real airspace.',
	},
	MDV: {
		none: "The CAA's documents, as far as we could read them (search excerpts), give no fixed distance from airports. A fixed circle would mislead.",
	},
	KWT: {
		none: "The DGCA's documents, as far as we could read them (search excerpts), give no fixed distance from airports. A fixed circle would mislead.",
	},
	FJI: {
		iso2: 'FJ',
		radiusMeters: 5000,
		indicative: true,
		ruleUrl: 'https://www.caaf.org.fj/rpas-frequently-asked-questions/',
		authority: 'CAAF, RPAS FAQ',
		note: 'CAAF\'s FAQ, as summarised by a search, says flights need permission within 5 km of an international aerodrome and within 3 km of a domestic one. This circle is 5 km from the centre of every airport in the open data, so it shows more than the rule covers at domestic airports. Ask CAAF for the real airspace.',
	},
	PNG: {
		iso2: 'PG',
		radiusMeters: 5556,
		indicative: true,
		ruleUrl: 'https://casapng.gov.pg/admin/images/372675fd91d5577dac18323252c4b2d4.pdf',
		authority: 'CASA PNG, Part 101 and Part 102',
		note: 'CASA PNG\'s rules, as summarised by a search, ask for an additional qualification to fly a remotely piloted aircraft within 3 nautical miles (5.56 km) of an aerodrome reference point. This circle is drawn at every airport in the open data, so it is only a guide. Ask CASA PNG for the real airspace.',
	},
	DOM: {
		none: "IDAC's guide, as far as we could read it (search excerpts), gives no fixed distance from airports. A fixed circle would mislead.",
	},
	JAM: {
		iso2: 'JM',
		radiusMeters: 5000,
		indicative: true,
		ruleUrl: 'https://www.jcaa.gov.jm/recreational-ua-operators-or-hobbyists/',
		authority: 'JCAA, recreational UA operators',
		note: 'The JCAA\'s guidelines for recreational operators, as summarised by a search, say not to fly within 5 km (16,500 ft) of any aerodrome or rotorcraft landing zone. This circle is 5 km from the centre of every airport in the open data, so it is only a guide. Ask the JCAA for the real airspace.',
	},
	TTO: {
		none: "The TTCAA's documents, as far as we could read them (search excerpts), give no fixed distance from airports. A fixed circle would mislead.",
	},
	MDA: {
		none: "The CAA's documents, as far as we could read them (search excerpts), give no fixed distance from airports. A fixed circle would mislead.",
	},
	PRY: {
		none: "The DINAC's documents, as far as we could read them (search excerpts), give no fixed distance from airports. A fixed circle would mislead.",
	},
	BIH: {
		iso2: 'BA',
		radiusMeters: 1500,
		indicative: true,
		ruleUrl: 'https://www.bhdca.gov.ba/index.php/en/drone',
		authority: 'BHDCA, drone page (commercial operations, rule h)',
		note: 'The BHDCA\'s drone page says that, for commercial flights, a drone may fly within an airport area at a distance of less than 1.5 km only with the prior consent of air traffic control. The page gives no airport distance for non-commercial flights, so this circle shows more than the rule covers for recreational flying. It is 1.5 km from the centre of every airport in the open data. Ask the BHDCA for the real airspace.',
	},
	MOZ: {
		iso2: 'MZ',
		radiusMeters: 5000,
		indicative: true,
		ruleUrl: 'https://www.iacm.gov.mz/app/uploads/2018/12/DOS-09-2018-Normas-de-Operacoes-de-Sistema-de-Aeronave-Pilotada-Remotamente-RPAS.pdf',
		authority: 'IACM, directive DOS-09-2018, section 8.3.3(d)',
		note: "The directive's prohibited list, which section 8.2.1(c) applies to recreational (Category A) flying, includes 5 km from aerodromes in Class G airspace. This circle is 5 km from the centre of every airport in the open data, whatever its airspace class, so it shows more places than the rule covers.",
	},
	SEN: {
		none: "The ANACIM's documents, as far as we could read them (search excerpts), give no fixed distance from airports. A fixed circle would mislead.",
	},
	UZB: {
		none: "The Civil Aviation Agency's documents, as far as we could read them (search excerpts), give no fixed distance from airports. A fixed circle would mislead.",
	},
	HND: {
		none: "The AHAC's documents, as far as we could read them (search excerpts), give no fixed distance from airports. A fixed circle would mislead.",
	},
	SLV: {
		none: "The AAC's documents, as far as we could read them (search excerpts), give no fixed distance from airports. A fixed circle would mislead.",
	},
	MDG: {
		none: "The ACM's documents, as far as we could read them (search excerpts), give no fixed distance from airports. A fixed circle would mislead.",
	},
	CMR: {
		none: "The CCAA's documents, as far as we could read them (search excerpts), give no fixed distance from airports. A fixed circle would mislead.",
	},
	CIV: {
		none: "The ANAC's documents, as far as we could read them (search excerpts), give no fixed distance from airports. A fixed circle would mislead.",
	},
	CHN: {
		none: "The CAAC's documents, as far as we could read them (search excerpts), give no fixed distance from airports. A fixed circle would mislead.",
	},
	TWN: {
		none: "The CAA's documents, as far as we could read them (search excerpts), give no fixed distance from airports. A fixed circle would mislead.",
	},
	BRN: {
		iso2: 'BN',
		radiusMeters: 5000,
		indicative: true,
		ruleUrl: 'https://www.dca.gov.bn/Site%20Pages/Unmanned%20Aircraft%20Registration%20Guide.aspx',
		authority: 'DCA Brunei, unmanned aircraft registration guide',
		note: 'The DCA\'s guide, as summarised by a search, says to keep drones away from airports, heliports, military bases and other restricted areas, specifically within 5 km. This circle is 5 km from the centre of every airport in the open data; heliports and military bases are not shown, so it is only a guide. Ask the DCA for the real areas.',
	},
	MEX: {
		iso2: 'MX',
		radiusMeters: 9200,
		indicative: true,
		ruleUrl: 'https://www.gob.mx/cms/uploads/attachment/file/602732/nom-107-sct3-2019-201119.pdf',
		authority: 'SCT/AFAC, NOM-107-SCT3-2019, section 4.10.1',
		note: 'NOM-107 section 4.10.1 sets 9.2 km from aerodromes (900 m from heliports, section 4.10.2, not shown). This circle is 9.2 km from the centre of every airport in the open data, so it is only a guide.',
	},
	RUS: {
		none: "Rosaviatsia's documents, as far as we could read them (search excerpts), give no fixed distance from airports. A fixed circle would mislead.",
	},
	ECU: {
		none: "The DGAC's documents, as far as we could read them (search excerpts), give no fixed distance from airports. A fixed circle would mislead.",
	},
	PAK: {
		none: "The PCAA's documents, as far as we could read them (search excerpts), give no fixed distance from airports. A fixed circle would mislead.",
	},
	PAN: {
		none: "The AAC's documents, as far as we could read them (search excerpts), give no fixed distance from airports. A fixed circle would mislead.",
	},
	VEN: {
		none: "The INAC's documents, as far as we could read them (search excerpts), give no fixed distance from airports. A fixed circle would mislead.",
	},
	BHR: {
		none: "The CAA's documents, as far as we could read them (search excerpts), give no fixed distance from airports. A fixed circle would mislead.",
	},
	DZA: {
		none: "The national centre's documents, as far as we could read them (search excerpts), give no fixed distance from airports. A fixed circle would mislead.",
	},
	SYC: {
		none: "The SCAA's documents, as far as we could read them (search excerpts), give no fixed distance from airports. A fixed circle would mislead.",
	},
	BRB: {
		none: "The BCAA's documents, as far as we could read them (search excerpts), give no fixed distance from airports. A fixed circle would mislead.",
	},
	GUY: {
		none: "The GCAA's documents, as far as we could read them (search excerpts), give no fixed distance from airports. A fixed circle would mislead.",
	},
	BLZ: {
		none: "The BDCA's documents, as far as we could read them (search excerpts), give no fixed distance from airports. A fixed circle would mislead.",
	},
	CUB: {
		none: "The IACC's documents, as far as we could read them (search excerpts), give no fixed distance from airports. A fixed circle would mislead.",
	},
	MCO: {
		none: "The Monaco decrees' documents, as far as we could read them (search excerpts), give no fixed distance from airports. A fixed circle would mislead.",
	},
	AND: {
		none: "The AAA's documents, as far as we could read them (search excerpts), give no fixed distance from airports. A fixed circle would mislead.",
	},
	KOS: {
		none: "The CAA's documents, as far as we could read them (search excerpts), give no fixed distance from airports. A fixed circle would mislead.",
	},
	BLR: {
		none: "The Department of Aviation's documents, as far as we could read them (search excerpts), give no fixed distance from airports. A fixed circle would mislead.",
	},
	KGZ: {
		none: "The Agency's documents, as far as we could read them (search excerpts), give no fixed distance from airports. A fixed circle would mislead.",
	},
	VNM: {
		none: "The CAAV's documents, as far as we could read them (search excerpts), give no fixed distance from airports. A fixed circle would mislead.",
	},
	BTN: {
		iso2: 'BT',
		radiusMeters: 5000,
		indicative: true,
		ruleUrl: 'https://bcaa.gov.bt/wp-content/uploads/2025/02/UAS-Regulation-2017.pdf',
		authority: 'BCAA, UAS Regulation 2017, clause 4.12.10.3(c)',
		note: 'The regulation puts 5 km from a controlled aerodrome off limits unless air traffic control authorises. This circle is 5 km from the centre of every airport in the open data, controlled or not, so it shows more places than the rule covers.',
	},
	SLE: {
		iso2: 'SL',
		radiusMeters: 4000,
		indicative: true,
		ruleUrl: 'https://www.slcaa.gov.sl/',
		authority: 'SLCAA, Part 6B rule 2.11.1',
		note: 'Part 6B sets 4 km from an aerodrome, and from the movement area of a controlled aerodrome. This circle is 4 km from the centre of every airport in the open data, so it is only a guide.',
	},
	CPV: {
		iso2: 'CV',
		radiusMeters: 2000,
		indicative: true,
		ruleUrl: 'https://www.aac.cv/artigos/drones',
		authority: 'AAC Cabo Verde, drones',
		note: 'The AAC\'s drone page, as summarised by a search, says drones may not be flown within 2,000 m of an aerodrome or landing site, or along aircraft flight routes. This circle is 2 km from the centre of every airport in the open data, so it is only a guide. Ask the AAC for the real areas.',
	},
	IRN: {
		none: "The CAO's pages, as far as we could read them (search excerpts), give no fixed distance from airports. A fixed circle would mislead.",
	},
	EGY: {
		none: "The ECAA's pages, as far as we could read them (search excerpts), give no fixed distance from airports. A fixed circle would mislead.",
	},
	ETH: {
		none: "The ECAA's pages, as far as we could read them (search excerpts), give no fixed distance from airports. A fixed circle would mislead.",
	},
	SLB: {
		none: "CAASI's pages, as far as we could read them (search excerpts), give no fixed distance from airports. A fixed circle would mislead.",
	},
	ATG: {
		none: "The ECCAA's pages, as far as we could read them (search excerpts), give no fixed distance from airports. A fixed circle would mislead.",
	},
	ARE: {
		iso2: 'AE',
		radiusMeters: 5000,
		indicative: true,
		ruleUrl: 'https://u.ae/en/information-and-services/justice-safety-and-the-law/Safety/aviation-safety',
		authority: 'GCAA and the UAE government portal (u.ae)',
		note: "The u.ae aviation safety page and the GCAA registration page say not to fly within 5 km of the airports' outer fence, heliports, helicopter landing sites, airfields and controlled zones. The 5 km is not in the regulation we read (CAR-UAR issue 3), and the guide says so. This circle is 5 km from the airport's centre, not its fence, and is drawn at every airport in the open data, so it is only a guide. Dubai has its own authority (DCAA), whose directive we read but whose map we could not. Use the UAE Drones app for the real zones.",
	},
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
	CAN: {
		iso2: 'CA',
		// 3 nautical miles, Transport Canada's distance from a certified airport.
		radiusMeters: 3 * 1852,
		indicative: true,
		ruleUrl: 'https://tc.canada.ca/en/aviation/drone-safety/learn-rules-you-fly-your-drone/where-fly-your-drone',
		authority: 'Transport Canada, "Where to fly your drone"',
		note: 'Transport Canada says not to fly closer than 5.6 km (3 nautical miles) to an airport listed as certified in the Canada Flight Supplement, or 1.9 km (1 nautical mile) to a certified heliport, unless you follow an established procedure. This circle is drawn at every airport in the open data, certified or not, so it shows more places than the rule covers. Heliports are not shown. Military aerodromes need permission from the Department of National Defence.',
	},
	AUS: {
		iso2: 'AU',
		// 3 nautical miles, CASA's distance from a controlled airport for a drone over 250 g.
		radiusMeters: 5500,
		indicative: true,
		ruleUrl: 'https://www.casa.gov.au/drones/drone-rules/flying-near-airports',
		authority: 'CASA, "Flying near airports"',
		note: "CASA says a drone over 250 g must not fly within 5.5 km (3 nautical miles) of a controlled airport (one with a control tower), measured from the runway centreline, nor in the runway's approach and departure paths, which reach 7 km. Near an airport without a tower you may fly, but must move away from any crewed aircraft. This circle is drawn at every airport in the open data, so it shows more places than the rule covers. Check a CASA-verified drone safety app.",
	},
	JPN: {
		none: "JCAB prohibits flying in the airspace around airports without permission, but shows it as an area on a map and the page we read gives no distance. A fixed circle would mislead.",
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
	LUX: {
		none: "Luxembourg's civil aviation directorate gives no single distance from airports. It publishes its UAS zones as an open data file instead, and the map draws those outlines (see data/zones/lux-official.geojson).",
	},
	MLT: EU_NONE,
	NLD: EU_NONE,
	POL: EU_NONE,
	PRT: EU_NONE,
	ROU: EU_NONE,
	SVK: EU_NONE,
	SVN: {
		iso2: 'SI',
		radiusMeters: 5000,
		indicative: true,
		ruleUrl: 'https://www.caa.si/',
		authority: 'Civil Aviation Agency of Slovenia, 2024 UAS regulation (Uradni list RS 39/2024), art. 13',
		note: 'In the open category, flying inside a control zone (CTR) within 5 km of an airport reference point is banned. This circle is 5 km from the airport\'s centre and is drawn at every airport in the open data, including those with no control zone, so it shows more places than the rule covers. Use the agency\'s 2D zone map for the real zones.',
	},
	ESP: EU_NONE,
	SWE: {
		iso2: 'SE',
		radiusMeters: 5000,
		indicative: true,
		ruleUrl: 'https://www.transportstyrelsen.se/en/aviation/aircraft/drones-unmanned-aircraft/guide-to-uas-operations-in-sweden/',
		authority: 'Transportstyrelsen, "Guide to UAS operations in Sweden"',
		note: 'Transportstyrelsen says flying closer than 5 km to any runway needs air traffic control permission at any height, and that heliports need coordination within 1,000 m. This circle is 5 km from the airport\'s centre, not its runway, and is drawn at every airport in the open data, so it is only a guide. Heliports are not shown. Use LFV\'s drone chart for the real zones.',
	},
};
