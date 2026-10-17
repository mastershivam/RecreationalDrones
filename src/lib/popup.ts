import type { GuideSummary } from './guides';

const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escapeHtml(text: string): string {
	return text.replace(/[&<>"']/g, (ch) => ESCAPES[ch]);
}

const UNVERIFIED = '<span class="unverified">Not yet verified</span>';

function row(label: string, value: string | null): string {
	return `<dt>${label}</dt><dd>${value === null ? UNVERIFIED : escapeHtml(value)}</dd>`;
}

// HTML for the read-only preview shown when hovering a country. Clicking opens the summary in a modal.
export function popupHtml(g: GuideSummary): string {
	const facts = [row('Who must register', g.whoMustRegister), row('Registration fee', g.registrationFee)].join('');
	return `<h2 class="popup-title">${escapeHtml(g.name)}</h2><dl>${facts}</dl><p class="popup-meta">Checked ${escapeHtml(g.lastVerified)} · click for the summary</p>`;
}

// HTML for the modal: the few facts that matter, where to register, and a link to the page with the rest.
export function summaryHtml(g: GuideSummary): string {
	const where = g.registrationUrl === null ? UNVERIFIED : `<a href="${escapeHtml(g.registrationUrl)}">Register online</a>`;
	return (
		`<h1>Drone rules in ${escapeHtml(g.name)}</h1>` +
		`<p class="muted">Last verified ${escapeHtml(g.lastVerified)}</p>` +
		`<dl class="card">${row('Who must register', g.whoMustRegister)}${row('Registration fee', g.registrationFee)}<dt>Where to register</dt><dd>${where}</dd></dl>` +
		`<p><a class="guide-link" href="/countries/${encodeURIComponent(g.slug)}/">Read the full guide</a> for pilot tests, Remote ID, insurance and where you can fly.</p>`
	);
}
