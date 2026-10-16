// The key facts the map's popup shows for a country; everything else lives on the guide page.
export interface GuideSummary {
	name: string;
	url: string;
	authority: string;
	authorityUrl: string;
	whoMustRegister: string | null;
	minOperatorAge: number | null;
	remoteId: string | null;
	insurance: string | null;
	lastVerified: string;
}

interface GuideEntry {
	id: string;
	data: {
		iso3: string;
		name: string;
		authority: string;
		authorityUrl: string;
		whoMustRegister: string | null;
		minOperatorAge: number | null;
		remoteId: string | null;
		insurance: string | null;
		lastVerified: Date;
	};
}

// Maps each country's iso3 code to its popup summary for the map.
// Throws on duplicates, since the map can only show one guide per country.
export function guideSummaries(entries: GuideEntry[]): Record<string, GuideSummary> {
	const summaries: Record<string, GuideSummary> = {};
	for (const { id, data } of entries) {
		if (summaries[data.iso3]) throw new Error(`Duplicate iso3 ${data.iso3} in guide "${id}"`);
		summaries[data.iso3] = {
			name: data.name,
			url: `/countries/${id}/`,
			authority: data.authority,
			authorityUrl: data.authorityUrl,
			whoMustRegister: data.whoMustRegister,
			minOperatorAge: data.minOperatorAge,
			remoteId: data.remoteId,
			insurance: data.insurance,
			lastVerified: data.lastVerified.toISOString().slice(0, 10),
		};
	}
	return summaries;
}
