import { describe, expect, it } from 'vitest';
import { contrastRatio } from './contrast';

describe('contrastRatio', () => {
	it('is 21 for black on white', () => {
		expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
	});

	it('is 1 for identical colors', () => {
		expect(contrastRatio('#336699', '#336699')).toBeCloseTo(1, 5);
	});

	it('is symmetric', () => {
		expect(contrastRatio('#ff9f1c', '#0a0e1a')).toBeCloseTo(contrastRatio('#0a0e1a', '#ff9f1c'), 10);
	});

	it('matches a known WCAG value (#777 on white is about 4.48)', () => {
		expect(contrastRatio('#777777', '#ffffff')).toBeCloseTo(4.48, 2);
	});
});
