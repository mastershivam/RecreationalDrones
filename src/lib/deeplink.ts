// `?country=JPN` opens that country's summary. Anything that is not a guided country is ignored.
export function countryFromSearch(search: string, guides: Record<string, unknown>): string | undefined {
	const code = new URLSearchParams(search).get('country')?.toUpperCase();
	return code && Object.hasOwn(guides, code) ? code : undefined;
}

// The address to show while a country is open (or the plain page when none is), keeping other parameters such as ?e2e.
export function searchWithCountry(search: string, iso3?: string): string {
	const params = new URLSearchParams(search);
	if (iso3) params.set('country', iso3);
	else params.delete('country');
	const text = params.toString();
	return text ? `?${text}` : '';
}
