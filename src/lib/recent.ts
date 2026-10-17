// The countries a visitor opened last, newest first, kept in this browser only. Search offers them as one-tap chips.
export function pushRecent(recent: string[], iso3: string, max = 4): string[] {
	return [iso3, ...recent.filter((code) => code !== iso3)].slice(0, max);
}

// What the chips show: saved countries, then recent ones, then the popular ones, each once, only if there is a guide for it.
export function chipCountries(saved: string[], recent: string[], popular: string[], guides: Record<string, unknown>, max = 6): string[] {
	return [...new Set([...saved, ...recent, ...popular])].filter((code) => Object.hasOwn(guides, code)).slice(0, max);
}
