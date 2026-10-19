import { handleTileRequest, type TileBucket } from './lib/tile-server';
import { handleWeatherRequest, WEATHER_PATH } from './lib/weather-server';

interface Env {
	// Private R2 bucket holding basemap.pmtiles (see wrangler.toml).
	TILES: TileBucket;
	ASSETS: { fetch(request: Request): Promise<Response> };
}

// Only /tiles/* and /weather reach this Worker (wrangler.toml: run_worker_first), so the site's own files are
// served as plain static assets, with no Worker request counted against the plan.
export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		if (new URL(request.url).pathname.startsWith('/tiles/')) return handleTileRequest(request, env.TILES);
		if (new URL(request.url).pathname === WEATHER_PATH) return handleWeatherRequest(request);
		return env.ASSETS.fetch(request);
	},
};
