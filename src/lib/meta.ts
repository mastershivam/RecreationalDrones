import { levelText, type Level } from './restrictiveness';

interface GuideMeta {
	name: string;
	restrictiveness: Level;
	registrationFee: string | null;
	lastVerified: Date;
}

const MAX = 158;

// The page description a search engine or a chat app shows under a guide's title. Unique to the country, and cut at a
// word so it fits in a search result.
export function guideDescription(d: GuideMeta): string {
	const fee = d.registrationFee ? ` Registration: ${d.registrationFee}.` : '';
	const text = `Drone rules in ${d.name}: ${levelText(d.restrictiveness).toLowerCase()}.${fee} How to register, with the official sources, checked ${d.lastVerified.toISOString().slice(0, 10)}.`;
	if (text.length <= MAX) return text;
	const cut = text.slice(0, MAX - 1);
	return `${cut.slice(0, cut.lastIndexOf(' '))}…`;
}
