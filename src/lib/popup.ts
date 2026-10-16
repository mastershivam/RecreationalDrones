import type { GuideSummary } from './guides';

const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escapeHtml(text: string): string {
	return text.replace(/[&<>"']/g, (ch) => ESCAPES[ch]);
}

const UNVERIFIED = '<span class="unverified">Not yet verified</span>';

function row(label: string, value: string | number | null): string {
	return `<dt>${label}</dt><dd>${value === null ? UNVERIFIED : escapeHtml(String(value))}</dd>`;
}

// HTML for the read-only preview shown when hovering a country. Clicking opens the full guide in a modal.
export function popupHtml(g: GuideSummary): string {
	const facts = [
		row('Who must register', g.whoMustRegister),
		row('Minimum age', g.minOperatorAge),
		row('Remote ID', g.remoteId),
		row('Insurance', g.insurance),
	].join('');
	return `<h2 class="popup-title">${escapeHtml(g.name)}</h2><dl>${facts}</dl><p class="popup-meta">Checked ${escapeHtml(g.lastVerified)} · click for the full guide</p>`;
}
