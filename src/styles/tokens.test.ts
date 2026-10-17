import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { contrastRatio } from '../lib/contrast';

const css = readFileSync(join(import.meta.dirname, 'tokens.css'), 'utf8');
const color = (name: string): string => {
	const value = css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})\\s*;`))?.[1];
	if (!value) throw new Error(`--${name} missing or not a 6-digit hex color in tokens.css`);
	return value;
};

// [foreground, background, minimum ratio, why]
const pairs: [string, string, number, string][] = [
	['color-text', 'color-bg', 7, 'body text'],
	['color-text', 'color-surface', 7, 'text on cards'],
	['color-text-muted', 'color-bg', 4.5, 'secondary text'],
	['color-text-muted', 'color-surface', 4.5, 'secondary text on cards'],
	['color-link', 'color-bg', 4.5, 'links'],
	['color-link', 'color-surface', 4.5, 'links on cards'],
	['color-warning', 'color-surface', 4.5, 'unverified notices'],
	['color-on-accent', 'color-accent', 4.5, 'text on accent buttons'],
	['color-accent', 'color-bg', 3, 'accent UI and covered countries'],
	['color-land-border', 'color-land', 1.5, 'country borders stay visible'],
	['color-land', 'color-ocean', 3, 'land stands out from the sea'],
	['color-text', 'color-land', 4.5, 'country labels on land'],
	['color-text-muted', 'color-ocean', 4.5, 'ocean labels'],
	['color-accent', 'color-land', 3, 'covered countries stand out from land'],
	['color-level-1', 'color-land', 3, 'level 1 countries stand out from land'],
	['color-level-2', 'color-land', 3, 'level 2 countries stand out from land'],
	['color-level-3', 'color-land', 3, 'level 3 countries stand out from land'],
	['color-level-4', 'color-land', 2.4, 'level 4 countries stand out from land (the lowest of the four)'],
	['color-zone-airport', 'color-land', 3, 'airport zones show on land'],
	['color-zone-airport', 'color-ocean', 3, 'airport zones show over the sea'],
	['color-zone-approval', 'color-land', 3, 'approval zones show on land'],
	['color-zone-approval', 'color-ocean', 3, 'approval zones show over the sea'],
];

describe('design tokens', () => {
	it.each(pairs)('%s on %s is at least %d:1 (%s)', (fg, bg, min) => {
		expect(contrastRatio(color(fg), color(bg))).toBeGreaterThanOrEqual(min);
	});
});

// Adjacent levels must differ in lightness, not just hue, so they can be told apart without seeing color.
describe('restrictiveness levels', () => {
	it.each([1, 2, 3])('level %d and level %d differ in lightness by at least 1.2:1', (n) => {
		expect(contrastRatio(color(`color-level-${n}`), color(`color-level-${n + 1}`))).toBeGreaterThanOrEqual(1.2);
	});
});
