import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { countrySchema } from '../lib/country-schema';
import { guideSummaries } from '../lib/guides';

const dir = join(import.meta.dirname, 'countries');
const guides = readdirSync(dir)
	.filter((f) => f.endsWith('.mdx'))
	.map((file) => {
		const frontmatter = readFileSync(join(dir, file), 'utf8').match(/^---\n([\s\S]*?)\n---/)?.[1];
		return { file, frontmatter: frontmatter === undefined ? undefined : parse(frontmatter) };
	});

describe('country guides', () => {
	it('has at least one guide', () => {
		expect(guides.length).toBeGreaterThan(0);
	});

	it.each(guides)('$file has valid frontmatter', ({ frontmatter }) => {
		expect(frontmatter).toBeDefined();
		const result = countrySchema.safeParse(frontmatter);
		expect(result.success, JSON.stringify(result.error?.issues)).toBe(true);
	});

	it.each(guides)('$file was verified no later than today', ({ frontmatter }) => {
		expect(new Date(frontmatter.lastVerified).getTime()).toBeLessThanOrEqual(Date.now());
	});

	it('has no two guides for the same country', () => {
		const entries = guides.map(({ file, frontmatter }) => ({
			id: file.replace(/\.mdx$/, ''),
			data: countrySchema.parse(frontmatter),
		}));
		expect(() => guideSummaries(entries)).not.toThrow();
	});
});

describe('Nepal guide', () => {
	const file = readFileSync(join(dir, 'nepal.mdx'), 'utf8');
	const data = countrySchema.parse(parse(file.match(/^---\n([\s\S]*?)\n---/)![1]));

	it('is keyed to the code the map uses for Nepal', () => {
		expect(data.iso3).toBe('NPL');
	});

	it('names the Civil Aviation Authority of Nepal as the authority', () => {
		expect(data.authority).toContain('Civil Aviation Authority of Nepal');
		expect(new URL(data.authorityUrl).hostname).toBe('caanepal.gov.np');
	});

	it('only states what the official CAAN registration documents say about insurance: over 2 kg', () => {
		expect(data.insurance).toContain('over 2 kg');
		expect(data.whoMustRegister).toContain('2 kg');
	});

	it('leaves unchecked rules unverified rather than guessing', () => {
		// The UASR sets 18 for a remote pilot licence but not whether recreational flyers need one.
		expect(data.minOperatorAge).toBeNull();
	});

	it('says every drone must register, whatever its weight, as UASR 101.5 does', () => {
		expect(data.registrationWeightGrams).toBe(0);
		expect(data.whoMustRegister).toContain('whatever its weight');
		expect(file).toContain('Category A');
		expect(file).toContain('under 250 g');
	});

	it('says the UASR has no Remote ID rule, only a UIN shown on the drone', () => {
		expect(data.remoteId).toContain('do not mention Remote ID');
		expect(data.remoteId).toContain('Unique Identification Number');
	});

	it('says permission to fly comes from CAAN, with Home Ministry security clearance', () => {
		expect(file).toContain('## Permission to fly');
		expect(file).toContain('permission from CAAN');
		expect(file).toContain('security clearance letter from the Ministry of Home Affairs');
	});

	it("gives CAAN's standard limits on height, distance and airports", () => {
		expect(file).toContain('100 m (328 ft)');
		expect(file).toContain('**300 m**');
		expect(file).toContain('**30 m**');
		expect(file).toContain('**5 km**');
	});

	it('lists the no-fly areas it could not confirm, rather than guessing them', () => {
		const notCovered = file.slice(file.indexOf('## Not covered yet'));
		expect(notCovered).toContain('national parks');
		expect(notCovered).toContain('Kathmandu valley');
		expect(notCovered).toContain('Everest region');
	});

	it('gives the official fee and forms, which have to match the CAAN documents', () => {
		expect(file).toContain('USD 50 plus 13% VAT');
		expect(file).toContain('RPA/Form/001');
		expect(file).toContain('RPA/Form/002');
	});

	it('keeps bank account numbers out of the page, since they can go out of date', () => {
		const body = file.replace(/^---\n[\s\S]*?\n---/, '');
		expect(body).not.toMatch(/\d{12,}/);
		expect(body).not.toContain('1690100000133001');
	});

	it('says what it does not cover, so readers do not assume the rules are complete', () => {
		expect(file).toContain('Not covered yet');
	});

	it('cites the official CAAN documents as its sources', () => {
		expect(data.sources.length).toBeGreaterThanOrEqual(2);
		for (const url of data.sources) expect(url).toContain('caanepal.gov.np');
	});
});


