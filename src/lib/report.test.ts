import { describe, expect, it } from 'vitest';
import { reportErrorUrl } from './report';
import { ISSUES_URL } from './site';

describe('reportErrorUrl', () => {
	it('opens a new GitHub issue with the country in the title and the page in the body', () => {
		const url = new URL(reportErrorUrl('Japan', 'japan'));
		expect(url.origin + url.pathname).toBe(`${ISSUES_URL}/new`);
		expect(url.searchParams.get('title')).toBe('Mistake in the Japan guide');
		expect(url.searchParams.get('body')).toContain('/countries/japan/');
	});

	it('encodes names with spaces and symbols', () => {
		const url = new URL(reportErrorUrl('United States & Co', 'united-states'));
		expect(url.searchParams.get('title')).toBe('Mistake in the United States & Co guide');
	});
});
