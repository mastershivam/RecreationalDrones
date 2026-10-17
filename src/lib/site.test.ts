import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ANALYTICS_HOSTS, ANALYTICS_TOKEN, ISSUES_URL, REPO_URL, SITE_URL } from './site';

const read = (path: string) => readFileSync(join(import.meta.dirname, '../..', path), 'utf8');

describe('site settings', () => {
	it('has a site address with no trailing slash, since paths are added to it', () => {
		expect(SITE_URL).toMatch(/^https:\/\/[^/]+$/);
	});

	it('points the issue tracker at the project’s repository', () => {
		expect(ISSUES_URL).toBe(`${REPO_URL}/issues`);
	});

	it('has a Cloudflare Web Analytics token of the right shape, or analytics is off', () => {
		if (ANALYTICS_TOKEN !== null) expect(ANALYTICS_TOKEN).toMatch(/^[0-9a-f]{32}$/);
	});

	it('allows contact with Cloudflare analytics addresses only while analytics is on', () => {
		if (ANALYTICS_TOKEN === null) expect(ANALYTICS_HOSTS).toEqual([]);
		else expect(ANALYTICS_HOSTS).toEqual(['static.cloudflareinsights.com', 'cloudflareinsights.com']);
	});

	// Privacy: the privacy page says there is no analytics. If a token is set, that has to change in the same commit.
	it('only turns analytics on if the privacy page says so', () => {
		const privacy = read('src/pages/privacy.astro');
		if (ANALYTICS_TOKEN === null) expect(privacy).toContain('no\n\t\t\tanalytics');
		else expect(privacy).toContain('Cloudflare Web Analytics');
	});
});

describe('_headers', () => {
	const headers = read('public/_headers');

	it('caches built files for a year, because their names change when their content does', () => {
		expect(headers).toMatch(/\/_astro\/\*\n\s+Cache-Control: public, max-age=31536000, immutable/);
	});

	it('does not cache data files for long, since they change when the site is rebuilt', () => {
		expect(headers).toMatch(/\/data\/\*\n\s+Cache-Control: public, max-age=3600/);
	});

	it('allows geolocation for this site only, and no other powerful feature', () => {
		expect(headers).toContain('Permissions-Policy: geolocation=(self), camera=(), microphone=()');
		expect(headers).toContain('X-Content-Type-Options: nosniff');
	});
});
