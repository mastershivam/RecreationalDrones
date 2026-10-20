// Which part of the world each guide is in, by guide slug, for the countries page's region filter. The EU is one
// region because its members share EASA's rules.
const EU = 'austria belgium bulgaria croatia cyprus czechia denmark estonia finland france germany greece hungary ireland italy latvia lithuania luxembourg malta netherlands poland portugal romania slovakia slovenia spain sweden'.split(' ');
const OTHER: Record<string, string> = {
	'united-kingdom': 'Europe, outside the EU',
	switzerland: 'Europe, outside the EU',
	norway: 'Europe, outside the EU',
	iceland: 'Europe, outside the EU',
	liechtenstein: 'Europe, outside the EU',
	'united-states': 'North America',
	canada: 'North America',
	japan: 'Asia',
	thailand: 'Asia',
	nepal: 'Asia',
	'united-arab-emirates': 'Asia',
	'new-zealand': 'Oceania',
	india: 'Asia',
	'south-korea': 'Asia',
	brazil: 'South America',
	'south-africa': 'Africa',
	australia: 'Oceania',
};

export const REGIONS = ['European Union', 'Europe, outside the EU', 'North America', 'South America', 'Africa', 'Asia', 'Oceania'];

// A new guide with no region is a bug, so this throws and the build stops (regions.test.ts also checks every guide).
export function regionOf(slug: string): string {
	if (EU.includes(slug)) return 'European Union';
	const region = OTHER[slug];
	if (!region) throw new Error(`No region for guide "${slug}": add it to src/lib/regions.ts`);
	return region;
}
