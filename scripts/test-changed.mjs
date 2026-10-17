// Runs the tests for what changed since the last commit, for a quick loop while working.
// Run the full suite (npm test, npm run test:e2e) before committing: a shared change can break specs
// this script does not map to.
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { basename } from 'node:path';

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).split('\n').filter(Boolean);
const changed = [...new Set([...git('diff', '--name-only', 'HEAD'), ...git('ls-files', '--others', '--exclude-standard')])];

// Map pages and the map to the end-to-end specs that exercise them.
const MAP_SPECS = ['globe', 'popup', 'search', 'zones', 'key', 'levels', 'external-links'];
const MAP_LIB = /^src\/lib\/(map-style|map-config|popup|zones|zone-|daynight|restrictiveness)/;
const specs = new Set();
for (const file of changed) {
	if (file.startsWith('e2e/') && file.endsWith('.e2e.ts')) specs.add(file);
	if (/^src\/(pages|layouts|components)\//.test(file)) specs.add('e2e/chrome.e2e.ts');
	const country = file.match(/^src\/content\/countries\/([^/]+)\.mdx$/);
	if (country) specs.add(`e2e/${country[1]}.e2e.ts`);
	if (file === 'src/pages/index.astro' || MAP_LIB.test(file) || file === 'src/styles/global.css') {
		for (const name of MAP_SPECS) specs.add(`e2e/${name}.e2e.ts`);
	}
}
const existingSpecs = [...specs].filter((spec) => existsSync(spec));

const sources = changed.filter((f) => /^src\/.*\.(ts|astro|mdx)$/.test(f) && !f.endsWith('.test.ts'));
let failed = false;

if (sources.length) {
	console.log(`Unit tests related to ${sources.length} changed file(s)`);
	const unit = spawnSync('npx', ['vitest', 'related', '--run', ...sources], { stdio: 'inherit' });
	failed ||= unit.status !== 0;
}
// Changed test files run themselves.
const testFiles = changed.filter((f) => f.endsWith('.test.ts') && existsSync(f));
if (testFiles.length) {
	const unit = spawnSync('npx', ['vitest', 'run', ...testFiles], { stdio: 'inherit' });
	failed ||= unit.status !== 0;
}

if (existingSpecs.length) {
	console.log(`End-to-end specs: ${existingSpecs.map((s) => basename(s)).join(', ')}`);
	const e2e = spawnSync('npx', ['playwright', 'test', ...existingSpecs], { stdio: 'inherit' });
	failed ||= e2e.status !== 0;
}

if (!sources.length && !testFiles.length && !existingSpecs.length) console.log('Nothing changed that has tests.');
process.exit(failed ? 1 : 0);
