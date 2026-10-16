import { describe, expect, it } from 'vitest';
import type { GuideSummary } from './guides';
import { escapeHtml, popupHtml, safeUrl } from './popup';

const guide: GuideSummary = {
	name: 'United Kingdom',
	url: '/countries/united-kingdom/',
	authority: 'Civil Aviation Authority (CAA)',
	authorityUrl: 'https://www.caa.co.uk/drones/',
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

describe('safeUrl', () => {
	it.each(['https://www.caa.co.uk/drones/', 'http://example.org', '/countries/united-kingdom/'])('allows %s', (url) => {
		expect(safeUrl(url)).toBe(url);
	});

	it.each(['javascript:alert(1)', 'data:text/html,hi', 'ftp://example.org', 'example.org'])('blocks %s', (url) => {
		expect(safeUrl(url)).toBe('#');
	});

	it('escapes quotes so a URL cannot break out of the attribute', () => {
		expect(safeUrl('https://example.org/"onmouseover="x')).not.toContain('"');
	});
});

describe('popupHtml', () => {
	it('shows the country name and its key facts', () => {
		const html = popupHtml(guide, false);
		expect(html).toContain('United Kingdom');
		expect(html).toContain('Drones from 250 g need a Flyer ID and an Operator ID.');
		expect(html).toContain('<dd>18</dd>');
	});

	it('marks unchecked facts as not yet verified instead of leaving them blank', () => {
		const html = popupHtml(guide, false);
		expect(html).toContain('<dt>Remote ID</dt><dd><span class="unverified">Not yet verified</span></dd>');
		expect(html).toContain('<dt>Insurance</dt><dd><span class="unverified">Not yet verified</span></dd>');
	});

	it('shows nothing as verified when every fact is null', () => {
		const html = popupHtml({ ...guide, whoMustRegister: null, minOperatorAge: null }, false);
		expect(html.match(/Not yet verified/g)).toHaveLength(4);
	});

	it('shows the date the facts were checked', () => {
		expect(popupHtml(guide, false)).toContain('2026-10-13');
	});

	it('has no links in a hover preview, since it cannot be clicked', () => {
		expect(popupHtml(guide, false)).not.toContain('<a ');
	});

	it('adds the official source and the full guide link when pinned', () => {
		const html = popupHtml(guide, true);
		expect(html).toContain('href="https://www.caa.co.uk/drones/"');
		expect(html).toContain('Civil Aviation Authority (CAA)');
		expect(html).toContain('href="/countries/united-kingdom/"');
	});

	it('escapes guide text, so a bad guide cannot inject HTML', () => {
		const html = popupHtml({ ...guide, name: '<script>x</script>', whoMustRegister: '<b onclick=1>', authorityUrl: 'javascript:x' }, true);
		expect(html).not.toContain('<script>');
		expect(html).not.toContain('<b onclick');
		expect(html).not.toContain('javascript:');
	});
});
