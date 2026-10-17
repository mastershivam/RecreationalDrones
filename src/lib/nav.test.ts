import { describe, expect, it } from 'vitest';
import { isCurrent } from './nav';

describe('isCurrent', () => {
	it('matches the home link only on the home page', () => {
		expect(isCurrent('/', '/')).toBe(true);
		expect(isCurrent('/countries/', '/')).toBe(false);
		expect(isCurrent('/countries/nepal/', '/')).toBe(false);
	});

	it('matches the countries link on the list and on every guide below it', () => {
		expect(isCurrent('/countries/', '/countries/')).toBe(true);
		expect(isCurrent('/countries/nepal/', '/countries/')).toBe(true);
	});

	it('matches nothing on a page that is in neither section, such as a 404', () => {
		expect(isCurrent('/nope/', '/')).toBe(false);
		expect(isCurrent('/nope/', '/countries/')).toBe(false);
	});
});
