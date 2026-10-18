import type { APIRoute } from 'astro';
import { zoneCollectionSchema } from '../../../lib/zone-schema';
import { zoneCountriesFromFiles } from '../../../lib/zones';

// Every zone file in data/zones/, read as text so dates stay text. The map loads one country's files at a time, when
// the map reaches that country (src/pages/index.astro), so nobody downloads zones for places they never look at.
const files = import.meta.glob('../../../../data/zones/*.geojson', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const nameOf = (path: string) => path.split('/').pop()!;

export function getStaticPaths() {
	return zoneCountriesFromFiles(Object.keys(files).map(nameOf)).map((iso3) => ({ params: { iso3: iso3.toLowerCase() } }));
}

export const GET: APIRoute = ({ params }) => {
	const collections = Object.entries(files)
		.filter(([path]) => nameOf(path).startsWith(`${params.iso3}-`))
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