describe('Thailand guide', () => {
	const file = readFileSync(join(dir, 'thailand.mdx'), 'utf8');
	const data = countrySchema.parse(parse(file.match(/^---\n([\s\S]*?)\n---/)![1]));

	it('is keyed to the code the map uses for Thailand', () => {
		expect(data.iso3).toBe('THA');
	});

	it('names the Civil Aviation Authority of Thailand as the authority and links its UAS Portal', () => {
		expect(data.authority).toContain('Civil Aviation Authority of Thailand');
		expect(new URL(data.authorityUrl).hostname).toBe('www.caat.or.th');
		expect(data.registrationUrl).toBe('https://uasportal.caat.or.th/');
	});

	it('says which drones must register, as CAAT lists them: camera, over 2 kg, over 25 kg', () => {
		expect(data.whoMustRegister).toContain('camera');
		expect(data.whoMustRegister).toContain('2 kg');
		expect(data.whoMustRegister).toContain('25 kg');
		expect(data.registrationWeightGrams).toBe(0);
	});

	it('gives the insurance minimum, 1,000,000 baht for drones under 25 kg', () => {
		expect(data.insurance).toContain('1,000,000 baht');
		expect(data.insurance).toContain('25 kg');
	});

	it('leaves minimum age and Remote ID unverified, because CAAT does not state them', () => {
		expect(data.minOperatorAge).toBeNull();
		expect(data.remoteId).toBeNull();
	});

	it("gives CAAT's flying limits: 90 m, 9 km from an aerodrome, daylight", () => {
		expect(file).toContain('**90 m (300 ft)**');
		expect(file).toContain('**9 km**');
		expect(file).toContain('daylight');
	});

	it('gives the registration number sizes, 3 mm and 25 mm', () => {
		expect(file).toContain('**3 mm**');
		expect(file).toContain('**25 mm**');
	});

	it('explains the pilot certificate: online exam, valid for 2 years, 24-hour retake wait', () => {
		expect(file).toContain('## Pilot certificate');
		expect(file).toContain('valid for **2 years**');
		expect(file).toContain('24 hours');
	});

	it('says permits for advanced flights come from CAAT by email', () => {
		expect(file).toContain('uas_ur@caat.or.th');
	});

	it('says what it does not cover, including the NBTC radio rules it has not read', () => {
		const notCovered = file.slice(file.indexOf('## Not covered yet'));
		expect(notCovered).toContain('NBTC');
		expect(notCovered).toContain('Fees');
		expect(notCovered).toContain('Remote ID');
	});

	it("cites CAAT's own pages as its sources", () => {
		expect(data.sources.length).toBe(3);
		for (const url of data.sources) expect(new URL(url).hostname).toBe('www.caat.or.th');
	});
});

describe('restrictiveness levels', () => {
	const rated = guides.map(({ file, frontmatter }) => ({ file, data: countrySchema.parse(frontmatter) }));
	const level = (iso3: string) => rated.find((g) => g.data.iso3 === iso3)!.data.restrictiveness;

	it.each(rated)('$file says why it got its level', ({ data }) => {
		expect(data.restrictivenessReason.length).toBeGreaterThan(20);
	});

	it('rates the countries that need an in-person step or a second authority at level 3', () => {
		expect(level('NPL')).toBe(3);
		expect(level('THA')).toBe(3);
	});

	it('rates online registration with an online test at level 2', () => {
		for (const iso3 of ['GBR', 'USA', 'DEU', 'FRA']) expect(level(iso3), iso3).toBe(2);
	});
});

