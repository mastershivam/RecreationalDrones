import { describe, expect, it } from 'vitest';
import { TILE_KEY, TILE_PATH, handleTileRequest, parseRange, resolveRange, type TileBucket } from './tile-server';

// A bucket holding one file, behaving like R2: ranges past the end throw, ranges that run over are cut short.
function fakeBucket(data: Uint8Array, key = TILE_KEY): TileBucket & { reads: number } {
	const bucket = {
		reads: 0,
		async get(k: string, options?: { range?: { offset: number; length?: number } | { suffix: number } }) {
			if (k !== key) return null;
			bucket.reads++;
			let start = 0;
			let end = data.length;
			const range = options?.range;
			if (range && 'suffix' in range) start = Math.max(data.length - range.suffix, 0);
			else if (range) {
				if (range.offset >= data.length) throw new Error('10039: the requested range is not satisfiable');
				start = range.offset;
				end = range.length === undefined ? data.length : Math.min(range.offset + range.length, data.length);
			}
			return { size: data.length, httpEtag: '"v1"', body: data.slice(start, end) };
		},
		async head(k: string) {
			return k === key ? { size: data.length, httpEtag: '"v1"' } : null;
		},
	};
	return bucket;
}

const file = Uint8Array.from({ length: 1000 }, (_, i) => i % 256);
const request = (headers: Record<string, string> = {}, method = 'GET', path = TILE_PATH) =>
	new Request(`https://example.org${path}`, { method, headers });
const bytes = async (r: Response) => new Uint8Array(await r.arrayBuffer());

describe('parseRange', () => {
	it.each([
		['bytes=0-99', { start: 0, end: 99 }],
		['bytes=500-', { start: 500 }],
		['bytes=-200', { suffix: 200 }],
		['bytes=7-7', { start: 7, end: 7 }],
	])('reads %s', (header, expected) => {
		expect(parseRange(header)).toEqual(expected);
	});

	it.each([null, '', 'bytes=', 'bytes=-', 'bytes=9-3', 'bytes=0-1,5-6', 'items=0-5', 'bytes=a-b'])(
		'ignores %s, which means the whole file is sent',
		(header) => {
			expect(parseRange(header)).toBeNull();
		},
	);
});

describe('resolveRange', () => {
	it('keeps a range that fits', () => expect(resolveRange({ start: 10, end: 19 }, 100)).toEqual({ start: 10, end: 19 }));
	it('cuts a range that runs past the end', () => expect(resolveRange({ start: 90, end: 500 }, 100)).toEqual({ start: 90, end: 99 }));
	it('runs an open range to the end', () => expect(resolveRange({ start: 40 }, 100)).toEqual({ start: 40, end: 99 }));
	it('counts a suffix back from the end', () => expect(resolveRange({ suffix: 30 }, 100)).toEqual({ start: 70, end: 99 }));
	it('allows a suffix longer than the file', () => expect(resolveRange({ suffix: 500 }, 100)).toEqual({ start: 0, end: 99 }));
	it('rejects a start past the end', () => expect(resolveRange({ start: 100 }, 100)).toBeNull());
	it('rejects an empty suffix', () => expect(resolveRange({ suffix: 0 }, 100)).toBeNull());
});

describe('handleTileRequest', () => {
	it('answers a byte range with 206 and exactly those bytes', async () => {
		// Regression: Workers static assets ignored Range and sent the whole file, which blanked the globe.
		const response = await handleTileRequest(request({ Range: 'bytes=10-19' }), fakeBucket(file));
		expect(response.status).toBe(206);
		expect(response.headers.get('Content-Range')).toBe('bytes 10-19/1000');
		expect(response.headers.get('Content-Length')).toBe('10');
		expect(await bytes(response)).toEqual(file.slice(10, 20));
	});

	it('reports the true range when the request runs past the end', async () => {
		const response = await handleTileRequest(request({ Range: 'bytes=990-5000' }), fakeBucket(file));
		expect(response.status).toBe(206);
		expect(response.headers.get('Content-Range')).toBe('bytes 990-999/1000');
		expect(await bytes(response)).toEqual(file.slice(990));
	});

	it('supports open and suffix ranges', async () => {
		const open = await handleTileRequest(request({ Range: 'bytes=995-' }), fakeBucket(file));
		expect(open.headers.get('Content-Range')).toBe('bytes 995-999/1000');
		const suffix = await handleTileRequest(request({ Range: 'bytes=-5' }), fakeBucket(file));
		expect(suffix.headers.get('Content-Range')).toBe('bytes 995-999/1000');
		expect(await bytes(suffix)).toEqual(file.slice(995));
	});

	it('sends the whole file with 200 when there is no usable Range header', async () => {
		for (const headers of [{}, { Range: 'bytes=0-1,5-6' }] as Record<string, string>[]) {
			const response = await handleTileRequest(request(headers), fakeBucket(file));
			expect(response.status).toBe(200);
			expect(response.headers.get('Content-Length')).toBe('1000');
			expect(await bytes(response)).toEqual(file);
		}
	});

	it('says it accepts ranges, so clients know they can ask', async () => {
		const response = await handleTileRequest(request({ Range: 'bytes=0-9' }), fakeBucket(file));
		expect(response.headers.get('Accept-Ranges')).toBe('bytes');
		expect(response.headers.get('ETag')).toBe('"v1"');
		expect(response.headers.get('Cache-Control')).toContain('no-cache');
	});

	it('answers 416 with the file size when the range starts past the end', async () => {
		const response = await handleTileRequest(request({ Range: 'bytes=5000-6000' }), fakeBucket(file));
		expect(response.status).toBe(416);
		expect(response.headers.get('Content-Range')).toBe('bytes */1000');
	});

	it('answers HEAD with the size and no body', async () => {
		const bucket = fakeBucket(file);
		const response = await handleTileRequest(request({}, 'HEAD'), bucket);
		expect(response.status).toBe(200);
		expect(response.headers.get('Content-Length')).toBe('1000');
		expect(await response.text()).toBe('');
		expect(bucket.reads).toBe(0);
	});

	it('reads the bucket once per range, not twice', async () => {
		const bucket = fakeBucket(file);
		await handleTileRequest(request({ Range: 'bytes=0-9' }), bucket);
		expect(bucket.reads).toBe(1);
	});

	it('answers 404 when the file is not in the bucket yet', async () => {
		const empty = fakeBucket(file, 'something-else');
		expect((await handleTileRequest(request({ Range: 'bytes=0-9' }), empty)).status).toBe(404);
		expect((await handleTileRequest(request(), empty)).status).toBe(404);
		expect((await handleTileRequest(request({}, 'HEAD'), empty)).status).toBe(404);
	});

	it('serves nothing else under /tiles/', async () => {
		expect((await handleTileRequest(request({}, 'GET', '/tiles/0/0/0.mvt'), fakeBucket(file))).status).toBe(404);
		expect((await handleTileRequest(request({}, 'GET', '/tiles/'), fakeBucket(file))).status).toBe(404);
	});

	it.each(['POST', 'PUT', 'DELETE'])('refuses %s', async (method) => {
		const response = await handleTileRequest(request({}, method), fakeBucket(file));
		expect(response.status).toBe(405);
		expect(response.headers.get('Allow')).toBe('GET, HEAD');
	});
});
