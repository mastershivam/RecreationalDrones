// The key facts the map's hover preview shows for a country. Clicking opens the full guide instead.
export interface GuideSummary {
	name: string;
	// The guide page's path segment, for the "full guide" link.
	slug: string;
	whoMustRegister: string | null;
	registrationFee: string | null;
	registrationUrl: string | null;
	lastVerified: string;
}

interface GuideEntry {
	id: string;
	data: {
		iso3: string;
		name: string;
		whoMustRegister: string | null;
		registrationFee: string | null;
		registrationUrl: string | null;
		lastVerified: Date;
	};
}

// Maps each country's iso3 code to its preview summary for the map.
// Throws on duplicates, since the map can only show one guide per country.
export function guideSummaries(entries: GuideEntry[]): Record<string, GuideSummary> {
	const summaries: Record<string, GuideSummary> = {};
	for (const { id, data } of entries) {
		if (summaries[data.iso3]) throw new Error(`Duplicate iso3 ${data.iso3} in guide "${id}"`);
		summaries[data.iso3] = {
			name: data.name,
			slug: id,
			whoMustRegister: data.whoMustRegister,
			registrationFee: data.registrationFee,
			registrationUrl: data.registrationUrl,
			lastVerified: data.lastVerified.toISOString().slice(0, 10),
		};
	}
	return summaries;
}
