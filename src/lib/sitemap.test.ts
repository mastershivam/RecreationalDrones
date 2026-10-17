import { describe, expect, it } from 'vitest';
import { robotsTxt, sitemapXml } from './sitemap';

describe('sitemapXml', () => {
	it('lists each page with its full address, and the day it was last checked if known', () => {
		const xml = sitemapXml('https://example.org/', [{ path: '/' }, { path: '/countries/japan/', lastmod: new Date('2026-10-17T09:00:00Z') }]);
		expect(xml).toContain('<loc>https://example.org/</loc>');
		expect(xml).toContain('<loc>https://example.org/countries/japan/</loc><lastmod>2026-10-17</lastmod>');
		expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
		expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
	});

	it('never doubles the slash between the site and a path', () => {
		expect(sitemapXml('https://example.org/', [{ path: '/a/' }])).toContain('https://example.org/a/');
		expect(sitemapXml('https://example.org', [{ path: '/a/' }])).toContain('https://example.org/a/');
	});

	it('escapes characters that would break the XML', () => {
		const xml = sitemapXml('https://example.org', [{ path: '/a?b=1&c=<2>' }]);
		expect(xml).toContain('&amp;');
		expect(xml).not.toContain('<2>');
	});
});

describe('robotsTxt', () => {
	it('allows the site, keeps crawlers off the map tiles, and points to the sitemap', () => {
		const txt = robotsTxt('https://example.org/');
		expect(txt).toContain('User-agent: *');
		expect(txt).toContain('Allow: /');
		expect(txt).toContain('Disallow: /tiles/');
		expect(txt).toContain('Sitemap: https://example.org/sitemap.xml');
	});
});
