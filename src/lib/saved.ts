// Countries a visitor saved, kept in this browser only: iso3 -> the guide's last-verified date when they saved it
// or last looked. A guide checked since then shows an "updated" tag on its chip.
export type Saved = Record<string, string>;

export function parseSaved(raw: string | null): Saved {
	try {
		const data = JSON.parse(raw ?? '{}');
		if (!data || typeof data !== 'object' || Array.isArray(data)) return {};
		return Object.fromEntries(Object.entries(data).filter(([, v]) => typeof v === 'string')) as Saved;
	} catch {
		return {};
	}
}

export function toggleSaved(saved: Saved, iso3: string, verified: string): Saved {
	const { [iso3]: was, ...rest } = saved;
	return was === undefined ? { ...saved, [iso3]: verified } : rest;
}

// Saved countries whose guide was checked after the visitor last looked. ISO dates compare as text.
export function changedSince(saved: Saved, guides: Record<string, { lastVerified: string }>): string[] {
	return Object.entries(saved)
		.filter(([iso3, seen]) => guides[iso3] && guides[iso3].lastVerified > seen)
		.map(([iso3]) => iso3);
}

// Looking at a saved country counts as seeing its update.
export function markSeen(saved: Saved, iso3: string, verified: string): Saved {
	return Object.hasOwn(saved, iso3) ? { ...saved, [iso3]: verified } : saved;
}