describe('United States guide', () => {
	const file = readFileSync(join(dir, 'united-states.mdx'), 'utf8');
	const data = countrySchema.parse(parse(file.match(/^---\n([\s\S]*?)\n---/)![1]));

	it('is keyed to the code the map uses for the United States', () => {
		expect(data.iso3).toBe('USA');
	});

	it('names the FAA as the authority and links DroneZone', () => {
		expect(data.authority).toContain('Federal Aviation Administration');
		expect(new URL(data.authorityUrl).hostname).toBe('www.faa.gov');
		expect(new URL(data.registrationUrl!).hostname).toBe('faadronezone-access.faa.gov');
	});

	it('registers drones of 250 g or more, and says work drones under 250 g register too', () => {
		expect(data.registrationWeightGrams).toBe(250);
		expect(data.whoMustRegister).toContain('250 g');
		expect(data.whoMustRegister).toContain('for work');
		expect(data.registrationFee).toBe('$5, valid 3 years');
	});

	it('gives the $5, three-year fee and the TRUST test', () => {
		expect(file).toContain('**$5**');
		expect(file).toContain('**3 years**');
		expect(file).toContain('TRUST');
	});

	it('says foreign remote pilot certificates are not recognised', () => {
		expect(file).toContain('does **not recognise a foreign remote pilot certificate**');
	});

	it('leaves the unchecked recreational age and insurance unverified', () => {
		expect(data.minOperatorAge).toBeNull();
		expect(data.insurance).toBeNull();
	});

	it('says what it does not cover', () => {
		expect(file).toContain('## Not covered yet');
		expect(file).toContain('State and local rules');
	});
});

describe('EU guides', () => {
	const EU = 'AUT BEL BGR HRV CYP CZE DNK EST FIN FRA DEU GRC HUN IRL ITA LVA LTU LUX MLT NLD POL PRT ROU SVK SVN ESP SWE'.split(' ');
	const rules = readFileSync(join(import.meta.dirname, '../components/EasaRules.mdx'), 'utf8');
	const euGuides = guides
		.map(({ file, frontmatter }) => ({ file, data: countrySchema.parse(frontmatter), text: readFileSync(join(dir, file), 'utf8') }))
		.filter(({ data }) => EU.includes(data.iso3));

	it('has a guide for each of the 27 member states, and no other', () => {
		expect(euGuides.map((g) => g.data.iso3).sort()).toEqual([...EU].sort());
	});

	it('gives the EASA rules once, in a shared file, with the numbers EASA publishes', () => {
		for (const fact of ['250 g', '120 m', '30 m', '150 m', '**16**', '12', '20 kg', 'A1', 'A2', 'A3']) {
			expect(rules, fact).toContain(fact);
		}
	});

	it.each(euGuides)('$file includes the shared rules and says what is not covered', ({ text }) => {
		expect(text).toContain("import EasaRules from '../../components/EasaRules.mdx';");
		expect(text).toContain('<EasaRules />');
		expect(text).toContain('## Not covered yet');
	});

	it.each(euGuides)('$file cites EASA and links its own authority', ({ data }) => {
		expect(data.sources.some((url) => new URL(url).hostname === 'www.easa.europa.eu')).toBe(true);
		expect(data.registrationWeightGrams).toBe(0);
		// A registration link is optional (a page that did not load is left out), but if given it is a source.
		if (data.registrationUrl) expect(data.sources).toContain(data.registrationUrl);
	});

	it.each(euGuides)('$file leaves the minimum age unverified, because a state may lower it', ({ data }) => {
		expect(data.minOperatorAge).toBeNull();
	});
});

