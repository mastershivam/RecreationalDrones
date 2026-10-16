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
];

describe('design tokens', () => {
	it.each(pairs)('%s on %s is at least %d:1 (%s)', (fg, bg, min) => {
		expect(contrastRatio(color(fg), color(bg))).toBeGreaterThanOrEqual(min);
	});
});
