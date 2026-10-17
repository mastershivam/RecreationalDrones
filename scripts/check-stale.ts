// Lists the country guides and curated zone files that nobody has checked against their source for six months.
// Prints a Markdown list, or nothing. The scheduled job (.github/workflows/refresh-data.yml) opens an issue from it.
// Bulk zone files (airports, model fields) are rebuilt by the same job, so only hand-checked files are listed.
// Run with: node scripts/check-stale.ts
import { readdirSync, readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { staleItems, type Checked } from '../src/lib/stale.ts';

const items: Checked[] = [];

const guides = new URL('../src/content/countries/', import.meta.url);
for (const file of readdirSync(guides).filter((f) => f.endsWith('.mdx'))) {
	const front = parse(readFileSync(new URL(file, guides), 'utf8').match(/^---\n([\s\S]*?)\n---/)![1]);
	items.push({ label: `Guide: ${front.name}`, checkedOn: new Date(front.lastVerified) });
}

const zones = new URL('../data/zones/', import.meta.url);
for (const file of readdirSync(zones).filter((f) => f.endsWith('.geojson'))) {
	const { meta } = JSON.parse(readFileSync(new URL(file, zones), 'utf8'));
	if (meta.verifiedOn) items.push({ label: `Zone file: ${file}`, checkedOn: new Date(meta.verifiedOn) });
}

const stale = staleItems(items, new Date());
if (stale.length) {
	console.log('These have not been checked against their source for six months or more:\n');
	for (const i of stale) console.log(`- ${i.label} (last checked ${i.checkedOn.toISOString().slice(0, 10)})`);
}