describe('Canada guide', () => {
	const file = readFileSync(join(dir, 'canada.mdx'), 'utf8');
	const data = countrySchema.parse(parse(file.match(/^---\n([\s\S]*?)\n---/)![1]));

	it('is keyed to the code the map uses for Canada, and cites Transport Canada only', () => {
		expect(data.iso3).toBe('CAN');
		expect(data.authority).toBe('Transport Canada');
		for (const url of data.sources) expect(new URL(url).hostname).toBe('tc.canada.ca');
	});

	it('registers drones of 250 g or more, and says under 250 g needs neither registration nor a certificate', () => {
		expect(data.registrationWeightGrams).toBe(250);
		expect(data.whoMustRegister).toContain('250 g');
		expect(data.whoMustRegister).toContain('Under 250 g needs neither');
	});

	it('gives the basic exam facts: age 14, 35 questions, 65% to pass, 24 hours between tries', () => {
		expect(data.minOperatorAge).toBe(14);
		for (const fact of ['35 multiple-choice', '65% to pass', '24 hours']) expect(file).toContain(fact);
	});

	it('says a foreign pilot cannot register and needs a Foreign SFOC-RPAS and a Canadian certificate, so it is level 3', () => {
		expect(data.restrictiveness).toBe(3);
		expect(file).toContain('**cannot register**');
		expect(file).toContain('Foreign SFOC-RPAS');
		expect(file).toContain('Canadian drone pilot certificate');
	});

	it('gives the distances Transport Canada gives: 30 m from people, 5.6 km from airports, 1.9 km from heliports', () => {
		for (const fact of ['**30 m (100 ft)**', '**5.6 km (3 nautical miles)**', '**1.9 km (1 nautical mile)**']) expect(file).toContain(fact);
	});

	it('leaves the fee unverified, since the page text does not give one', () => {
		expect(data.registrationFee).toBeNull();
		expect(file).toContain('## Not covered yet');
	});
});

describe('Australia guide', () => {
	const file = readFileSync(join(dir, 'australia.mdx'), 'utf8');
	const data = countrySchema.parse(parse(file.match(/^---\n([\s\S]*?)\n---/)![1]));

	it('is keyed to the code the map uses for Australia, and names CASA', () => {
		expect(data.iso3).toBe('AUS');
		expect(data.authority).toContain('Civil Aviation Safety Authority');
	});

	it('is level 1, because CASA asks nothing of people who fly for fun', () => {
		expect(data.restrictiveness).toBe(1);
		expect(data.whoMustRegister).toContain('flies only for fun');
		expect(file).toContain('There is no age limit');
	});

	it('gives the recreational limits: 120 m, 30 m from people, daylight, line of sight', () => {
		for (const fact of ['**120 m**', '**30 m**', '**daylight**', '**sight**']) expect(file).toContain(fact);
	});

	it('gives the airport distances for drones over and under 250 g', () => {
		for (const fact of ['**5.5 km (3 nautical miles)**', '**45 m**', '**1.4 km**']) expect(file).toContain(fact);
	});

	it('says it was read from Internet Archive copies, because casa.gov.au blocks automated downloads', () => {
		expect(file).toContain('Internet Archive');
	});

	it('gives no fine amount, since two CASA pages disagree', () => {
		const penalties = file.slice(file.indexOf('## Penalties'), file.indexOf('## Not covered yet'));
		expect(penalties).not.toMatch(/\$\s?\d/);
	});
});

describe('Japan guide', () => {
	const file = readFileSync(join(dir, 'japan.mdx'), 'utf8');
	const data = countrySchema.parse(parse(file.match(/^---\n([\s\S]*?)\n---/)![1]));

	it('is keyed to the code the map uses for Japan, and cites JCAB and the registration portal', () => {
		expect(data.iso3).toBe('JPN');
		expect(data.authority).toContain('Civil Aviation Bureau');
		expect(data.registrationUrl).toBe('https://www.mlit.go.jp/koku/drone/en/');
	});

	it('registers drones of 100 g or more, including a visitor’s, and requires Remote ID', () => {
		expect(data.registrationWeightGrams).toBe(100);
		expect(data.whoMustRegister).toContain('100 g');
		expect(data.whoMustRegister).toContain('including a drone brought in by a visitor');
		expect(data.remoteId).toContain('Required');
	});

	it('gives the three fees from the FAQ, and does not guess which one a visitor pays', () => {
		for (const fact of ['900 yen', '1,450 yen', '2,400 yen', 'does not say that outright']) expect(file).toContain(fact);
	});

	it('is level 3, because airports and densely inhabited districts need permission first', () => {
		expect(data.restrictiveness).toBe(3);
		expect(file).toContain('densely inhabited districts');
	});

	it('says the airport distance and the PDF leaflets were not read', () => {
		const notCovered = file.slice(file.indexOf('## Not covered yet'));
		expect(notCovered).toContain('How far the airport areas reach');
		expect(notCovered).toContain('PDF leaflets');
	});
});

