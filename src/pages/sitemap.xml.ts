import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { sitemapXml } from '../lib/sitemap';
import { SITE_URL } from '../lib/site';

// Every page a search engine should know about. A guide's last-modified day is the day its facts were last checked.
export const GET: APIRoute = async () => {
	const countries = await getCollection('countries');
	const entries = [
		{ path: '/' },
		{ path: '/countries/' },
		{ path: '/trip/' },
		...countries.map((c) => ({ path: `/countries/${c.id}/`, lastmod: c.data.lastVerified })).sort((a, b) => a.path.localeCompare(b.path)),
		{ path: '/privacy/' },
		{ path: '/contact/' },
	];
	return new Response(sitemapXml(SITE_URL, entries), { headers: { 'content-type': 'application/xml; charset=utf-8' } });
};
