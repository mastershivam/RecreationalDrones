import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const src = join(import.meta.dirname, '..');

function files(dir: string): string[] {
	return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
		const path = join(dir, e.name);
		return e.isDirectory() ? files(path) : [path];
	});
}

// The CSS a page or component ships: the <style> blocks of .astro files, and every .css file except the tokens.
const styles = files(src)
	.filter((f) => (f.endsWith('.astro') || f.endsWith('.css')) && !f.endsWith('tokens.css'))
	.map((file) => {
		const text = readFileSync(file, 'utf8');
		const css = file.endsWith('.css') ? text : [...text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n');
		return { file: file.slice(src.length + 1), css };
	})
	.filter(({ css }) => css.trim() !== '');

// Regression: the popup and dialog once had box-shadow: ... rgb(0 0 0 / 0.5), a colour that was not a token.
describe('DESIGN.md: tokens only, in every page and component', () => {
	it('finds the styles it is meant to check', () => {
		expect(styles.map((s) => s.file)).toContain('pages/index.astro');
		expect(styles.map((s) => s.file)).toContain('styles/global.css');
	});

	it.each(styles)('$file has no hard-coded color', ({ css }) => {
		expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
		expect(css).not.toMatch(/\b(rgb|rgba|hsl|hsla|oklch|lab|lch)\(/);
	});

	it.each(styles)('$file has no hard-coded font size', ({ css }) => {
		expect(css).not.toMatch(/font-size:\s*[\d.]+(rem|em|px)\b/);
	});
});

describe('tokens.css', () => {
	it('defines the four text sizes', () => {
		const tokens = readFileSync(join(src, 'styles/tokens.css'), 'utf8');
		for (const name of ['xs', 'sm', 'base', 'lg', 'xl']) expect(tokens).toContain(`--text-${name}:`);
	});
});
