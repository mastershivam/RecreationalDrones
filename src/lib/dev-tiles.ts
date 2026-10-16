import { createReadStream, statSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { TILE_PATH, parseRange, resolveRange } from './tile-server';

// Dev-server middleware (used from astro.config.mjs). `astro dev` has no Worker or R2, so this serves a local
// .pmtiles file at the same address the Worker uses in production, with the same byte-range behaviour.
export function serveDevTiles(file: string) {
	return (req: IncomingMessage, res: ServerResponse, next: () => void) => {
		if (req.url?.split('?')[0] !== TILE_PATH) return next();
		const size = statSync(file).size;
		const base = { 'Accept-Ranges': 'bytes', 'Content-Type': 'application/octet-stream' };

		const requested = parseRange(req.headers.range ?? null);
		if (!requested) {
			res.writeHead(200, { ...base, 'Content-Length': size });
			return req.method === 'HEAD' ? res.end() : void createReadStream(file).pipe(res);
		}
		const covered = resolveRange(requested, size);
		if (!covered) {
			res.writeHead(416, { 'Content-Range': `bytes */${size}` });
			return res.end();
		}
		res.writeHead(206, {
			...base,
			'Content-Range': `bytes ${covered.start}-${covered.end}/${size}`,
			'Content-Length': covered.end - covered.start + 1,
		});
		if (req.method === 'HEAD') return res.end();
		createReadStream(file, covered).pipe(res);
	};
}
