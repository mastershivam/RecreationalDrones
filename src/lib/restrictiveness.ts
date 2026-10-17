// How restrictive a country's rules are for someone flying a drone for fun. It is a judgement, so the criteria are
// written here, shown on the map's key and the countries page, and each guide says why it got its level.
export type Level = 1 | 2 | 3 | 4;

export const LEVELS: { level: Level; label: string; criteria: string }[] = [
	{ level: 1, label: 'No restrictions', criteria: 'No registration and no test for recreational flyers. The flying rules (height, distance from people) still apply.' },
	{ level: 2, label: 'Basic restrictions', criteria: 'Register online, with at most an online test. No in-person step and no permission before flying.' },
	{
		level: 3,
		label: 'Complex restrictions',
		criteria: 'Needs more than an online form and an online test: an in-person step, a second authority, a local phone number, or permission before flying.',
	},
	{ level: 4, label: 'Fully restricted', criteria: 'Flying a drone for fun is banned, or needs a government licence.' },
];

// "Basic restrictions"
export function levelText(level: Level): string {
	return LEVELS[level - 1].label;
}

// A MapLibre color expression that paints each guided country in its level's color. `fallback` paints anything else.
export function levelColorExpression(guides: Record<string, { level: Level }>, colorOf: (level: Level) => string, fallback: string) {
	const branches = LEVELS.flatMap(({ level }) => {
		const codes = Object.entries(guides)
			.filter(([, g]) => g.level === level)
			.map(([iso3]) => iso3);
		return codes.length ? [codes, colorOf(level)] : [];
	});
	return branches.length ? ['match', ['get', 'ADM0_A3'], ...branches, fallback] : fallback;
}
