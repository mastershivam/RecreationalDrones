import { closeSync, mkdirSync, openSync, readSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { PMTiles, type RangeResponse, type Source } from 'pmtiles';

// Build-time only. Cloudflare Workers static assets ignore HTTP range requests, which a .pmtiles file
// needs, so the PMTiles archive is unpacked into plain per-tile files that any static host can serve.

class FileSource implements Source {
	path: string;

	// Written out in full because Node's built-in TypeScript support can't strip `constructor(private path)`.
	constructor(path: string) {
		this.path = path;
	}

	getKey() {
		return this.path;
	}

	async getBytes(offset: number, length: number): Promise<RangeResponse> {
		const fd = openSync(this.path, 'r');
		try {
			const buffer = Buffer.alloc(length);
			const read = readSync(fd, buffer, 0, length, offset);
			return { data: buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + read) };
		} finally {
			closeSync(fd);
		}
	}
}

// Every tile address from zoom 0 up to and including maxZoom.
export function* tileCoordinates(maxZoom: number): Generator<[number, number, number]> {
	for (let z = 0; z <= maxZoom; z++) {
		for (let x = 0; x < 2 ** z; x++) {
			for (let y = 0; y < 2 ** z; y++) yield [z, x, y];
		}
	}
}

// Writes each tile in the archive to outDir/{z}/{x}/{y}.mvt, uncompressed. Returns how many it wrote.
export async function unpackTiles(archivePath: string, outDir: string, maxZoom = 5): Promise<number> {
	const archive = new PMTiles(new FileSource(archivePath));
	rmSync(outDir, { recursive: true, force: true });
	let written = 0;
	for (const [z, x, y] of tileCoordinates(maxZoom)) {
		const tile = await archive.getZxy(z, x, y);
		if (!tile) continue;
		const file = join(outDir, String(z), String(x), `${y}.mvt`);
		mkdirSync(dirname(file), { recursive: true });
		writeFileSync(file, new Uint8Array(tile.data));
		written++;
	}
	return written;
}
