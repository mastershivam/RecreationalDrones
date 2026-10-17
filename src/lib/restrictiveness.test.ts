import { describe, expect, it } from 'vitest';
import { LEVELS, levelColorExpression, levelText } from './restrictiveness';

const colorOf = (level: number) => `#00000${level}`;

describe('LEVELS', () => {
	it('has four levels, numbered 1 to 4 in order, each with a label and written criteria', () => {
		expect(LEVELS.map((l) => l.level)).toEqual([1, 2, 3, 4]);
		for (const l of LEVELS) {
			expect(l.label.length).toBeGreaterThan(3);
			expect(l.criteria.endsWith('.')).toBe(true);
		}
	});
});

describe('levelText', () => {
	it('says the level out of four with its name, so color is never the only cue', () => {
		expect(levelText(2)).toBe('2 of 4: Register online');
		expect(levelText(3)).toBe('3 of 4: Complex registration');
	});
});

describe('levelColorExpression', () => {
	it('groups countries by level, in level order, with a fallback', () => {
		const expr = levelColorExpression({ GBR: { level: 2 }, NPL: { level: 3 }, FRA: { level: 2 } }, colorOf, '#ffffff');
		expect(expr).toEqual(['match', ['get', 'ADM0_A3'], ['GBR', 'FRA'], '#000002', ['NPL'], '#000003', '#ffffff']);
	});

	it('leaves out levels nobody is at, since a match branch cannot be empty', () => {
		const expr = levelColorExpression({ NPL: { level: 3 } }, colorOf, '#ffffff') as unknown[];
		expect(JSON.stringify(expr)).not.toContain('#000001');
		expect(expr).toHaveLength(5);
	});

	it('is just the fallback color when there are no guides, since a match needs a branch', () => {
		expect(levelColorExpression({}, colorOf, '#ffffff')).toBe('#ffffff');
	});
});
