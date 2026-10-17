import { describe, expect, it } from 'vitest';
import { nextTheme, themeLabel } from './theme';

describe('theme toggle', () => {
	it('flips the theme', () => {
		expect(nextTheme('dark')).toBe('light');
		expect(nextTheme('light')).toBe('dark');
	});
	it('says what a press does', () => {
		expect(themeLabel('dark')).toBe('Switch to light mode');
		expect(themeLabel('light')).toBe('Switch to dark mode');
	});
});
