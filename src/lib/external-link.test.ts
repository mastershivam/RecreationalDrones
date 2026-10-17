import { describe, expect, it } from 'vitest';
import { externalLinks, isExternal, linkAttrs, linkAttrsHtml } from './external-link';

describe('isExternal', () => {
	it('is true for http and https addresses', () => {
		expect(isExternal('https://www.caa.co.uk/')).toBe(true);
		expect(isExternal('http://example.com')).toBe(true);
	});

	it('is false for paths on this site, anchors and mail links', () => {
		expect(isExternal('/countries/nepal/')).toBe(false);
		expect(isExternal('#main')).toBe(false);
		expect(isExternal('mailto:uav@caat.or.th')).toBe(false);
	});
});

describe('linkAttrs and linkAttrsHtml', () => {
	it('open an external link in a new tab without giving it the old page', () => {
		expect(linkAttrs('https://www.faa.gov/')).toEqual({ target: '_blank', rel: 'noopener noreferrer' });
		expect(linkAttrsHtml('https://www.faa.gov/')).toBe(' target="_blank" rel="noopener noreferrer"');
	});

	it('leave an internal link or a mail link alone', () => {
		expect(linkAttrs('/contact/')).toEqual({});
		expect(linkAttrsHtml('mailto:uav@caat.or.th')).toBe('');
	});
});

describe('externalLinks plugin', () => {
	const visit = (href: string) => {
		const node = { properties: { href } };
		const set: Record<string, unknown> = {};
		externalLinks.element.visit(node, { setProperty: (_n, key, value) => (set[key] = value) });
		return set;
	};

	it('sets the new-tab attributes on a link to another site only', () => {
		expect(visit('https://www.caa.co.uk/')).toEqual({ target: '_blank', rel: 'noopener noreferrer' });
		expect(visit('/countries/')).toEqual({});
	});
});
