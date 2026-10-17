import { describe, expect, it } from 'vitest';
import { staleItems } from './stale';

const item = (label: string, day: string) => ({ label, checkedOn: new Date(day) });
const now = new Date('2026-10-17T12:00:00Z');

describe('staleItems', () => {
	it('keeps items checked six months ago or more, oldest first', () => {
		const out = staleItems([item('b', '2026-03-01'), item('a', '2025-12-31'), item('c', '2026-04-17')], now);
		expect(out.map((i) => i.label)).toEqual(['a', 'b', 'c']);
	});

	it('leaves out items checked more recently', () => {
		expect(staleItems([item('x', '2026-04-18'), item('y', '2026-10-01')], now)).toEqual([]);
	});

	it('counts exactly six months as stale, and a day short as fresh', () => {
		expect(staleItems([item('edge', '2026-04-17')], now)).toHaveLength(1);
		expect(staleItems([item('edge', '2026-04-18')], now)).toHaveLength(0);
	});

	it('takes the number of months as a parameter', () => {
		expect(staleItems([item('x', '2026-08-01')], now, 2)).toHaveLength(1);
	});
});