describe('how to register', () => {
	const all = guides.map(({ file, frontmatter }) => ({ file, data: countrySchema.parse(frontmatter) }));
	const of = (iso3: string) => all.find((g) => g.data.iso3 === iso3)!.data.howToRegister!;

	it.each(all)('$file has steps, and something to have ready', ({ data }) => {
		expect(data.howToRegister).not.toBeNull();
		expect(data.howToRegister!.steps.length).toBeGreaterThanOrEqual(2);
		expect(data.howToRegister!.needed.length).toBeGreaterThanOrEqual(1);
	});

	it.each(all)('$file never says you may fly, only what to do to register', ({ data }) => {
		const text = JSON.stringify(data.howToRegister);
		expect(text).not.toMatch(/you can fly|allowed to fly|safe to fly/i);
	});

	it('gives the UK’s two IDs, their prices and how long they last', () => {
		const uk = of('GBR');
		expect(uk.steps.join(' ')).toContain('Flyer ID');
		expect(uk.validFor).toBe('Operator ID: 1 year. Flyer ID: 5 years.');
		expect(all.find((g) => g.data.iso3 === 'GBR')!.data.registrationFee).toBe('Operator ID £12.34 a year; Flyer ID free');
	});

	it('gives the US fee and term, and the notice a visitor sends instead', () => {
		expect(of('USA').steps.join(' ')).toContain('pay $5');
		expect(of('USA').validFor).toContain('3 years');
		expect(of('USA').steps.join(' ')).toContain('Notice of Identification');
	});

	it('says a visitor to Canada cannot register a drone and applies for a Foreign SFOC-RPAS instead', () => {
		expect(of('CAN').steps.join(' ')).toContain('cannot register a drone');
		expect(of('CAN').steps.join(' ')).toContain('Foreign SFOC-RPAS');
	});

	it('says Australia needs nothing for flying for fun, and registration for work lasts 12 months', () => {
		expect(of('AUS').needed.join(' ')).toContain('Nothing, if you fly only for fun');
		expect(of('AUS').validFor).toContain('12 months');
	});

	it('says Japan’s registration lasts 3 years and needs a passport for the online check', () => {
		expect(of('JPN').validFor).toContain('3 years');
		expect(of('JPN').needed.join(' ')).toContain('passport');
	});

	it('says a visitor to Nepal goes in person with the drone, and registration is not permission to fly', () => {
		expect(of('NPL').steps.join(' ')).toContain('in person');
		expect(of('NPL').afterwards).toContain('does not let you fly');
	});

	it('gives Thailand’s Thai mobile number, two authorities and the lifetime of the number and the certificate', () => {
		expect(of('THA').needed.join(' ')).toContain('Thai mobile number');
		expect(of('THA').steps.join(' ')).toContain('NBTC');
		expect(of('THA').validFor).toContain('2 years');
	});

	it('gives all 27 EU states the same EASA steps, and leaves their national requirements unread', () => {
		const eu = all.filter((g) => ['AUT', 'DEU', 'FRA', 'SWE', 'SVK'].includes(g.data.iso3));
		for (const { data } of eu) {
			expect(data.howToRegister!.steps[1]).toContain('once and not each drone');
			expect(data.howToRegister!.needed[0]).toContain('We have not read the list');
		}
	});
});
