import type { APIRoute } from 'astro';
import { robotsTxt } from '../lib/sitemap';
import { SITE_URL } from '../lib/site';

export const GET: APIRoute = () => new Response(robotsTxt(SITE_URL), { headers: { 'content-type': 'text/plain; charset=utf-8' } });
