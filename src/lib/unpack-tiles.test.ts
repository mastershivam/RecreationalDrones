import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { tileCoordinates, unpackTiles } from './unpack-tiles';

const archive = join(import.meta.dirname, '../../data/basemap.pmtiles');

describe('build script', () => {
	it('loads under plain Node, which only strips types and rejects some TypeScript syntax that Vitest accepts', () => {
		const file = join(import.meta.dirname, 'unpack-tiles.ts');
		const out = execFileSync(process.execPath, ['-e', `import(${JSON.stringify(file)}).then((m) => console.log(typeof m.unpackTiles))`], {
			encoding: 'utf8',
		});
		expect(out.trim()).toBe('function');
	});
});

describe('tileCoordinates', () => {
	it('covers every tile from zoom 0 to maxZoom', () => {
		// 1 + 4 + 16 + ... = (4^(n+1) - 1) / 3
		expect([...tileCoordinates(0)]).toEqual([[0, 0, 0]]);
		expect([...tileCoordinates(2)]).toHaveLength(21);
		expect([...tileCoordinates(5)]).toHaveLength(1365);
	});

	it('keeps x and y inside the grid for each zoom', () => {
		for (const [z, x, y] of tileCoordinates(4)) {
			expect(x).toBeLessThan(2 ** z);
			expect(y).toBeLessThan(2 ** z);
		}
	});
});

describe('unpackTiles', () => {
	const out = mkdtempSync(join(tmpdir(), 'tiles-'));
	afterAll(() => rmSync(out, { recursive: true, force: true }));

	it('has a source archive to unpack', () => {
		expect(readFileSync(archive).subarray(0, 7).toString()).toBe('PMTiles');
	});

	it('writes one file per tile in the archive', async () => {
		const written = await unpackTiles(archive, out, 3);
		const files = readdirSync(out, { recursive: true, withFileTypes: true }).filter((f) => f.isFile());
		expect(written).toBeGreaterThan(0);
		expect(files).toHaveLength(written);
		expect(files.every((f) => f.name.endsWith('.mvt'))).toBe(true);
	});

	it('lays tiles out as {z}/{x}/{y}.mvt, starting with the world tile', () => {
		expect(existsSync(join(out, '0/0/0.mvt'))).toBe(true);
		expect(statSync(join(out, '0/0/0.mvt')).size).toBeGreaterThan(0);
	});

	it('stores tiles uncompressed, so the browser can read them without a Content-Encoding header', () => {
		const bytes = readFileSync(join(out, '0/0/0.mvt'));
		const looksGzipped = bytes[0] === 0x1f && bytes[1] === 0x8b;
		expect(looksGzipped).toBe(false);
	});

	it('does not write zoom levels above maxZoom', () => {
		expect(existsSync(join(out, '4'))).toBe(false);
		expect(existsSync(join(out, '3'))).toBe(true);
	});

	it('clears out stale tiles from an earlier run', async () => {
		await unpackTiles(archive, out, 1);
		expect(existsSync(join(out, '3'))).toBe(false);
	});
});
