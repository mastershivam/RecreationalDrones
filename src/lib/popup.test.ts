import { describe, expect, it } from 'vitest';
import type { GuideSummary } from './guides';
import { escapeHtml, popupHtml } from './popup';

const guide: GuideSummary = {
	name: 'United Kingdom',
	whoMustRegister: 'Drones from 250 g need a Flyer ID and an Operator ID.',
	minOperatorAge: 18,
	remoteId: null,
	insurance: null,
	lastVerified: '2026-10-13',
};

describe('escapeHtml', () => {
	it('escapes the characters that can break out of HTML', () => {
		expect(escapeHtml(`<img src=x onerror="a('b')">&`)).toBe('&lt;img src=x onerror=&quot;a(&#39;b&#39;)&quot;&gt;&amp;');
	});

	it('leaves ordinary text alone', () => {
		expect(escapeHtml('Drones from 250 g')).toBe('Drones from 250 g');
	});
});

describe('popupHtml', () => {
	it('shows the country name and its key facts', () => {
		const html = popupHtml(guide);
		expect(html).toContain('United Kingdom');
		expect(html).toContain('Drones from 250 g need a Flyer ID and an Operator ID.');
		expect(html).toContain('<dd>18</dd>');
	});

	it('marks unchecked facts as not yet verified instead of leaving them blank', () => {
		const html = popupHtml(guide);
		expect(html).toContain('<dt>Remote ID</dt><dd><span class="unverified">Not yet verified</span></dd>');
		expect(html).toContain('<dt>Insurance</dt><dd><span class="unverified">Not yet verified</span></dd>');
	});

	it('shows nothing as verified when every fact is null', () => {
		const html = popupHtml({ ...guide, whoMustRegister: null, minOperatorAge: null });
		expect(html.match(/Not yet verified/g)).toHaveLength(4);
	});

	it('shows the date the facts were checked and says that clicking opens the full guide', () => {
		const html = popupHtml(guide);
		expect(html).toContain('2026-10-13');
		expect(html).toContain('click for the full guide');
	});

	it('has no links, since a hover preview cannot be clicked into', () => {
		expect(popupHtml(guide)).not.toContain('<a ');
	});

	it('escapes guide text, so a bad guide cannot inject HTML', () => {
		const html = popupHtml({ ...guide, name: '<script>x</script>', whoMustRegister: '<b onclick=1>' });
		expect(html).not.toContain('<script>');
		expect(html).not.toContain('<b onclick');
	});
});
