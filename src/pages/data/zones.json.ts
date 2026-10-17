import type { APIRoute } from 'astro';
import { zoneCollectionSchema } from '../../lib/zone-schema';

// Every zone file in data/zones/, as one file the map loads after the globe is up. Read as text, so dates stay text.
const files = import.meta.glob('../../../data/zones/*.geojson', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

export const GET: APIRoute = () => {
	const collections = Object.entries(files)
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([path, raw]) => {
			const data = JSON.parse(raw);
			// A zone file that breaks the schema fails the build instead of reaching the map.
			const result = zoneCollectionSchema.safeParse(data);
			if (!result.success) throw new Error(`${path} is not a valid zone file: ${JSON.stringify(result.error.issues)}`);
			return data;
		});
	return new Response(JSON.stringify(collections), { headers: { 'Content-Type': 'application/json' } });
};
