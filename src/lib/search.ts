// Matches typed text against the names of countries that have a guide. Case and accents are ignored; names that
// start with the text come before names that only contain it.
const fold = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();

export interface SearchHit {
	iso3: string;
	name: string;
}

export function searchCountries(query: string, guides: Record<string, { name: string }>, limit = 6): SearchHit[] {
	const q = fold(query);
	if (!q) return [];
	const hits = Object.entries(guides).map(([iso3, { name }]) => ({ iso3, name, at: fold(name).indexOf(q) }));
	return hits
		.filter((h) => h.at >= 0)
		.sort((a, b) => Number(a.at > 0) - Number(b.at > 0) || a.name.localeCompare(b.name))
		.slice(0, limit)
		.map(({ iso3, name }) => ({ iso3, name }));
}
