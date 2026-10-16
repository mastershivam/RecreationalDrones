import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { serveDevTiles } from './dev-tiles';

const data = Uint8Array.from({ length: 500 }, (_, i) => i % 251);
const dir = mkdtempSync(join(tmpdir(), 'dev-tiles-'));
let server: Server;
let base: string;

beforeAll(async () => {
	writeFileSync(join(dir, 'basemap.pmtiles'), data);
	const middleware = serveDevTiles(join(dir, 'basemap.pmtiles'));
	server = createServer((req, res) => middleware(req, res, () => res.writeHead(404).end('next')));
	await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
	base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(() => {
	server.close();
	rmSync(dir, { recursive: true, force: true });
});

describe('serveDevTiles', () => {
	it('serves a byte range with 206 and exactly those bytes', async () => {
		const response = await fetch(`${base}/tiles/basemap.pmtiles`, { headers: { Range: 'bytes=10-19' } });
		expect(response.status).toBe(206);
		expect(response.headers.get('content-range')).toBe('bytes 10-19/500');
		expect(new Uint8Array(await response.arrayBuffer())).toEqual(data.slice(10, 20));
	});

	it('serves the end of the file for a suffix range', async () => {
		const response = await fetch(`${base}/tiles/basemap.pmtiles`, { headers: { Range: 'bytes=-5' } });
		expect(response.headers.get('content-range')).toBe('bytes 495-499/500');
		expect(new Uint8Array(await response.arrayBuffer())).toEqual(data.slice(495));
	});

	it('serves the whole file when no range is asked for', async () => {
		const response = await fetch(`${base}/tiles/basemap.pmtiles`);
		expect(response.status).toBe(200);
		expect(response.headers.get('accept-ranges')).toBe('bytes');
		expect(new Uint8Array(await response.arrayBuffer())).toEqual(data);
	});

	it('answers 416 for a range past the end', async () => {
		const response = await fetch(`${base}/tiles/basemap.pmtiles`, { headers: { Range: 'bytes=900-950' } });
		expect(response.status).toBe(416);
		expect(response.headers.get('content-range')).toBe('bytes */500');
	});

	it('ignores a query string on the address', async () => {
		expect((await fetch(`${base}/tiles/basemap.pmtiles?v=2`, { headers: { Range: 'bytes=0-1' } })).status).toBe(206);
	});

	it('leaves every other address to the next handler', async () => {
		const response = await fetch(`${base}/countries/`);
		expect(await response.text()).toBe('next');
	});
});
