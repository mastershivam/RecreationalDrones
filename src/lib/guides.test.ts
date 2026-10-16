import { describe, expect, it } from 'vitest';
import { guideSummaries } from './guides';

const entry = (id: string, iso3: string, overrides = {}) => ({
	id,
	data: {
		iso3,
		name: 'Testland',
		whoMustRegister: 'Everyone',
		minOperatorAge: 16,
		remoteId: null,
		insurance: null,
		lastVerified: new Date('2026-10-13T00:00:00Z'),
		...overrides,
	},
});

describe('guideSummaries', () => {
	it('keys summaries by iso3', () => {
		const out = guideSummaries([entry('united-kingdom', 'GBR'), entry('france', 'FRA')]);
		expect(Object.keys(out)).toEqual(['GBR', 'FRA']);
	});

	it('carries the key facts through, keeping unverified ones as null', () => {
		const { GBR } = guideSummaries([entry('united-kingdom', 'GBR')]);
		expect(GBR).toMatchObject({
			name: 'Testland',
			whoMustRegister: 'Everyone',
			minOperatorAge: 16,
			remoteId: null,
			insurance: null,
		});
	});

	it('formats lastVerified as a plain date', () => {
		expect(guideSummaries([entry('a', 'AAA')]).AAA.lastVerified).toBe('2026-10-13');
	});

	it('throws when two guides share an iso3', () => {
		expect(() => guideSummaries([entry('united-kingdom', 'GBR'), entry('great-britain', 'GBR')])).toThrow(
			/Duplicate iso3 GBR/,
		);
	});
});
