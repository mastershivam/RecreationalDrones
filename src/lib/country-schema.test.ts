import { describe, expect, it } from 'vitest';
import { countrySchema } from './country-schema';

const valid = {
	name: 'Testland',
	iso3: 'TST',
	authority: 'Test Aviation Authority',
	authorityUrl: 'https://example.org/',
	registrationUrl: null,
	whoMustRegister: null,
	registrationWeightGrams: 250,
	minOperatorAge: null,
	remoteId: null,
	insurance: null,
	lastVerified: '2026-10-13',
	sources: ['https://example.org/rules'],
};

describe('countrySchema', () => {
	it('accepts a valid guide and coerces lastVerified to a Date', () => {
		const parsed = countrySchema.parse(valid);
		expect(parsed.lastVerified).toBeInstanceOf(Date);
	});

	it.each([
		['lowercase iso3', { iso3: 'tst' }],
		['two-letter iso3', { iso3: 'TS' }],
		['non-URL authorityUrl', { authorityUrl: 'example.org' }],
		['empty sources', { sources: [] }],
		['negative weight', { registrationWeightGrams: -1 }],
		['fractional age', { minOperatorAge: 17.5 }],
		['invalid date', { lastVerified: 'not a date' }],
	])('rejects %s', (_, override) => {
		expect(countrySchema.safeParse({ ...valid, ...override }).success).toBe(false);
	});

	it('requires nullable fields to be present, so unverified rules are explicit', () => {
		const { remoteId: _, ...missing } = valid;
		expect(countrySchema.safeParse(missing).success).toBe(false);
	});
});
