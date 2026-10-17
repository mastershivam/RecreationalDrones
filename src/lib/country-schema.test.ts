import { describe, expect, it } from 'vitest';
import { countrySchema } from './country-schema';

const valid = {
	name: 'Testland',
	iso3: 'TST',
	authority: 'Test Aviation Authority',
	authorityUrl: 'https://example.org/',
	registrationUrl: null,
	whoMustRegister: null,
	restrictiveness: 2,
	restrictivenessReason: 'Register online with an online test.',
	registrationFee: null,
	howToRegister: null,
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
		['level 0', { restrictiveness: 0 }],
		['level 5', { restrictiveness: 5 }],
		['no reason for the level', { restrictivenessReason: '' }],
	])('rejects %s', (_, override) => {
		expect(countrySchema.safeParse({ ...valid, ...override }).success).toBe(false);
	});

	it('requires nullable fields to be present, so unverified rules are explicit', () => {
		const { remoteId: _, ...missing } = valid;
		expect(countrySchema.safeParse(missing).success).toBe(false);
	});

	it('accepts steps for how to register, and rejects an empty list of steps', () => {
		const how = { needed: ['An email address'], steps: ['Register online.'], validFor: '1 year', afterwards: null };
		expect(countrySchema.safeParse({ ...valid, howToRegister: how }).success).toBe(true);
		expect(countrySchema.safeParse({ ...valid, howToRegister: { ...how, steps: [] } }).success).toBe(false);
		expect(countrySchema.safeParse({ ...valid, howToRegister: { ...how, needed: [] } }).success).toBe(false);
	});

	it('requires howToRegister to be present, or explicitly null', () => {
		const { howToRegister: _, ...missing } = valid;
		expect(countrySchema.safeParse(missing).success).toBe(false);
	});

	it('requires a registration fee, or an explicit null', () => {
		const { registrationFee: _, ...missing } = valid;
		expect(countrySchema.safeParse(missing).success).toBe(false);
		expect(countrySchema.safeParse({ ...valid, registrationFee: '$5, valid 3 years' }).success).toBe(true);
	});
});
