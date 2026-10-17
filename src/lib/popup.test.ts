import { describe, expect, it } from 'vitest';
import type { GuideSummary } from './guides';
import { escapeHtml, popupHtml, summaryHtml } from './popup';

const guide: GuideSummary = {
	name: 'United Kingdom',
	whoMustRegister: 'Drones from 250 g need a Flyer ID and an Operator ID.',
	slug: 'united-kingdom',
	level: 2,
	reason: 'Register online with the CAA; no in-person step.',
	registrationFee: null,
	registrationUrl: 'https://www.caa.co.uk/drones/register/',
	weightGrams: 250,
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
	it('shows only the country name, who must register and the fee', () => {
		const html = popupHtml({ ...guide, registrationFee: '£12.34 a year' });
		expect(html).toContain('United Kingdom');
		expect(html).toContain('Drones from 250 g need a Flyer ID and an Operator ID.');
		expect(html).toContain('<dt>Registration fee</dt><dd>£12.34 a year</dd>');
		expect(html).not.toContain('Remote ID');
		expect(html).not.toContain('Insurance');
	});

	it('names the level in words, so color is never the only cue', () => {
		expect(popupHtml(guide)).toContain('<dt>Rules</dt><dd>Basic restrictions</dd>');
		expect(summaryHtml({ ...guide, level: 3 })).toContain('Complex restrictions');
	});

	it('marks unchecked facts as not yet verified instead of leaving them blank', () => {
		expect(popupHtml(guide)).toContain('<dt>Registration fee</dt><dd><span class="unverified">Not yet verified</span></dd>');
		expect(popupHtml({ ...guide, whoMustRegister: null }).match(/Not yet verified/g)).toHaveLength(2);
	});

	it('shows the date the facts were checked and says that clicking opens the summary', () => {
		const html = popupHtml(guide);
		expect(html).toContain('2026-10-13');
		expect(html).toContain('click for the summary');
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

describe('summaryHtml', () => {
	it('gives the facts that matter, a registration link and a link to the full guide', () => {
		const html = summaryHtml({ ...guide, registrationFee: '£12.34 a year' });
		expect(html).toContain('<h1>Drone rules in United Kingdom</h1>');
		expect(html).toContain('Drones from 250 g need');
		expect(html).toContain('£12.34 a year');
		expect(html).toContain('<a class="button" href="https://www.caa.co.uk/drones/register/" target="_blank" rel="noopener noreferrer">Register online</a>');
		expect(html).toContain('href="/countries/united-kingdom/"');
	});

	it('opens with the level as a badge, then the verdict in one sentence', () => {
		const html = summaryHtml(guide);
		expect(html).toContain('<p class="level-badge level-2"><span class="level-number" aria-hidden="true">2</span>Basic restrictions</p>');
		expect(html.indexOf('level-badge')).toBeLessThan(html.indexOf('<h1>'));
		expect(html).toContain('<p class="verdict">Register online with the CAA; no in-person step.</p>');
	});

	it('has a weight check that carries the guide\u2019s threshold, and a save button', () => {
		const html = summaryHtml(guide);
		expect(html).toContain('data-threshold="250"');
		expect(html).toContain('class="save" aria-pressed="false"');
		expect(summaryHtml({ ...guide, weightGrams: null })).toContain('data-threshold=""');
	});

	it('escapes the verdict', () => {
		expect(summaryHtml({ ...guide, reason: '<i onclick=1>' })).not.toContain('<i onclick');
	});

	it('is short: it leaves out Remote ID, insurance and minimum age', () => {
		const html = summaryHtml(guide);
		expect(html.length).toBeLessThan(2000);
		expect(html).not.toContain('<dt>Remote ID');
		expect(html).not.toContain('<dt>Insurance');
	});

	it('marks a missing registration page as not yet verified', () => {
		expect(summaryHtml({ ...guide, registrationUrl: null })).toContain('<dt>Where to register</dt><dd><span class="unverified">');
	});

	it('escapes the slug and the registration link', () => {
		const html = summaryHtml({ ...guide, slug: 'a"b', registrationUrl: 'https://x.org/?a="1"' });
		expect(html).not.toContain('a"b');
		expect(html).not.toContain('"1"');
	});
});
