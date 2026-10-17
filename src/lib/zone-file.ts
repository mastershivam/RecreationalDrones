import type { ZoneCollection } from './zone-schema';

// The text of a zone file: the meta block, then one zone per line. Compared with printing every coordinate on a line
// of its own, the file is a third of the size, and a pull request shows one changed line per changed zone.
export function zoneFileText({ meta, features }: Pick<ZoneCollection, 'meta' | 'features'> | { meta: unknown; features: unknown[] }): string {
	return `{"type":"FeatureCollection","meta":${JSON.stringify(meta)},"features":[\n${features.map((f) => JSON.stringify(f)).join(',\n')}\n]}\n`;
}
