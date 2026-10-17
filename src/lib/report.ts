import { ISSUES_URL } from './site';

// A link that opens a new GitHub issue with the country and page already filled in, so reporting a mistake takes
// one tap. Nothing is sent until the person submits it on GitHub.
export function reportErrorUrl(name: string, slug: string): string {
	const params = new URLSearchParams({
		title: `Mistake in the ${name} guide`,
		body: `Guide: /countries/${slug}/\n\nWhat is wrong, and what the official source says (please link it):\n`,
	});
	return `${ISSUES_URL}/new?${params}`;
}
