import { describe, expect, it } from 'vitest';
import { guideDescription } from './meta';

const guide = { name: 'Japan', restrictiveness: 3 as const, registrationFee: '900 to 2,400 yen per drone', lastVerified: new Date('2026-10-17') };

describe('guideDescription', () => {
	it('names the country, how strict the rules are, the fee and the date', () => {
		const text = guideDescription(guide);
		expect(text).toContain('Drone rules in Japan');
		expect(text).toContain('complex restrictions');
		expect(text).toContain('900 to 2,400 yen');
		expect(text).toContain('2026-10-17');
	});

	it('leaves the fee out when it is not known, rather than saying it is unknown', () => {
		const text = guideDescription({ ...guide, registrationFee: null });
		expect(text).not.toContain('Registration:');
		expect(text).toContain('How to register');
	});

	it('is different for each country', () => {
		expect(guideDescription({ ...guide, name: 'Canada' })).not.toBe(guideDescription(guide));
	});

	it('fits in a search result, cut at a word, even with a very long fee', () => {
		const text = guideDescription({ ...guide, registrationFee: 'a very long fee description '.repeat(10) });
		expect(text.length).toBeLessThanOrEqual(158);
		expect(text.endsWith('…')).toBe(true);
		expect(text).not.toMatch(/\s…$/);
	});
});
