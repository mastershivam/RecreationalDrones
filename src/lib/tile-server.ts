// Serves the basemap .pmtiles file out of a private R2 bucket, with the HTTP byte-range support that PMTiles
// needs. Cloudflare's static assets ignore Range headers, which is why this runs in the Worker instead.

export const TILE_PATH = '/tiles/basemap.pmtiles';
export const TILE_KEY = 'basemap.pmtiles';

// The parts of an R2 bucket and object that this file uses, so tests can use a small fake.
export interface TileObject {
	size: number;
	httpEtag: string;
	body: BodyInit | null;
}
export interface TileBucket {
	get(key: string, options?: { range?: { offset: number; length?: number } | { suffix: number } }): Promise<TileObject | null>;
	head(key: string): Promise<Omit<TileObject, 'body'> | null>;
}

type RequestedRange = { start: number; end?: number } | { suffix: number };

// Reads a "Range: bytes=..." header. Returns null for a missing header and for forms that are not supported
// (several ranges, or garbage), which makes the caller send the whole file, as the HTTP standard allows.
export function parseRange(header: string | null): RequestedRange | null {
	const match = /^bytes=(\d*)-(\d*)$/.exec(header?.trim() ?? '');
	if (!match) return null;
	const [, first, last] = match;
	if (first === '' && last === '') return null;
	if (first === '') return { suffix: Number(last) };
	const start = Number(first);
	if (last === '') return { start };
	const end = Number(last);
	return end < start ? null : { start, end };
}

// The first and last byte (both included) that a range covers in a file of `size` bytes, or null if it covers none.
export function resolveRange(range: RequestedRange, size: number): { start: number; end: number } | null {
	if ('suffix' in range) {
		return range.suffix === 0 || size === 0 ? null : { start: Math.max(size - range.suffix, 0), end: size - 1 };
	}
	if (range.start >= size) return null;
	return { start: range.start, end: Math.min(range.end ?? size - 1, size - 1) };
}

function baseHeaders(etag: string): Headers {
	return new Headers({
		'Accept-Ranges': 'bytes',
		'Content-Type': 'application/octet-stream',
		'Cache-Control': 'public, max-age=86400',
		ETag: etag,
	});
}

export async function handleTileRequest(request: Request, bucket: TileBucket): Promise<Response> {
	const { pathname } = new URL(request.url);
	if (pathname !== TILE_PATH) return new Response('Not found', { status: 404 });
	if (request.method !== 'GET' && request.method !== 'HEAD') {
		return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
	}

	if (request.method === 'HEAD') {
		const head = await bucket.head(TILE_KEY);
		if (!head) return new Response(null, { status: 404 });
		const headers = baseHeaders(head.httpEtag);
		headers.set('Content-Length', String(head.size));
		return new Response(null, { status: 200, headers });
	}

	const range = parseRange(request.headers.get('Range'));
	if (!range) {
		const whole = await bucket.get(TILE_KEY);
		if (!whole) return new Response('Not found', { status: 404 });
		const headers = baseHeaders(whole.httpEtag);
		headers.set('Content-Length', String(whole.size));
		return new Response(whole.body, { status: 200, headers });
	}

	let part: TileObject | null;
	try {
		part = await bucket.get(TILE_KEY, { range: 'suffix' in range ? range : { offset: range.start, length: range.end === undefined ? undefined : range.end - range.start + 1 } });
	} catch {
		// R2 refuses a range that starts past the end of the file.
		const head = await bucket.head(TILE_KEY);
		return new Response('Range not satisfiable', { status: 416, headers: head ? { 'Content-Range': `bytes */${head.size}` } : {} });
	}
	if (!part) return new Response('Not found', { status: 404 });

	const covered = resolveRange(range, part.size);
	if (!covered) return new Response('Range not satisfiable', { status: 416, headers: { 'Content-Range': `bytes */${part.size}` } });
	const headers = baseHeaders(part.httpEtag);
	headers.set('Content-Range', `bytes ${covered.start}-${covered.end}/${part.size}`);
	headers.set('Content-Length', String(covered.end - covered.start + 1));
	return new Response(part.body, { status: 206, headers });
}
