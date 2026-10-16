import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { countrySchema } from '../lib/country-schema';
import { guideUrls } from '../lib/guides';

const dir = join(import.meta.dirname, 'countries');
const guides = readdirSync(dir)
	.filter((f) => f.endsWith('.mdx'))
	.map((file) => {
		const frontmatter = readFileSync(join(dir, file), 'utf8').match(/^---\n([\s\S]*?)\n---/)?.[1];
		return { file, frontmatter: frontmatter === undefined ? undefined : parse(frontmatter) };
	});

describe('country guides', () => {
	it('has at least one guide', () => {
		expect(guides.length).toBeGreaterThan(0);
	});

	it.each(guides)('$file has valid frontmatter', ({ frontmatter }) => {
		expect(frontmatter).toBeDefined();
		const result = countrySchema.safeParse(frontmatter);
		expect(result.success, JSON.stringify(result.error?.issues)).toBe(true);
	});

	it.each(guides)('$file was verified no later than today', ({ frontmatter }) => {
		expect(new Date(frontmatter.lastVerified).getTime()).toBeLessThanOrEqual(Date.now());
	});

	it('has no two guides for the same country', () => {
		const entries = guides.map(({ file, frontmatter }) => ({ id: file.replace(/\.mdx$/, ''), data: frontmatter }));
		expect(() => guideUrls(entries)).not.toThrow();
	});
});
