import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Each guide's social card is made by `node brand/build-og.mjs`; a new guide without one would share a broken picture.
const slugs = readdirSync(join(import.meta.dirname, 'countries'))
	.filter((f) => f.endsWith('.mdx'))
	.map((f) => f.replace('.mdx', ''));

describe('social cards', () => {
	it.each(slugs)('%s has public/og/%s.png', (slug) => {
		expect(existsSync(join(import.meta.dirname, '../../public/og', `${slug}.png`)), 'run: node brand/build-og.mjs').toBe(true);
	});
});
