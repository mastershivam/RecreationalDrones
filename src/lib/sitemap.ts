export interface SitemapEntry {
	// A path starting with "/", such as "/countries/japan/".
	path: string;
	// The last day the page's facts were checked, if known.
	lastmod?: Date;
}

const escapeXml = (text: string) => text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]!);

export function sitemapXml(site: string, entries: SitemapEntry[]): string {
	const base = site.replace(/\/$/, '');
	const urls = entries
		.map(({ path, lastmod }) => `  <url><loc>${escapeXml(base + path)}</loc>${lastmod ? `<lastmod>${lastmod.toISOString().slice(0, 10)}</lastmod>` : ''}</url>`)
		.join('\n');
	return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

// What a crawler may fetch. The map tiles are one 15 MB file that is no use to a search engine, so they are off limits.
export function robotsTxt(site: string): string {
	return `User-agent: *\nAllow: /\nDisallow: /tiles/\n\nSitemap: ${site.replace(/\/$/, '')}/sitemap.xml\n`;
}
