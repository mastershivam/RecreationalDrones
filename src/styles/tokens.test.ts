import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { contrastRatio } from '../lib/contrast';

const css = readFileSync(join(import.meta.dirname, 'tokens.css'), 'utf8');
// The light theme's overrides, which sit after this marker in tokens.css.
const lightCss = css.slice(css.indexOf('prefers-color-scheme: light'));
const find = (source: string, name: string) => source.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})\\s*;`))?.[1];
const lightColor = (name: string): string => find(lightCss, name) ?? color(name);
const color = (name: string): string => {
	const value = find(css, name);
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
	['map-text', 'color-land', 4.5, 'country labels on land'],
	['map-text-muted', 'color-ocean', 4.5, 'ocean labels'],
	['map-text', 'color-ocean', 7, 'the headline over the globe'],
	['map-text-muted', 'color-ocean', 4.5, 'the hint over the globe'],
	['color-accent', 'color-land', 3, 'covered countries stand out from land'],
	['color-level-1', 'color-land', 3, 'level 1 countries stand out from land'],
	['color-level-2', 'color-land', 3, 'level 2 countries stand out from land'],
	['color-level-3', 'color-land', 3, 'level 3 countries stand out from land'],
	['color-level-4', 'color-land', 2.4, 'level 4 countries stand out from land (the lowest of the four)'],
	...[1, 2, 3, 4].map((n): [string, string, number, string] => ['color-on-accent', `color-level-${n}`, 4.5, `text on the level ${n} badge`]),
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

// The light theme only changes the page and its panels. Every pair that sits on the page must stay readable there too.
const lightPairs: [string, string, number][] = [
	['color-text', 'color-bg', 7],
	['color-text', 'color-surface', 7],
	['color-text', 'color-surface-raised', 7],
	['color-text-muted', 'color-bg', 4.5],
	['color-text-muted', 'color-surface', 4.5],
	['color-text-muted', 'color-surface-raised', 4.5],
	['color-link', 'color-bg', 4.5],
	['color-link', 'color-surface', 4.5],
	['color-warning', 'color-surface', 4.5],
	['color-warning', 'color-bg', 4.5],
	['color-focus', 'color-bg', 3],
	['color-on-accent', 'color-accent', 4.5],
	...[1, 2, 3, 4].map((n): [string, string, number] => ['color-on-accent', `color-level-${n}`, 4.5]),
];
// The theme toggle forces the light values with a second block, which must not drift from the system-driven one.
const declarations = (selector: string) => css.slice(css.indexOf(selector)).match(/\{([^}]*)\}/)![1].split(';').map((d) => d.trim()).filter(Boolean);
describe('light theme blocks', () => {
	it('hold the same values whether the system or the toggle chose light', () => {
		const bySystem = declarations(":root:not([data-theme='dark'])");
		const byToggle = declarations(":root[data-theme='light']");
		expect(byToggle.length).toBeGreaterThan(5);
		expect(byToggle).toEqual(bySystem);
	});
});

describe('light theme', () => {
	it('overrides the page colors and leaves the globe dark', () => {
		expect(lightCss).toContain('--color-bg');
		for (const globe of ['color-ocean', 'color-land', 'color-night', 'map-text']) expect(find(lightCss, globe), globe).toBeUndefined();
	});
	it.each(lightPairs)('%s on %s is at least %d:1', (fg, bg, min) => {
		expect(contrastRatio(lightColor(fg), lightColor(bg))).toBeGreaterThanOrEqual(min);
	});
});
