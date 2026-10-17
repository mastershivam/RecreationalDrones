import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { countrySchema } from '../lib/country-schema';
import { guideSummaries } from '../lib/guides';

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
		const entries = guides.map(({ file, frontmatter }) => ({
			id: file.replace(/\.mdx$/, ''),
			data: countrySchema.parse(frontmatter),
		}));
		expect(() => guideSummaries(entries)).not.toThrow();
	});
});

describe('Nepal guide', () => {
	const file = readFileSync(join(dir, 'nepal.mdx'), 'utf8');
	const data = countrySchema.parse(parse(file.match(/^---\n([\s\S]*?)\n---/)![1]));

	it('is keyed to the code the map uses for Nepal', () => {
		expect(data.iso3).toBe('NPL');
	});

	it('names the Civil Aviation Authority of Nepal as the authority', () => {
		expect(data.authority).toContain('Civil Aviation Authority of Nepal');
		expect(new URL(data.authorityUrl).hostname).toBe('caanepal.gov.np');
	});

	it('only states what the official CAAN registration documents say about insurance: over 2 kg', () => {
		expect(data.insurance).toContain('over 2 kg');
		expect(data.whoMustRegister).toContain('2 kg');
	});

	it('leaves unchecked rules unverified rather than guessing', () => {
		expect(data.minOperatorAge).toBeNull();
		expect(data.remoteId).toBeNull();
		expect(data.registrationWeightGrams).toBeNull();
	});

	it('gives the official fee and forms, which have to match the CAAN documents', () => {
		expect(file).toContain('USD 50 plus 13% VAT');
		expect(file).toContain('RPA/Form/001');
		expect(file).toContain('RPA/Form/002');
	});

	it('keeps bank account numbers out of the page, since they can go out of date', () => {
		const body = file.replace(/^---\n[\s\S]*?\n---/, '');
		expect(body).not.toMatch(/\d{12,}/);
		expect(body).not.toContain('1690100000133001');
	});

	it('says what it does not cover, so readers do not assume the rules are complete', () => {
		expect(file).toContain('Not covered yet');
	});

	it('cites the official CAAN documents as its sources', () => {
		expect(data.sources.length).toBeGreaterThanOrEqual(2);
		for (const url of data.sources) expect(url).toContain('caanepal.gov.np');
	});
});

