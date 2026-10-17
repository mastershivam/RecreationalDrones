// The countries page's search box, level pills and sort order. Pure, so it can be tested; the page only moves the rows.
import type { Level } from './restrictiveness';

export interface CountryRow {
	id: string;
	name: string;
	level: Level;
	// Lowest weight that needs registering, in grams, or null when not yet verified.
	weight: number | null;
	// ISO date the guide was last checked.
	checked: string;
	region: string;
}

export type SortKey = 'name' | 'level' | 'checked';

const fold = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();

// Ids in the order to show, leaving out rows that do not match. No pills selected means every level.
// `region` of '' means every region.
export function visibleCountries(rows: CountryRow[], query: string, levels: ReadonlySet<Level>, sort: SortKey, region = ''): string[] {
	const q = fold(query);
	const compare: Record<SortKey, (a: CountryRow, b: CountryRow) => number> = {
		name: (a, b) => a.name.localeCompare(b.name),
		// Least restrictive first, ties by name.
		level: (a, b) => a.level - b.level || a.name.localeCompare(b.name),
		// Longest since checked first, so the guides most in need of a look come first.
		checked: (a, b) => a.checked.localeCompare(b.checked) || a.name.localeCompare(b.name),
	};
	return rows
		.filter((r) => (!q || fold(r.name).includes(q)) && (!levels.size || levels.has(r.level)) && (!region || r.region === region))
		.sort(compare[sort])
		.map((r) => r.id);
}
