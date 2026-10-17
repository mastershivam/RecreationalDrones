import { describe, expect, it } from 'vitest';
import { changedSince, markSeen, parseSaved, toggleSaved } from './saved';

describe('parseSaved', () => {
	it('reads a saved object and ignores anything else', () => {
		expect(parseSaved('{"JPN":"2026-10-01"}')).toEqual({ JPN: '2026-10-01' });
		for (const raw of [null, 'nope', '[]', '5', '{"JPN":3}']) expect(parseSaved(raw)).toEqual({});
	});
});

describe('toggleSaved', () => {
	it('saves, then unsaves', () => {
		const saved = toggleSaved({}, 'JPN', '2026-10-01');
		expect(saved).toEqual({ JPN: '2026-10-01' });
		expect(toggleSaved(saved, 'JPN', '2026-10-01')).toEqual({});
	});
});

describe('changedSince', () => {
	const guides = { JPN: { lastVerified: '2026-10-17' }, GBR: { lastVerified: '2026-09-01' } };
	it('lists saved countries checked after they were saved', () => {
		expect(changedSince({ JPN: '2026-10-01', GBR: '2026-09-01' }, guides)).toEqual(['JPN']);
	});
	it('ignores saved countries that no longer have a guide', () => {
		expect(changedSince({ XXX: '2020-01-01' }, guides)).toEqual([]);
	});
});

describe('markSeen', () => {
	it('moves the date on only for a saved country', () => {
		expect(markSeen({ JPN: '2026-10-01' }, 'JPN', '2026-10-17')).toEqual({ JPN: '2026-10-17' });
		expect(markSeen({}, 'JPN', '2026-10-17')).toEqual({});
	});
});
