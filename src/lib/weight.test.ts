import { describe, expect, it } from 'vitest';
import { weightAnswer } from './weight';

describe('weightAnswer', () => {
	it('asks for a weight when there is none', () => {
		for (const g of [0, -5, NaN]) expect(weightAnswer(g, 250)).toContain('Enter');
	});
	it('says below, at and above the line', () => {
		expect(weightAnswer(200, 250)).toContain('under that');
		expect(weightAnswer(250, 250)).toContain('right at');
		expect(weightAnswer(300, 250)).toContain('over that');
	});
	it('says so when the threshold is unchecked or zero', () => {
		expect(weightAnswer(100, null)).toContain('not yet verified');
		expect(weightAnswer(100, 0)).toContain('any weight');
	});
	it('never says a flight is allowed', () => {
		for (const g of [100, 250, 400]) expect(weightAnswer(g, 250)).not.toMatch(/allowed|can fly|safe to fly/i);
	});
});
