import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { REGIONS, regionOf } from './regions';

const slugs = readdirSync(join(import.meta.dirname, '../content/countries'))
	.filter((f) => f.endsWith('.mdx'))
	.map((f) => f.replace('.mdx', ''));

describe('regionOf', () => {
	it.each(slugs)('gives %s a listed region', (slug) => {
		expect(REGIONS).toContain(regionOf(slug));
	});
	it('puts EU members together and the rest apart', () => {
		expect(regionOf('germany')).toBe('European Union');
		expect(regionOf('united-kingdom')).toBe('Europe, outside the EU');
	});
	it('throws for a guide it does not know', () => {
		expect(() => regionOf('atlantis')).toThrow('atlantis');
	});
});
