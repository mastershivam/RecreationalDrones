import type { GuideSummary } from './guides';

const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escapeHtml(text: string): string {
	return text.replace(/[&<>"']/g, (ch) => ESCAPES[ch]);
}

// Only web links are allowed in the popup; anything else becomes a dead link.
export function safeUrl(url: string): string {
	return /^https?:\/\//i.test(url) || url.startsWith('/') ? escapeHtml(url) : '#';
}

const UNVERIFIED = '<span class="unverified">Not yet verified</span>';

function row(label: string, value: string | number | null): string {
	return `<dt>${label}</dt><dd>${value === null ? UNVERIFIED : escapeHtml(String(value))}</dd>`;
}

// HTML for a country popup. A hover preview is read-only; a pinned popup (click or tap) also has links.
export function popupHtml(g: GuideSummary, pinned: boolean): string {
	const facts = [
		row('Who must register', g.whoMustRegister),
		row('Minimum age', g.minOperatorAge),
		row('Remote ID', g.remoteId),
		row('Insurance', g.insurance),
	].join('');
	const footer = pinned
		? `<p class="popup-meta">Checked ${escapeHtml(g.lastVerified)} · <a href="${safeUrl(g.authorityUrl)}" rel="noopener">${escapeHtml(g.authority)}</a></p>` +
			`<a class="popup-link" href="${safeUrl(g.url)}">Full guide</a>`
		: `<p class="popup-meta">Checked ${escapeHtml(g.lastVerified)} · click for links</p>`;
	return `<h2 class="popup-title">${escapeHtml(g.name)}</h2><dl>${facts}</dl>${footer}`;
}
