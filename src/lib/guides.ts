interface GuideEntry {
	id: string;
	data: { iso3: string };
}

// Maps each country's iso3 code to its guide URL for the map.
// Throws on duplicates, since the map can only link a country to one guide.
export function guideUrls(entries: GuideEntry[]): Record<string, string> {
	const urls: Record<string, string> = {};
	for (const { id, data } of entries) {
		if (urls[data.iso3]) throw new Error(`Duplicate iso3 ${data.iso3} in guide "${id}"`);
		urls[data.iso3] = `/countries/${id}/`;
	}
	return urls;
}
