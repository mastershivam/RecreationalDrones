// The trip planner keeps its chosen countries in the address (/trip/?c=japan,germany), so a trip can be shared.
export function parseTrip(search: string, valid: ReadonlySet<string>): string[] {
	const ids = (new URLSearchParams(search).get('c') ?? '').split(',').filter((id) => valid.has(id));
	return [...new Set(ids)];
}

export function tripSearch(ids: string[]): string {
	return ids.length ? `?c=${ids.join(',')}` : '';
}

export interface TripCountry {
	id: string;
	name: string;
	levelText: string;
	whoMustRegister: string | null;
	fee: string | null;
	weight: number | null;
	age: number | null;
	remoteId: string | null;
	insurance: string | null;
	registerUrl: string | null;
}

// The rows of the combined checklist: what to look at, and each country's answer (null means not yet verified).
export const TRIP_ROWS: { label: string; value: (c: TripCountry) => string | null }[] = [
	{ label: 'Rules', value: (c) => c.levelText },
	{ label: 'Who must register', value: (c) => c.whoMustRegister },
	{ label: 'Registration fee', value: (c) => c.fee },
	{ label: 'Registration from', value: (c) => (c.weight === null ? null : `${c.weight} g`) },
	{ label: 'Minimum age', value: (c) => (c.age === null ? null : String(c.age)) },
	{ label: 'Remote ID', value: (c) => c.remoteId },
	{ label: 'Insurance', value: (c) => c.insurance },
];
